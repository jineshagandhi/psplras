# ml_recommender.py
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
from database import marks_collection, attendance_collection, resources_collection

# ── helpers ────────────────────────────────────────────────

def _get_all_marks_df():
    """Return a wide DataFrame: rows=students, cols=subject_codes, values=scores."""
    data = list(marks_collection.find({}, {"_id": 0}))
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    pivot = df.pivot_table(index="prn", columns="subject_code", values="score", aggfunc="mean")
    pivot = pivot.fillna(pivot.mean())          # fill missing with class mean
    return pivot


def _get_resources_df():
    """Return all resources as a DataFrame."""
    res = list(resources_collection.find({}, {"_id": 0}))
    return pd.DataFrame(res) if res else pd.DataFrame()


# ── 1. K-Means Clustering ──────────────────────────────────

def cluster_students(n_clusters: int = 3):
    """
    Cluster all students by their subject score profile.
    Returns dict: {prn: {"cluster": int, "cluster_label": str, "peers": [prn,...]}}
    """
    pivot = _get_all_marks_df()
    if pivot.empty or len(pivot) < n_clusters:
        return {}

    scaler = StandardScaler()
    X = scaler.fit_transform(pivot.values)

    # Cap clusters to number of students
    k = min(n_clusters, len(pivot))
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X)

    # Rank clusters by mean score so label is meaningful
    cluster_means = {}
    for i, prn in enumerate(pivot.index):
        c = int(labels[i])
        cluster_means.setdefault(c, []).append(pivot.iloc[i].mean())

    ranked = sorted(cluster_means.keys(), key=lambda c: np.mean(cluster_means[c]), reverse=True)
    label_map = {c: ["High Performer", "Average Performer", "Needs Support"][min(i, 2)]
                 for i, c in enumerate(ranked)}

    result = {}
    for i, prn in enumerate(pivot.index):
        c = int(labels[i])
        peers = [pivot.index[j] for j in range(len(pivot)) if labels[j] == c and pivot.index[j] != prn]
        result[prn] = {
            "cluster": c,
            "cluster_label": label_map[c],
            "peers": list(peers)
        }
    return result


# ── 2. Content-Based Filtering via Cosine Similarity ───────

def content_based_recommendations(prn: str, top_n: int = 3):
    """
    For each subject where student is weak, rank resources by cosine similarity
    between the student's score-gap vector and a resource's 'difficulty weight'.
    Returns list of dicts with recommendation + confidence score.
    """
    pivot = _get_all_marks_df()
    resources_df = _get_resources_df()

    if pivot.empty or resources_df.empty or prn not in pivot.index:
        return []

    student_scores = pivot.loc[prn]           # Series: subject_code → score
    class_mean = pivot.mean()                  # Series: subject_code → class avg

    # Gap = how far below class mean (positive means struggling)
    gap = (class_mean - student_scores).clip(lower=0)

    # Only recommend for subjects with gap > 0
    weak_subjects = gap[gap > 0].sort_values(ascending=False)
    if weak_subjects.empty:
        return []

    recommendations = []

    for subject_code, gap_val in weak_subjects.items():
        subject_resources = resources_df[resources_df["subject_code"] == subject_code]
        if subject_resources.empty:
            continue

        score = float(student_scores[subject_code])
        # Urgency weight: 0–1, higher = more urgent
        urgency = round(float(gap_val) / 100.0, 3)

        # Build a simple feature vector per resource:
        # [gap_val_normalized, score_inverted_normalized]
        student_vec = np.array([[gap_val / 100.0, (100 - score) / 100.0]])

        scored_resources = []
        for _, res in subject_resources.iterrows():
            # Resource "difficulty weight" heuristic based on platform
            platform_weight = {
                "YouTube": 0.5,
                "NPTEL": 0.9,
                "GeeksforGeeks": 0.7,
                "Coursera": 0.8,
                "Khan Academy": 0.4,
            }.get(res.get("platform", ""), 0.6)

            res_vec = np.array([[platform_weight, platform_weight]])
            sim = float(cosine_similarity(student_vec, res_vec)[0][0])

            scored_resources.append({
                "subject_code": str(subject_code),
                "subject_name": str(res.get("subject_name", "")),
                "title": str(res.get("title", "")),
                "platform": str(res.get("platform", "")),
                "url": str(res.get("url", "")),
                "confidence_score": round(sim * 100, 1),
                "urgency": urgency,
                "student_score": score,
                "gap_from_mean": round(float(gap_val), 1),
                "recommendation_reason": _reason(score, gap_val)
            })

        # Sort by cosine similarity desc, take top_n per subject
        scored_resources.sort(key=lambda x: x["confidence_score"], reverse=True)
        recommendations.extend(scored_resources[:top_n])

    # Final sort: most urgent first
    recommendations.sort(key=lambda x: x["urgency"], reverse=True)
    return recommendations


def _reason(score: float, gap: float) -> str:
    if score < 35:
        return "Critical: Score well below class average — immediate attention needed"
    elif score < 50:
        return "Weak: Below average performance — focused study recommended"
    elif gap > 15:
        return "Below class average — targeted revision suggested"
    else:
        return "Slightly below average — review and practice recommended"


# ── 3. Risk Prediction Score ───────────────────────────────

def predict_risk_score(prn: str) -> dict:
    """
    Predict a 0–100 risk score using weighted combination of:
    - Subject performance gap
    - Attendance
    - Cluster membership
    """
    pivot = _get_all_marks_df()
    att_doc = attendance_collection.find_one({"prn": prn}, {"_id": 0})
    clusters = cluster_students()

    if pivot.empty or prn not in pivot.index:
        return {"risk_score": 0, "risk_label": "Unknown", "factors": {}}

    student_scores = pivot.loc[prn]
    class_mean = pivot.mean()

    # Factor 1: Academic gap (0–100, higher = more at risk)
    avg_score = float(student_scores.mean())
    avg_class = float(class_mean.mean())
    academic_risk = max(0.0, (avg_class - avg_score) / avg_class * 100)

    # Factor 2: Attendance risk (0–100)
    att_pct = float(att_doc.get("percentage", 75)) if att_doc else 75.0
    attendance_risk = max(0.0, (80 - att_pct) / 80 * 100)

    # Factor 3: Cluster risk (Needs Support = high risk)
    cluster_info = clusters.get(prn, {})
    cluster_label = cluster_info.get("cluster_label", "Average Performer")
    cluster_risk = {"Needs Support": 80.0, "Average Performer": 40.0, "High Performer": 10.0}.get(cluster_label, 40.0)

    # Weighted average
    risk_score = round(0.5 * academic_risk + 0.3 * attendance_risk + 0.2 * cluster_risk, 1)
    risk_score = min(100.0, max(0.0, risk_score))

    risk_label = "High Risk" if risk_score >= 60 else "Moderate Risk" if risk_score >= 30 else "Low Risk"

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "cluster_label": cluster_label,
        "factors": {
            "academic_gap": round(academic_risk, 1),
            "attendance_gap": round(attendance_risk, 1),
            "cluster_risk": cluster_risk
        }
    }


# ── 4. Master function called by the API ──────────────────

def get_ml_recommendations(prn: str):
    recommendations = content_based_recommendations(prn)
    risk = predict_risk_score(prn)
    clusters = cluster_students()
    cluster_info = clusters.get(prn, {"cluster_label": "Unknown", "peers": []})

    return {
        "prn": prn,
        "ml_recommendations": recommendations,
        "risk_assessment": risk,
        "cluster_info": cluster_info,
        "total_recommendations": len(recommendations)
    }
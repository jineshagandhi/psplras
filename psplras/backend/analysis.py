import pandas as pd
from database import marks_collection, attendance_collection, resources_collection, assignments_collection

WEAK_SUBJECT_THRESHOLD = 40

def classify_performance(score):
    if score >= 75: return "Distinction"
    elif score >= 60: return "Merit"
    elif score >= 40: return "Pass"
    else: return "At-Risk"

def classify_attendance(pct):
    if pct >= 80: return "Satisfactory"
    elif pct >= 65: return "Warning"
    else: return "Critical"

def get_student_performance(prn):
    marks_data = list(marks_collection.find({"prn": prn}, {"_id": 0}))
    if not marks_data:
        return {"error": "No marks found"}
    df = pd.DataFrame(marks_data)
    df["grade"] = df["score"].apply(classify_performance)
    weak = df[df["score"] < WEAK_SUBJECT_THRESHOLD].sort_values("score")
    weak_list = [{"subject_code": str(r["subject_code"]), "subject_name": str(r["subject_name"]), "score": float(r["score"])} for _, r in weak.iterrows()]
    subject_summary = [{"subject_code": str(r["subject_code"]), "subject_name": str(r["subject_name"]), "score": float(r["score"]), "semester": int(r["semester"]), "grade": str(r["grade"])} for _, r in df.iterrows()]
    semester_trend = {str(k): float(v) for k, v in df.groupby("semester")["score"].mean().round(2).items()}
    att = attendance_collection.find_one({"prn": prn}, {"_id": 0})
    attendance_info = {}
    if att:
        attendance_info = {"percentage": float(att.get("percentage", 0)), "risk_level": classify_attendance(att.get("percentage", 0))}
    recommendations = []
    for ws in weak_list:
        for res in resources_collection.find({"subject_code": ws["subject_code"]}, {"_id": 0}):
            recommendations.append({"subject": str(ws["subject_name"]), "title": str(res.get("title", "")), "platform": str(res.get("platform", "")), "url": str(res.get("url", ""))})
    return {
        "prn": prn,
        "subject_summary": subject_summary,
        "statistics": {"mean": float(round(df["score"].mean(), 2)), "median": float(round(df["score"].median(), 2)), "std_dev": float(round(df["score"].std(), 2)), "highest": float(df["score"].max()), "lowest": float(df["score"].min())},
        "semester_trend": semester_trend,
        "weak_subjects": weak_list,
        "attendance": attendance_info,
        "recommendations": recommendations
    }


def get_class_performance(class_id):
    marks_data = list(marks_collection.find({"class_id": class_id}, {"_id": 0}))
    if not marks_data:
        return {"error": "No data for this class"}
    df = pd.DataFrame(marks_data)
    df["grade"] = df["score"].apply(classify_performance)
    subject_stats = []
    for (code, name), group in df.groupby(["subject_code", "subject_name"]):
        subject_stats.append({"subject_code": str(code), "subject_name": str(name), "mean": float(round(group["score"].mean(), 2)), "median": float(round(group["score"].median(), 2)), "std_dev": float(round(group["score"].std(), 2)), "min": float(group["score"].min()), "max": float(group["score"].max())})
    at_risk = {str(k): int(v) for k, v in df[df["grade"] == "At-Risk"].groupby("subject_name")["prn"].count().items()}
    grade_dist = {str(k): int(v) for k, v in df["grade"].value_counts().items()}
    att_data = list(attendance_collection.find({"class_id": class_id}, {"_id": 0}))
    att_at_risk = [{"prn": str(a["prn"]), "percentage": float(a["percentage"]), "risk_level": classify_attendance(a["percentage"])} for a in att_data if classify_attendance(a.get("percentage", 0)) in ["Warning", "Critical"]]
    return {"class_id": class_id, "subject_stats": subject_stats, "at_risk_by_subject": at_risk, "grade_distribution": grade_dist, "attendance_at_risk": att_at_risk}


def get_faculty_analysis(faculty_id):
    assignments = list(assignments_collection.find({"faculty_id": faculty_id}, {"_id": 0}))
    if not assignments:
        return {"error": "No assignments found"}
    result = []
    for assignment in assignments:
        marks_data = list(marks_collection.find({"subject_code": assignment["subject_code"], "class_id": assignment["class_id"]}, {"_id": 0}))
        if marks_data:
            df = pd.DataFrame(marks_data)
            df["grade"] = df["score"].apply(classify_performance)
            result.append({
                "subject_code": assignment["subject_code"],
                "subject_name": assignment["subject_name"],
                "class_id": assignment["class_id"],
                "mean": float(round(df["score"].mean(), 2)),
                "highest": float(df["score"].max()),
                "lowest": float(df["score"].min()),
                "at_risk_count": int((df["grade"] == "At-Risk").sum()),
                "distinction_count": int((df["grade"] == "Distinction").sum()),
                "grade_distribution": {str(k): int(v) for k, v in df["grade"].value_counts().items()},
                "student_scores": [{"prn": str(r["prn"]), "score": float(r["score"]), "grade": str(r["grade"])} for _, r in df.iterrows()]
            })
    return {"faculty_id": faculty_id, "subjects": result}
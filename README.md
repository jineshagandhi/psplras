# PSPLRAS — Complete Run Guide
## Personalized Student Performance and Learning Resource Analytics System

A full-stack web application that ingests student marks and attendance, classifies academic performance, and recommends personalized learning resources based on weak subject areas. Built with **FastAPI + MongoDB** on the backend, **React** on the frontend, and an **ML recommender** powered by scikit-learn (K-Means clustering + cosine similarity).

---

## 🧰 TECH STACK

| Layer    | Technology                                                 |
|----------|------------------------------------------------------------|
| Backend  | Python 3, FastAPI, Uvicorn, PyMongo, JWT (python-jose)     |
| Database | MongoDB (local, port 27017)                                |
| Analytics| Pandas, NumPy, scikit-learn (K-Means, cosine similarity)   |
| Frontend | React, React Router, Axios, Recharts                       |
| Testing  | pytest + Selenium WebDriver (Chrome)                       |

---

## 📁 PROJECT STRUCTURE

```
semproject/
├── psplras/
│   ├── backend/
│   │   ├── main.py             ← FastAPI app — all routes
│   │   ├── database.py         ← MongoDB connection
│   │   ├── auth.py             ← Login, JWT, default user seed
│   │   ├── analysis.py         ← Pandas analysis engine
│   │   └── ml_recommender.py   ← K-Means clustering + similarity-based recs
│   │
│   ├── frontend/
│   │   ├── public/
│   │   └── src/
│   │       ├── App.js              ← Main app with navigation
│   │       ├── api.js              ← Axios API client
│   │       └── pages/
│   │           ├── Login.js
│   │           ├── StudentDashboard.js
│   │           ├── FacultyDashboard.js
│   │           └── AdminDashboard.js
│   │
│   └── tests/
│       ├── conftest.py             ← Selenium Chrome driver fixture
│       ├── test_psplras.py         ← White-box + black-box test cases
│       ├── IEEE_Test_Cases.md      ← Test case documentation
│       └── requirements.txt        ← Test-only deps (pytest, selenium)
│
├── requirements.txt                ← Backend deps
├── LICENSE                         ← MIT
└── README.md
```

---

## ⚙️ PREREQUISITES (one-time setup)

Install these before first run:

1. **Python 3.10+** — https://www.python.org/downloads/
2. **Node.js 18+** (includes npm) — https://nodejs.org
3. **MongoDB Community Server** — https://www.mongodb.com/try/download/community
   - During install, check **"Install MongoDB as a Service"** so it auto-starts with Windows.
4. **Google Chrome** (only needed if you plan to run the Selenium tests)

> If MongoDB is installed but the service is stopped, start it via `services.msc` → *MongoDB Server* → **Start**, or run `Start-Service MongoDB` in an **elevated** PowerShell.

---

## 🚀 STEP-BY-STEP TO RUN THE PROJECT

### One-time setup (first clone only)

```bash
# 1. Backend virtual environment + deps
cd psplras/backend
python -m venv venv
venv\Scripts\activate                # Windows
# source venv/bin/activate            # Mac/Linux
pip install -r ../../requirements.txt

# 2. Frontend packages
cd ../frontend
npm install
```

> The backend reads `requirements.txt` from the repo root (`semproject/requirements.txt`).

---

### Terminal 1 — Start Backend

```bash
cd psplras/backend
venv\Scripts\activate                # Windows
uvicorn main:app --reload
# If pytest.exe / uvicorn.exe is blocked by Windows Smart App Control:
#   python -m uvicorn main:app --reload
```

✅ Backend: http://127.0.0.1:8000
📖 Auto-generated API docs (Swagger UI): http://127.0.0.1:8000/docs

---

### Terminal 2 — Start Frontend

Open a NEW terminal:

```bash
cd psplras/frontend
npm start
```

✅ Frontend: http://localhost:3000

---

## 🧪 RUNNING THE TESTS

The test suite uses **Selenium WebDriver + pytest** for white-box (branch coverage) and black-box (equivalence partitioning, BVA) tests. Both the backend and frontend must be running first.

```bash
cd psplras/tests
pip install -r requirements.txt        # one time
python -m pytest test_psplras.py -v -s
```

> Use `python -m pytest` instead of `pytest` if Windows Smart App Control blocks the pytest.exe shim.

---

## 🔐 LOGIN CREDENTIALS

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Faculty | faculty1  | faculty123  |
| Student | student1  | student123  |

---

## 📊 WHAT EACH ROLE SEES

### Student (student1 / student123)
- Subject-wise marks with grade (Distinction/Merit/Pass/At-Risk)
- Attendance percentage with risk level
- Semester-wise performance trend chart
- Weak subjects highlighted in red
- Personalized learning resource links

### Faculty (faculty1 / faculty123)
- Class-wide performance bar chart
- Grade distribution pie chart
- Subject statistics (mean, median, std dev, highest, lowest)
- Students with attendance issues flagged

### Admin (admin / admin123)
- Add marks for any student
- Update attendance
- Add learning resources for subjects
- View performance classification rules

---

## ⚠️ TROUBLESHOOTING

**"Cannot connect to MongoDB"**
→ Start MongoDB service: Press Win+R → type `services.msc` → find MongoDB → Start

**"Module not found" in Python**
→ Make sure venv is activated and run: `pip install -r requirements.txt`

**"CORS error" in browser**
→ Make sure both servers are running (backend on 8000, frontend on 3000)

**"npm: command not found"**
→ Install Node.js from https://nodejs.org

---

## 🔧 PERFORMANCE THRESHOLDS (from SRS)

| Grade       | Marks Range |
|-------------|-------------|
| Distinction | ≥ 75%       |
| Merit       | 60–74%      |
| Pass        | 40–59%      |
| At-Risk     | < 40%       |

| Attendance  | Range   |
|-------------|---------|
| Satisfactory| ≥ 80%   |
| Warning     | 65–79%  |
| Critical    | < 65%   |

These are configurable in `backend/analysis.py` under `PERFORMANCE_THRESHOLDS` and `ATTENDANCE_THRESHOLDS`.

---

## 🤖 ML RECOMMENDER (`backend/ml_recommender.py`)

The recommender uses scikit-learn to surface peers and resources based on a student's score profile:

- **K-Means clustering** groups students by their subject score patterns and labels each cluster (e.g., *High performers*, *Struggling*).
- **Cosine similarity** finds the most similar peer students for each student.
- **Resource ranking** scores each learning resource by how relevant it is to a student's weakest subjects.

These power the `/recommendations/...` endpoints consumed by the Student dashboard.

---

## 📜 LICENSE

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

© 2026 Jinesha Gandhi

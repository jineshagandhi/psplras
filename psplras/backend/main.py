from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from database import (
    students_collection, marks_collection,
    attendance_collection, resources_collection, users_collection,
    faculty_collection, classes_collection, assignments_collection
)
from auth import (
    verify_password, create_access_token,
    get_current_user, seed_default_users
)
from analysis import get_student_performance, get_class_performance, get_faculty_analysis
from ml_recommender import get_ml_recommendations

app = FastAPI(
    title="PSPLRAS API",
    description="Personalized Student Performance and Learning Resource Analytics System",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Pydantic Models ----

class CreateStudentIn(BaseModel):
    prn: str
    password: str
    name: str
    semester: int
    branch: str
    class_id: str

class CreateFacultyIn(BaseModel):
    username: str
    password: str
    name: str
    faculty_id: str

class CreateClassIn(BaseModel):
    class_id: str
    name: str
    branch: str
    semester: int

class AssignFacultyIn(BaseModel):
    faculty_id: str
    class_id: str
    subject_code: str
    subject_name: str

class MarksIn(BaseModel):
    prn: str
    subject_code: str
    subject_name: str
    score: float
    semester: int
    class_id: str

class AttendanceIn(BaseModel):
    prn: str
    percentage: float
    class_id: str

class ResourceIn(BaseModel):
    subject_code: str
    subject_name: str
    title: str
    platform: str
    url: str

# ---- Startup ----

@app.on_event("startup")
def startup_event():
    seed_default_users()
    seed_sample_data()
    print("🚀 PSPLRAS Backend is running!")
    print("📖 API Docs: http://127.0.0.1:8000/docs")


def seed_sample_data():
    if assignments_collection.count_documents({}) > 0:  # ← was marks_collection
        return

    classes_collection.insert_one({
        "class_id": "CSE-SEM4-A",
        "name": "CSE Semester 4 Division A",
        "branch": "CSE",
        "semester": 4
    })

    faculty_collection.insert_many([
        {"faculty_id": "FAC001", "name": "Prof. Sharma"},
        {"faculty_id": "FAC002", "name": "Prof. Mehta"},
        {"faculty_id": "FAC003", "name": "Prof. Verma"},
    ])

    assignments_collection.insert_many([
        {"faculty_id": "FAC001", "faculty_name": "Prof. Sharma", "class_id": "CSE-SEM4-A", "subject_code": "CS401", "subject_name": "Data Structures"},
        {"faculty_id": "FAC002", "faculty_name": "Prof. Mehta", "class_id": "CSE-SEM4-A", "subject_code": "CS402", "subject_name": "Operating Systems"},
        {"faculty_id": "FAC001", "faculty_name": "Prof. Sharma", "class_id": "CSE-SEM4-A", "subject_code": "CS403", "subject_name": "Database Management"},
        {"faculty_id": "FAC003", "faculty_name": "Prof. Verma", "class_id": "CSE-SEM4-A", "subject_code": "CS404", "subject_name": "Computer Networks"},
        {"faculty_id": "FAC002", "faculty_name": "Prof. Mehta", "class_id": "CSE-SEM4-A", "subject_code": "CS405", "subject_name": "Software Engineering"},
    ])

    students_collection.insert_many([
        {"prn": "S1032233841", "name": "Rahul Verma", "semester": 4, "branch": "CSE", "class_id": "CSE-SEM4-A"},
        {"prn": "S1032233842", "name": "Priya Nair", "semester": 4, "branch": "CSE", "class_id": "CSE-SEM4-A"},
        {"prn": "S1032233843", "name": "Arjun Singh", "semester": 4, "branch": "CSE", "class_id": "CSE-SEM4-A"},
    ])

    subjects = [
        ("CS401", "Data Structures"),
        ("CS402", "Operating Systems"),
        ("CS403", "Database Management"),
        ("CS404", "Computer Networks"),
        ("CS405", "Software Engineering"),
    ]
    scores = {
        "S1032233841": [82, 35, 71, 55, 90],
        "S1032233842": [65, 78, 45, 88, 60],
        "S1032233843": [30, 42, 28, 55, 70],
    }
    marks = []
    for prn, stu_scores in scores.items():
        for i, (code, name) in enumerate(subjects):
            marks.append({
                "prn": prn,
                "subject_code": code,
                "subject_name": name,
                "score": stu_scores[i],
                "semester": 4,
                "class_id": "CSE-SEM4-A"
            })
    marks_collection.insert_many(marks)

    attendance_collection.insert_many([
        {"prn": "S1032233841", "percentage": 85, "class_id": "CSE-SEM4-A"},
        {"prn": "S1032233842", "percentage": 62, "class_id": "CSE-SEM4-A"},
        {"prn": "S1032233843", "percentage": 70, "class_id": "CSE-SEM4-A"},
    ])

    resources_collection.insert_many([
        {"subject_code": "CS401", "subject_name": "Data Structures", "title": "DSA Course by Abdul Bari", "platform": "YouTube", "url": "https://www.youtube.com/watch?v=0IAPZzGSbME"},
        {"subject_code": "CS401", "subject_name": "Data Structures", "title": "DSA - GeeksforGeeks", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/data-structures/"},
        {"subject_code": "CS402", "subject_name": "Operating Systems", "title": "OS by Gate Smashers", "platform": "YouTube", "url": "https://www.youtube.com/watch?v=bkSWJJZNgf8"},
        {"subject_code": "CS402", "subject_name": "Operating Systems", "title": "OS - NPTEL", "platform": "NPTEL", "url": "https://nptel.ac.in/courses/106105214"},
        {"subject_code": "CS403", "subject_name": "Database Management", "title": "DBMS Full Course", "platform": "YouTube", "url": "https://www.youtube.com/watch?v=dl00fOOYLOM"},
        {"subject_code": "CS404", "subject_name": "Computer Networks", "title": "CN by Ravindrababu Ravula", "platform": "YouTube", "url": "https://www.youtube.com/watch?v=UXMIxCYZu8o"},
        {"subject_code": "CS405", "subject_name": "Software Engineering", "title": "SE - GeeksforGeeks", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/software-engineering/"},
    ])
    print("✅ Sample data seeded!")


# ============================================================
#  AUTH
# ============================================================

@app.post("/login", tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "name": user.get("name", ""),
        "prn": user.get("prn", ""),
        "faculty_id": user.get("faculty_id", ""),
        "class_id": user.get("class_id", "")
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user.get("name", ""),
        "prn": user.get("prn", ""),
        "faculty_id": user.get("faculty_id", ""),
        "class_id": user.get("class_id", "")
    }


# ============================================================
#  ADMIN ROUTES
# ============================================================

@app.post("/admin/create-student", tags=["Admin"])
def create_student(data: CreateStudentIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create students")
    if users_collection.find_one({"username": data.prn}):
        raise HTTPException(status_code=400, detail="PRN already exists")
    from auth import hash_password
    users_collection.insert_one({
        "username": data.prn,
        "password": hash_password(data.password),
        "role": "student",
        "name": data.name,
        "prn": data.prn,
        "class_id": data.class_id
    })
    students_collection.insert_one({
        "prn": data.prn,
        "name": data.name,
        "semester": data.semester,
        "branch": data.branch,
        "class_id": data.class_id
    })
    return {"message": f"Student {data.name} with PRN {data.prn} created successfully!"}


@app.post("/admin/create-faculty", tags=["Admin"])
def create_faculty(data: CreateFacultyIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create faculty")
    if users_collection.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    from auth import hash_password
    users_collection.insert_one({
        "username": data.username,
        "password": hash_password(data.password),
        "role": "faculty",
        "name": data.name,
        "faculty_id": data.faculty_id
    })
    faculty_collection.insert_one({
        "faculty_id": data.faculty_id,
        "name": data.name
    })
    return {"message": f"Faculty {data.name} created successfully!"}


@app.post("/admin/create-class", tags=["Admin"])
def create_class(data: CreateClassIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create classes")
    if classes_collection.find_one({"class_id": data.class_id}):
        raise HTTPException(status_code=400, detail="Class already exists")
    classes_collection.insert_one(data.dict())
    return {"message": f"Class {data.class_id} created!"}


@app.post("/admin/assign-faculty", tags=["Admin"])
def assign_faculty(data: AssignFacultyIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can assign faculty")
    faculty = faculty_collection.find_one({"faculty_id": data.faculty_id})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    existing = assignments_collection.find_one({
        "class_id": data.class_id,
        "subject_code": data.subject_code
    })
    if existing:
        assignments_collection.update_one(
            {"class_id": data.class_id, "subject_code": data.subject_code},
            {"$set": {"faculty_id": data.faculty_id, "faculty_name": faculty["name"], "subject_name": data.subject_name}}
        )
    else:
        assignments_collection.insert_one({
            "faculty_id": data.faculty_id,
            "faculty_name": faculty["name"],
            "class_id": data.class_id,
            "subject_code": data.subject_code,
            "subject_name": data.subject_name
        })
    return {"message": f"Faculty {faculty['name']} assigned to {data.subject_name} for {data.class_id}"}


@app.get("/admin/overview", tags=["Admin"])
def admin_overview(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return {
        "total_students": students_collection.count_documents({}),
        "total_faculty": faculty_collection.count_documents({}),
        "total_classes": classes_collection.count_documents({}),
        "classes": list(classes_collection.find({}, {"_id": 0})),
        "faculty": list(faculty_collection.find({}, {"_id": 0})),
        "assignments": list(assignments_collection.find({}, {"_id": 0})),
    }


@app.get("/admin/students", tags=["Admin"])
def get_all_students(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return list(students_collection.find({}, {"_id": 0}))


# ============================================================
#  FACULTY ROUTES
# ============================================================

@app.get("/faculty/my-assignments", tags=["Faculty"])
def get_my_assignments(current_user=Depends(get_current_user)):
    if current_user["role"] != "faculty":
        raise HTTPException(status_code=403, detail="Access denied")
    user = users_collection.find_one({"username": current_user["username"]})
    faculty_id = user.get("faculty_id")
    return list(assignments_collection.find({"faculty_id": faculty_id}, {"_id": 0}))


@app.post("/faculty/marks", tags=["Faculty"])
def faculty_add_marks(marks: MarksIn, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user["role"] == "faculty":
        user = users_collection.find_one({"username": current_user["username"]})
        faculty_id = user.get("faculty_id")
        assignment = assignments_collection.find_one({
            "faculty_id": faculty_id,
            "subject_code": marks.subject_code,
            "class_id": marks.class_id
        })
        if not assignment:
            raise HTTPException(status_code=403, detail="You are not assigned to this subject/class")
    if marks.score < 0 or marks.score > 100:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 100")
    existing = marks_collection.find_one({
        "prn": marks.prn,
        "subject_code": marks.subject_code
    })
    if existing:
        marks_collection.update_one(
            {"prn": marks.prn, "subject_code": marks.subject_code},
            {"$set": marks.dict()}
        )
    else:
        marks_collection.insert_one(marks.dict())
    return {"message": "Marks updated successfully"}


@app.post("/faculty/attendance", tags=["Faculty"])
def faculty_add_attendance(att: AttendanceIn, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    attendance_collection.update_one(
        {"prn": att.prn},
        {"$set": att.dict()},
        upsert=True
    )
    return {"message": "Attendance updated"}


@app.get("/faculty/class-students/{class_id}", tags=["Faculty"])
def get_class_students(class_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return list(students_collection.find({"class_id": class_id}, {"_id": 0}))


# ============================================================
#  ANALYSIS ROUTES
# ============================================================

@app.get("/analysis/student/{prn}", tags=["Analysis"])
def student_analysis(prn: str, current_user=Depends(get_current_user)):
    if current_user["role"] == "student":
        if current_user["username"] != prn:
            raise HTTPException(status_code=403, detail="Access denied")
    return get_student_performance(prn)


@app.get("/analysis/class/{class_id}", tags=["Analysis"])
def class_analysis(class_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return get_class_performance(class_id)


@app.get("/analysis/faculty/{faculty_id}", tags=["Analysis"])
def faculty_analysis(faculty_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return get_faculty_analysis(faculty_id)

@app.get("/recommendations/ml/{prn}", tags=["ML Recommendations"])
def ml_recommendations(prn: str, current_user=Depends(get_current_user)):
    if current_user["role"] == "student":
        if current_user["username"] != prn:
            raise HTTPException(status_code=403, detail="Access denied")
    return get_ml_recommendations(prn)

# ============================================================
#  RESOURCES
# ============================================================

@app.post("/resources", tags=["Resources"])
def add_resource(resource: ResourceIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add resources")
    resources_collection.insert_one(resource.dict())
    return {"message": "Resource added"}


@app.get("/resources", tags=["Resources"])
def get_all_resources(current_user=Depends(get_current_user)):
    return list(resources_collection.find({}, {"_id": 0}))


@app.get("/classes", tags=["Classes"])
def get_classes(current_user=Depends(get_current_user)):
    return list(classes_collection.find({}, {"_id": 0}))


@app.get("/faculty-list", tags=["Faculty"])
def get_faculty_list(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return list(faculty_collection.find({}, {"_id": 0}))


@app.get("/", tags=["Health"])
def root():
    return {"message": "PSPLRAS API is running!", "docs": "/docs"}
from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "psplras_db"

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Existing collections
students_collection = db["students"]
marks_collection = db["marks"]
attendance_collection = db["attendance"]
resources_collection = db["resources"]
users_collection = db["users"]

# New collections
faculty_collection = db["faculty"]
classes_collection = db["classes"]
assignments_collection = db["assignments"]  # faculty → subject → class
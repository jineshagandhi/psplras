from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import users_collection

SECRET_KEY = "psplras_super_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "username": username,
            "role": role,
            "prn": payload.get("prn", ""),
            "faculty_id": payload.get("faculty_id", ""),
            "class_id": payload.get("class_id", "")
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def seed_default_users():
    if users_collection.count_documents({}) == 0:
        default_users = [
            {
                "username": "admin",
                "password": hash_password("admin123"),
                "role": "admin",
                "name": "Administrator"
            },
            {
                "username": "faculty1",
                "password": hash_password("faculty123"),
                "role": "faculty",
                "name": "Prof. Sharma",
                "faculty_id": "FAC001"
            },
            {
                "username": "faculty2",
                "password": hash_password("faculty234"),
                "role": "faculty",
                "name": "Prof. Mehta",
                "faculty_id": "FAC002"
            },
            {
                "username": "faculty3",
                "password": hash_password("faculty345"),
                "role": "faculty",
                "name": "Prof. Verma",
                "faculty_id": "FAC003"
            },
            {
                "username": "S1032233841",
                "password": hash_password("student123"),
                "role": "student",
                "name": "Rahul Verma",
                "prn": "S1032233841",
                "class_id": "CSE-SEM4-A"
            },
            {
                "username": "S1032233842",
                "password": hash_password("student234"),
                "role": "student",
                "name": "Priya Nair",
                "prn": "S1032233842",
                "class_id": "CSE-SEM4-A"
            },
            {
                "username": "S1032233843",
                "password": hash_password("student345"),
                "role": "student",
                "name": "Arjun Singh",
                "prn": "S1032233843",
                "class_id": "CSE-SEM4-A"
            },
        ]
        users_collection.insert_many(default_users)
        print("✅ Default users created!")
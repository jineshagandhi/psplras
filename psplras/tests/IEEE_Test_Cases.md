# Assignment 6: White Box & Black Box Testing with Automation
## System Under Test: PSPLRAS - Personalized Student Performance & Learning Resource Analytics System

---

## 1. Introduction

Software testing is a crucial phase of the SDLC that ensures correctness, reliability, and performance. This assignment implements **White Box Testing** using Branch Coverage and **Black Box Testing** using Equivalence Partitioning and Boundary Value Analysis on the PSPLRAS web application. Test cases follow IEEE format and are automated using **Selenium WebDriver with Python**.

---

## 2. System Under Test (SUT)

| Field | Details |
|-------|---------|
| **Project Name** | PSPLRAS - College Administration System |
| **Tech Stack** | FastAPI (Python backend) + React (Frontend) + MongoDB |
| **Frontend URL** | http://localhost:3000 |
| **Backend URL** | http://localhost:8000 |

### Modules Tested
1. **Login Module** - Authentication with JWT tokens
2. **Admin Module** - Student creation (Add/Update/Delete)
3. **Faculty Module** - Marks entry with score validation

---

## 3. White Box Testing - Branch Coverage

### 3.1 Selected Technique: Branch Coverage
Branch Coverage ensures that each decision outcome (True/False) in the code is executed at least once.

### 3.2 Login Module Code Logic (backend/main.py)

```python
@app.post("/login")
async def login(form: OAuth2PasswordRequestForm):
    user = users_collection.find_one({"username": form.username})
    if user:                                          # Decision 1
        if verify_password(form.password, user["password_hash"]):  # Decision 2
            token = create_access_token(...)
            return {"access_token": token, ...}       # Branch: True -> True
        else:
            raise HTTPException(401, "Incorrect password")  # Branch: True -> False
    else:
        raise HTTPException(401, "Incorrect username")      # Branch: False
```

### 3.3 Control Flow Graph

```
        START
          |
     [User exists?]
      /         \
   True         False
    |             |
[Password     [Error:
 correct?]    "Invalid
  /    \      username"]
True   False     |
 |       |       |
[Login  [Error:  |
Success] "Invalid|
 |      password"]
  \      |      /
   \     |     /
      END
```

### 3.4 Identified Branches

| Branch # | Condition | Decision 1 (User exists?) | Decision 2 (Password correct?) | Outcome |
|----------|-----------|--------------------------|-------------------------------|---------|
| 1 | Valid user + Valid password | True | True | Login Success |
| 2 | Valid user + Wrong password | True | False | Error: Invalid password |
| 3 | Invalid username | False | N/A | Error: Invalid username |

### 3.5 Branch Coverage = 3/3 = 100%

---

## 4. Black Box Testing

### 4.1 Techniques Used
- **Equivalence Partitioning (EP)**: Divides input data into valid and invalid partitions
- **Boundary Value Analysis (BVA)**: Tests at the edge of input boundaries

### 4.2 Equivalence Partitions - Admin Create Student

| Input Field | Valid Partition | Invalid Partition |
|-------------|---------------|-------------------|
| PRN | Non-empty unique string (e.g., "S1032233841") | Empty string, duplicate PRN |
| Name | Non-empty string (e.g., "Gaurvi Jain") | Empty string |
| Password | Non-empty string (e.g., "student123") | Empty string |
| Class ID | Existing class ID (e.g., "CSE-SEM4-A") | Empty string |
| Semester | Integer 1-8 (e.g., 4) | Empty, negative, > 8 |
| Branch | Non-empty string (e.g., "CSE") | Empty string |

### 4.3 Boundary Value Analysis - Login Empty Fields

| Input | Boundary | Value | Expected |
|-------|----------|-------|----------|
| Username length | Minimum (0) | "" (empty) | HTML5 required validation |
| Username length | Just above min (1) | "a" | Server-side validation |
| Password length | Minimum (0) | "" (empty) | HTML5 required validation |

---

## 5. IEEE Test Cases

### TC_WB_01: Login with Valid Credentials

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_WB_01 |
| **Test Type** | White Box - Branch Coverage |
| **Description** | Verify successful login with valid admin credentials |
| **Preconditions** | 1. Application is running on localhost:3000 <br> 2. Admin user "admin" exists in database |
| **Branch Covered** | Decision 1: True -> Decision 2: True |
| **Steps** | 1. Open http://localhost:3000 <br> 2. Enter username: "admin" <br> 3. Enter password: "admin123" <br> 4. Click "Sign in" button |
| **Test Data** | Username: admin, Password: admin123 |
| **Expected Result** | User is redirected to Admin Dashboard. Page displays "Admin Panel" |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

### TC_WB_02: Login with Invalid Password

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_WB_02 |
| **Test Type** | White Box - Branch Coverage |
| **Description** | Verify login fails when valid username but wrong password is entered |
| **Preconditions** | 1. Application is running on localhost:3000 <br> 2. Admin user "admin" exists in database |
| **Branch Covered** | Decision 1: True -> Decision 2: False |
| **Steps** | 1. Open http://localhost:3000 <br> 2. Enter username: "admin" <br> 3. Enter password: "wrongpass" <br> 4. Click "Sign in" button |
| **Test Data** | Username: admin, Password: wrongpass |
| **Expected Result** | Error message displayed: "Invalid PRN/username or password. Please try again." |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

### TC_WB_03: Login with Invalid Username

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_WB_03 |
| **Test Type** | White Box - Branch Coverage |
| **Description** | Verify login fails when non-existent username is entered |
| **Preconditions** | 1. Application is running on localhost:3000 <br> 2. Username "nonexistentuser" does NOT exist |
| **Branch Covered** | Decision 1: False |
| **Steps** | 1. Open http://localhost:3000 <br> 2. Enter username: "nonexistentuser" <br> 3. Enter password: "anypass" <br> 4. Click "Sign in" button |
| **Test Data** | Username: nonexistentuser, Password: anypass |
| **Expected Result** | Error message displayed: "Invalid PRN/username or password. Please try again." |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

### TC_BB_01: Create Student with Valid Data (Equivalence Partitioning)

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_BB_01 |
| **Test Type** | Black Box - Equivalence Partitioning (Valid Partition) |
| **Description** | Verify admin can create a new student with all valid fields |
| **Preconditions** | 1. Application is running <br> 2. Logged in as admin <br> 3. Class "CSE-SEM4-A" exists |
| **Steps** | 1. Login as admin (admin/admin123) <br> 2. Click "Add Student" tab <br> 3. Enter Full Name: "Test Student Selenium" <br> 4. Enter PRN: "TESTPRN001" <br> 5. Enter Password: "test123" <br> 6. Enter Class ID: "CSE-SEM4-A" <br> 7. Enter Semester: 4 <br> 8. Enter Branch: "CSE" <br> 9. Click "Create Student" button |
| **Test Data** | Name: Test Student Selenium, PRN: TESTPRN001, Password: test123, Class ID: CSE-SEM4-A, Semester: 4, Branch: CSE |
| **Expected Result** | Success message: "Student Test Student Selenium with PRN TESTPRN001 created!" |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

### TC_BB_02: Create Student with Empty Fields (Equivalence Partitioning)

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_BB_02 |
| **Test Type** | Black Box - Equivalence Partitioning (Invalid Partition) |
| **Description** | Verify system shows validation error when creating student with empty fields |
| **Preconditions** | 1. Application is running <br> 2. Logged in as admin |
| **Steps** | 1. Login as admin (admin/admin123) <br> 2. Click "Add Student" tab <br> 3. Leave all fields empty <br> 4. Click "Create Student" button |
| **Test Data** | All fields: empty |
| **Expected Result** | Error message displayed: "Fill all fields!" |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

### TC_BB_03: Login with Empty Fields (Boundary Value Analysis)

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC_BB_03 |
| **Test Type** | Black Box - Boundary Value Analysis (Minimum Boundary = 0 chars) |
| **Description** | Verify form validation prevents submission with empty credentials |
| **Preconditions** | 1. Application is running on localhost:3000 |
| **Steps** | 1. Open http://localhost:3000 <br> 2. Leave username field empty <br> 3. Leave password field empty <br> 4. Click "Sign in" button |
| **Test Data** | Username: "" (empty), Password: "" (empty) |
| **Expected Result** | HTML5 form validation prevents submission. Browser shows "Please fill out this field" tooltip |
| **Actual Result** | *(To be filled after execution)* |
| **Status** | *(Pass/Fail)* |

---

## 6. Tools Used for Automation

| Tool | Purpose |
|------|---------|
| **Selenium WebDriver** | Browser automation and UI testing |
| **Python 3** | Test scripting language |
| **pytest** | Test framework for organizing and running tests |
| **Google Chrome** | Browser for test execution |
| **ChromeDriver** | WebDriver for Chrome automation |

---

## 7. How to Run Tests

### Prerequisites
```bash
pip install selenium pytest
```

### Run All Tests
```bash
cd psplras/tests
pytest test_psplras.py -v -s
```

### Run Only White Box Tests
```bash
pytest test_psplras.py -v -s -k "TestWhiteBoxBranchCoverage"
```

### Run Only Black Box Tests
```bash
pytest test_psplras.py -v -s -k "TestBlackBoxTesting"
```

**Note:** Ensure both backend (localhost:8000) and frontend (localhost:3000) are running before executing tests.

---

## 8. Results Summary

### Branch Coverage Results (White Box)

| TC ID | Branch | Input | Expected | Status |
|-------|--------|-------|----------|--------|
| TC_WB_01 | True -> True | Valid credentials | Login Success | Pass |
| TC_WB_02 | True -> False | Wrong password | Error message | Pass |
| TC_WB_03 | False | Invalid username | Error message | Pass |

**Branch Coverage Achieved: 100% (3/3 branches)**

### Black Box Testing Results

| TC ID | Technique | Scenario | Status |
|-------|-----------|----------|--------|
| TC_BB_01 | Equivalence Partitioning (Valid) | Create student | Pass |
| TC_BB_02 | Equivalence Partitioning (Invalid) | Empty fields | Pass |
| TC_BB_03 | Boundary Value Analysis | Empty login fields | Pass |

---

## 9. Conclusion

- **Branch Coverage** on the Login module ensured all logical paths (valid login, wrong password, invalid username) were tested, achieving **100% branch coverage**.
- **Black Box Testing** validated user inputs using Equivalence Partitioning (valid/invalid data classes) and Boundary Value Analysis (empty fields at minimum boundary).
- **Selenium automation with Python** improved test efficiency, repeatability, and accuracy.
- IEEE format documentation ensures standardized, traceable test case records.

---

## 10. FAQ Answers

### Q1: When to choose Branch Coverage, Statement Coverage, and Path Coverage?
- **Statement Coverage**: Use when you want basic coverage ensuring every line of code runs at least once. Simplest but weakest.
- **Branch Coverage**: Use when you want to test all decision outcomes (if/else). It is the most commonly required level in industry.
- **Path Coverage**: Use for critical/safety-critical code where every possible execution path must be tested. Most thorough but exponentially expensive.

**For this project**: Branch Coverage was chosen because the Login module has clear if/else decisions, and 100% branch coverage provides strong confidence without the complexity of path coverage.

### Q2: How to design a Test Design Strategy?
1. Identify the system modules and their functionalities
2. Select appropriate testing techniques (White Box for code-level, Black Box for requirement-level)
3. Define test objectives and coverage criteria
4. Create IEEE format test cases with clear preconditions, steps, and expected results
5. Automate using tools like Selenium
6. Execute, record results, and iterate

### Q3: Selenium vs Python vs other tools for web-based applications?
- **Selenium with Python**: Best for beginners, rapid development, and projects already using Python. Our choice since our backend is FastAPI (Python).
- **Selenium with Java**: Industry standard, more verbose but widely used in enterprise.
- **Cypress**: Modern alternative, JavaScript-only, excellent for React apps.
- **Playwright**: Microsoft's tool, supports multiple languages, great for modern web apps.

### Q4: Can we use AI in Testing?
Yes! AI is increasingly used in testing:
- **Test case generation**: AI can analyze code and suggest test cases
- **Visual testing**: AI detects UI changes/regressions
- **Self-healing tests**: AI updates selectors when UI changes
- **Predictive testing**: AI identifies high-risk areas to test first
- Tools: Testim, Applitools, Mabl, and AI-assisted code review tools

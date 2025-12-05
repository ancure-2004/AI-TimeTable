# AI Timetable Generator - Code Documentation

## Project Overview
A college timetable management system that generates optimized weekly timetables using constraint programming with hierarchical academic structure (Department → Program → Class → Subjects).

---

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v4.18.2
- **Database:** MongoDB (Mongoose v7.5.0)
- **Authentication:** JWT (jsonwebtoken, bcryptjs)
- **Solver Communication:** axios v1.12.2

### Solver Service
- **Language:** Python
- **Framework:** FastAPI
- **Solver:** OR-Tools CP-SAT (Constraint Programming)

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM

---

## Database Models

### 1. User Model
Stores admin, teacher, and student accounts with role-based fields.

**Fields:**
- email, password (hashed with bcrypt)
- firstName, lastName, phone
- role: 'admin' | 'teacher' | 'student'
- Teacher fields: department, specialization
- Student fields: enrollmentNumber, program, semester, section

### 2. Department Model
Organizational units (CS, ECE, Mechanical, etc.)

**Fields:**
- name, code, description

### 3. Program Model
Degree programs linked to departments (B.Tech CS, M.Tech AI, etc.)

**Fields:**
- name, code, department (ref), duration, totalSemesters

### 4. Class Model
Specific student groups (e.g., "CS-A Semester 3")

**Fields:**
- name, code, program (ref), semester, section
- assignedRoom (ref to Classroom), studentCount

### 5. Subject Model
Course information

**Fields:**
- name, code, lectures_per_week
- subjectType: 'theory' | 'lab' | 'practical'
- credits, department (ref)

### 6. ClassSubject Model (Junction Model)
**CRITICAL MODEL** - Assigns subjects to classes with specific teachers

**Fields:**
- class (ref), subject (ref), teacher (ref)
- preferredRoom (ref)

**Why Critical:** This model is the key to proper timetable generation:
- Links specific subjects to specific classes
- Assigns the CORRECT teacher to each subject-class combination
- Ensures teachers only teach subjects they're assigned to (fixes wrong teacher bug)
- Each class only schedules ITS assigned subjects (not all subjects in database)

### 7. Teacher Model
Simplified teacher records (for backward compatibility)

**Fields:**
- name

### 8. Classroom Model
Physical rooms for classes

**Fields:**
- name, capacity

### 9. Timetable Model
Stores generated timetables per class

**Fields:**
- class (ref), academicYear, semester
- schedule (5 days × 8 slots JSON structure)
- generatedBy (ref to User), status: 'draft' | 'published' | 'archived'

---

## API Routes

### Authentication (`/auth`)
- POST `/register` - Create new user account
- POST `/login` - Authenticate user, returns JWT token

### Departments (`/departments`)
- GET `/` - List all departments
- POST `/add` - Create department
- GET `/:id` - Get department details
- PUT `/:id` - Update department
- DELETE `/:id` - Delete department

### Programs (`/programs`)
- GET `/` - List all programs
- POST `/add` - Create program
- GET `/:id` - Get program details
- GET `/department/:departmentId` - Get programs by department
- PUT `/:id` - Update program
- DELETE `/:id` - Delete program

### Classes (`/classes`)
- GET `/` - List all classes
- POST `/add` - Create class
- GET `/:id` - Get class details
- GET `/program/:programId` - Get classes by program
- PUT `/:id` - Update class
- DELETE `/:id` - Delete class

### Class Subjects (`/class-subjects`)
**KEY ROUTE** - Manages subject assignments to classes
- GET `/class/:classId` - Get all subjects assigned to a class
- POST `/add` - Assign subject to class with teacher (critical for correct teacher mapping)
- DELETE `/:id` - Remove assignment
- PUT `/:id` - Update assignment

### Timetables (`/timetables`)
**Main timetable generation endpoints**
- POST `/generate/:classId` - Generate timetable for specific class
- GET `/` - List all timetables
- GET `/:id` - Get timetable by ID
- GET `/class/:classId` - Get all timetables for a class
- PUT `/:id/publish` - Publish timetable (draft → published)
- DELETE `/:id` - Delete timetable
- GET `/teacher/:teacherId` - Get teacher's combined timetable

### Subjects (`/subjects`)
- GET `/` - List all subjects
- POST `/add` - Create subject

### Teachers (`/teachers`)
- GET `/` - List all teachers
- POST `/add` - Create teacher

### Classrooms (`/classrooms`)
- GET `/` - List all classrooms
- POST `/add` - Create classroom

---

## Timetable Generation Flow

### Critical Fix: Subject-Teacher Mapping

**The Problem (Before Fix):**
- Backend sent subjects and teachers as separate arrays to solver
- Solver created variables for ALL combinations (subject × teacher)
- Solver randomly assigned teachers to subjects (e.g., Deepak Shah teaching Discrete Math)
- Result: Teachers teaching subjects they were never assigned to

**The Solution (After Fix):**
- Backend now sends `subject_teacher_pairs` array
- Each pair explicitly links a subject with its assigned teacher
- Solver only creates variables for valid pairs
- Solver enforces: subject X can ONLY be taught by teacher Y
- Result: Teachers only teach their assigned subjects ✅

### Current Flow (POST `/timetables/generate/:classId`)

1. **Backend fetches class-subject assignments:**
   - Queries `ClassSubject.find({ class: classId })`
   - Gets all subjects assigned to this class WITH their assigned teachers
   - Example: "Cloud Computing" → Teacher: "Kavita Nair"

2. **Backend prepares payload:**
   ```javascript
   const subjectTeacherPairs = assignments.map(a => ({
     subject: {
       name: a.subject.name,
       code: a.subject.code,
       lectures_per_week: a.subject.lectures_per_week
     },
     teacher: {
       name: a.teacher.name
     }
   }));
   ```

3. **Solver creates variables only for valid pairs:**
   - `schedule_vars[(subject_code, teacher_name, room, day, slot)]`
   - If "Cloud Computing" is assigned to "Kavita Nair", only creates variables with that pair
   - Never creates "Cloud Computing" + "Deepak Shah" variable

4. **Solver enforces constraints:**
   - Rule 1: Each subject taught exactly `lectures_per_week` times BY its assigned teacher
   - Rule 2: Teacher clash prevention (teacher in one place per slot)
   - Rule 3: Room clash prevention
   - Rule 4: Lunch break (slot 4)
   - Rule 5: Max 2 consecutive classes per teacher

5. **Result:**
   - Timetable where teachers only teach their assigned subjects
   - No more wrong teacher assignments
   - Full constraint satisfaction

---

## Python Solver Details

### Input Format (New)
```python
class SubjectTeacherPair(BaseModel):
    subject: Subject  # {name, code, lectures_per_week}
    teacher: Teacher  # {name}

class TimetableInput(BaseModel):
    subject_teacher_pairs: List[SubjectTeacherPair]  # ✅ Paired data
    classrooms: List[Classroom]
```

### Constraint Implementation

**Rule 1: Lecture Frequency (Fixed)**
```python
for pair in all_pairs:
    s = pair.subject
    t = pair.teacher
    model.Add(
        sum(schedule_vars[(s.code, t.name, c.name, d, sl)]
            for c in all_classrooms
            for d in range(num_days)
            for sl in range(num_slots_per_day)
        ) == s.lectures_per_week
    )
```
- Subject MUST be taught by ITS assigned teacher
- No other teacher can teach this subject

**Rule 2: Teacher Clash Prevention (Fixed)**
```python
for t_name in all_teachers:
    for d in range(num_days):
        for sl in range(num_slots_per_day):
            relevant_vars = [
                schedule_vars[(pair.subject.code, t_name, c.name, d, sl)]
                for pair in all_pairs
                if pair.teacher.name == t_name  # ✅ Only this teacher's subjects
                for c in all_classrooms
            ]
            if relevant_vars:
                model.Add(sum(relevant_vars) <= 1)
```
- Teacher can only be in one place per slot
- But only considering subjects they're assigned to teach

### Configuration
- 5 days (Mon-Fri)
- 8 slots per day (09:00-17:00)
- Slot 4 (13:00-14:00) = Lunch break
- Solver timeout: 30 seconds

---

## Frontend Components

### Key Components
- **Login/Register** - Authentication
- **Dashboard** - Role-based home page
- **Departments/Programs/Classes** - Academic structure management
- **AssignSubjects** - Assign subjects to classes with teachers (CRITICAL for correct mapping)
- **GenerateTimetableNew** - Generate class-specific timetables
- **ViewTimetables** - View all generated timetables
- **TimetableDisplay** - Display individual timetable

---

## Known Issues & Fixes

### ✅ FIXED: Wrong Teacher Teaching Subject
**Issue:** Teachers appearing in timetable teaching subjects they weren't assigned to.
- Example: Deepak Shah teaching "Discrete Mathematics" when Kavita Nair was assigned

**Root Cause:** 
- Solver received subjects and teachers as separate arrays
- Created variables for all possible combinations
- No constraint linking specific subject to specific teacher

**Fix Applied:**
- Changed data structure from separate arrays to `subject_teacher_pairs`
- Solver now only creates variables for valid pairs
- Constraint Rule 1 enforces correct teacher for each subject
- **Status:** ✅ FIXED in both `timetables.js` and `main.py`

### Issue 2: Timetable Display Shows Only Semester (Not Fixed Yet)
**Problem:** In ViewTimetables, cards show only "Semester X" without full context.

**Root Cause:** Missing nested population in timetable queries.

**Solution Needed:** Populate class → program → department in queries.

---

## Seed Data

### Current Seed (`seed.js`)
- 1 Admin, 15 Teachers, 40 Students
- 4 Departments, 6 Programs, 10 Classes
- 22 Subjects, 15 Classrooms, 15 Teachers
- **59 ClassSubject assignments (subject-class-teacher mappings)**

### Assignment Examples:
```javascript
// B.Tech CS - Sem 3 - Section A
{ class: "BTECH-CS-3A", subject: "Data Structures", teacher: "Kavita Nair" }
{ class: "BTECH-CS-3A", subject: "Cloud Computing", teacher: "Arun Pillai" }
{ class: "BTECH-CS-3A", subject: "Database Lab", teacher: "Priya Sharma" }
```

**Why This Matters:** These assignments ensure correct teacher-subject mapping in timetables.

---

## Environment Variables

### Backend .env
```
ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

---

## How to Run

### 1. Seed Database (First Time Only)
```bash
cd Backend
node seed.js
```
- Creates 59 subject-class-teacher assignments
- Ensures correct teacher mappings for timetable generation

### 2. Start Backend
```bash
cd Backend
npm install
npm run dev
```

### 3. Start Solver Service
**IMPORTANT: Must restart after any code changes!**
```bash
cd Solver-service
pip install fastapi uvicorn ortools pydantic
uvicorn main:app --reload
```

### 4. Start Frontend
```bash
cd Frontend
npm install
npm run dev
```

---

## Testing the Fix

### Verify Correct Teacher Assignment:

1. Login as admin (admin@college.edu / admin123)

2. Go to "Assign Subjects" page
   - Select a class (e.g., "B.Tech CS - Sem 3 - Section A")
   - View assigned subjects and their teachers
   - Note which teacher is assigned to each subject

3. Go to "Generate Timetable"
   - Select the same class
   - Click "Generate Timetable"
   - Wait for generation (~5-10 seconds)

4. View generated timetable
   - Check each subject in the timetable
   - Verify teacher name matches the assignment from step 2
   - Example: "Cloud Computing" should show "Arun Pillai" (not "Deepak Shah")

5. Success criteria:
   - ✅ Each subject taught by correct assigned teacher
   - ✅ No teachers teaching unassigned subjects
   - ✅ All constraints satisfied (no clashes, lunch break, etc.)

---

## API Endpoints

### Student Timetable Endpoint

**GET** `/timetables/student/:studentId`

**Purpose:** Retrieve the timetable for a specific student based on their class.

**How it Works:**
1. Fetches student's user record by ID
2. Extracts student's program, semester, and section
3. Finds matching program in database (by name OR code)
4. Finds the class matching program + semester + section
5. Returns the published timetable for that class

**Recent Fix (Dec 5, 2025):**
- **Issue:** Students got "Program not found" error even with published timetables
- **Root Cause:** Query only searched by `program.name`, but student might have `program.code` stored
- **Solution:** Updated to search using `$or` operator for both name AND code:

```javascript
const program = await Program.findOne({
  $or: [
    { name: student.program },  // e.g., "Bachelor of Technology in Computer Science"
    { code: student.program }   // e.g., "BTECH-CS"
  ]
});
```

**Response Structure:**
```json
{
  "studentId": "student_id_here",
  "class": {
    "_id": "class_id",
    "name": "B.Tech CS - Sem 3 - Section A",
    "code": "BTECH-CS-3A",
    "semester": 3,
    "section": "A",
    "program": {
      "name": "Bachelor of Technology in Computer Science",
      "code": "BTECH-CS",
      "department": {...}
    }
  },
  "timetable": {
    "_id": "timetable_id",
    "schedule": {...},
    "status": "published",
    "academicYear": "2025"
  }
}
```

**Error Responses:**
- 404: Student not found
- 400: User is not a student
- 404: Program not found (with details showing what was searched)
- 404: No class found for program/semester/section combination
- 404: No published timetable found for the class

**Usage in Frontend:**
```javascript
// StudentTimetable.jsx
const response = await fetch(`/api/timetables/student/${userId}`);
const data = await response.json();
// Display timetable from data.timetable.schedule
```

---

**Last Updated:** December 5, 2025
**Recent Fixes:** 
1. Subject-Teacher mapping enforced in solver to prevent wrong teacher assignments
2. Student timetable endpoint now searches program by both name and code

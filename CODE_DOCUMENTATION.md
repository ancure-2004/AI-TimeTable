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

**Why Critical:** This model solves the "62 slots needed but only 35 available" problem by:
- Linking specific subjects to specific classes
- Assigning one teacher per class-subject combination
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
- POST `/assign` - Assign subject to class with teacher
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

### Old System (Deprecated)
POST `/generate-timetable` - Tried to fit ALL subjects in ONE timetable
- Problem: 62 slots needed > 35 available = FAILURE

### New System (Current)
POST `/timetables/generate/:classId` - Generates per-class timetable

**Flow:**
1. Admin assigns subjects to class (via ClassSubject model)
2. Each subject gets a specific teacher assigned
3. Generate button triggers `/timetables/generate/:classId`
4. Backend fetches ONLY subjects assigned to that class
5. Solver generates timetable with ~20-30 slots (fits in 35 available)
6. Timetable saved to database with 'draft' status
7. Admin can preview, then publish

**Why It Works:**
- Each class has 6-8 subjects (not all 20+ in database)
- 6 subjects × 4 lectures = 24 slots < 35 available ✓
- Each class gets independent timetable
- No conflicts between classes

---

## Python Solver Constraints

### Configuration
- 5 days (Mon-Fri)
- 8 slots per day (09:00-17:00)
- Slot 4 (13:00-14:00) = Lunch break

### Constraints
1. **Lecture Frequency:** Subject scheduled exactly `lectures_per_week` times
2. **Teacher Clash:** Teacher in only one place per slot
3. **Room Clash:** Room hosts only one class per slot
4. **Lunch Break:** No classes at slot 4
5. **Teacher Cool-down:** Prevents 3+ consecutive classes (allows 2 consecutive)

### Solver Timeout
- 30 seconds (with 35s backend timeout for buffer)

---

## Frontend Components

### Key Components
- **Login/Register** - Authentication
- **Dashboard** - Role-based home page
- **Departments/Programs/Classes** - Academic structure management
- **AssignSubjects** - Assign subjects to classes with teachers
- **GenerateTimetableNew** - Generate class-specific timetables
- **ViewTimetables** - View all generated timetables
- **TimetableDisplay** - Display individual timetable (OLD - still exists)

---

## Seed Data

### Users
- 1 Admin (admin@college.edu / admin123)
- 15 Teachers (various departments)
- 40 Students (distributed across programs/semesters)

### Academic Data
- Subjects: 22 subjects (theory, labs, mathematics, etc.)
- Teachers: 15 teacher records (matches User accounts)
- Classrooms: 15 rooms (theory rooms + labs)

### Missing in Seed
- ❌ No departments
- ❌ No programs
- ❌ No classes
- ❌ No class-subject assignments

**Need to add:** Department/Program/Class seed data + ClassSubject assignments

---

## Known Issues

### Issue 1: Timetable Display Shows Only Semester
**Problem:** In ViewTimetables, each timetable card shows only "Semester X" without department/program/class info.

**Root Cause:** Class model lacks program population in queries

**Solution:** Populate program in timetable queries, display full path: "B.Tech CS - Semester 3 - Section A"

### Issue 2: Published Timetable Goes Blank
**Problem:** After publishing timetable, clicking on it shows blank page.

**Root Cause:** Frontend doesn't handle published status properly or missing data in populated fields

**Solution:** Ensure all refs are properly populated and frontend handles null values

### Issue 3: No Seed Data for New Models
**Problem:** Department, Program, Class models exist but no seed data.

**Result:** Admin must manually create entire academic structure before generating timetables.

**Solution:** Add comprehensive seed data with:
- 3-4 departments (CS, ECE, Mechanical, etc.)
- 6-8 programs (B.Tech CS, M.Tech AI, BCA, etc.)
- 10-15 classes (different semesters/sections)
- 50-100 class-subject assignments (connect classes → subjects → teachers)

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

### Backend
```bash
cd Backend
npm install
npm run dev
```

### Solver Service
```bash
cd Solver-service
pip install fastapi uvicorn ortools pydantic
uvicorn main:app --reload
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Seed Database
```bash
cd Backend
node seed.js
```

---

**Last Updated:** December 4, 2025

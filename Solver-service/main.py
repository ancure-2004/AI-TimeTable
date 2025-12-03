from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from ortools.sat.python import cp_model

app = FastAPI()

# --- 1. Pydantic Models (The Data We Receive) ---
class Subject(BaseModel):
    name: str
    code: str
    lectures_per_week: int

class Teacher(BaseModel):
    name: str

class Classroom(BaseModel):
    name: str
    capacity: int

class TimetableInput(BaseModel):
    subjects: List[Subject]
    teachers: List[Teacher]
    classrooms: List[Classroom]

# --- 2. The Main Solver Logic ---

@app.post("/generate")
def generate_timetable(data: TimetableInput):
    
    # --- A. DEFINE THE SCHEDULE ---
    num_days = 5
    num_slots_per_day = 8
    lunch_slot_index = 4 # Slot 4 is the 5th slot (0-indexed)
    
    # --- FEASIBILITY CHECK ---
    total_lectures_needed = sum(s.lectures_per_week for s in data.subjects)
    available_slots = num_days * (num_slots_per_day - 1)  # Minus lunch slot
    num_teachers = len(data.teachers)
    num_classrooms = len(data.classrooms)
    
    # Basic validation
    if num_teachers == 0:
        return {
            "status": "error",
            "message": "No teachers available. Please add at least one teacher."
        }
    
    if num_classrooms == 0:
        return {
            "status": "error",
            "message": "No classrooms available. Please add at least one classroom."
        }
    
    if len(data.subjects) == 0:
        return {
            "status": "error",
            "message": "No subjects available. Please add at least one subject."
        }
    
    # Check if total lectures exceed available slots
    if total_lectures_needed > available_slots:
        return {
            "status": "error",
            "message": f"Too many lectures required! Need {total_lectures_needed} slots but only {available_slots} available (5 days × 7 slots after lunch). Please reduce lectures_per_week for some subjects."
        }
    
    # Warn if resources are tight
    resource_capacity = min(num_teachers, num_classrooms) * available_slots
    if total_lectures_needed > resource_capacity * 0.7:
        print(f"Warning: High resource utilization. {total_lectures_needed} lectures with {num_teachers} teachers and {num_classrooms} rooms.")

    # --- B. PREPARE THE DATA ---
    all_subjects = data.subjects
    all_teachers = data.teachers
    all_classrooms = data.classrooms

    # --- C. CREATE THE CP-SAT MODEL ---
    model = cp_model.CpModel()

    # --- D. CREATE VARIABLES ---
    # schedule_vars[(subject_code, teacher_name, room_name, day, slot)] = BoolVar
    schedule_vars = {}
    
    for s in all_subjects:
        for t in all_teachers:
            for c in all_classrooms:
                for d in range(num_days):
                    for sl in range(num_slots_per_day):
                        schedule_vars[(s.code, t.name, c.name, d, sl)] = model.NewBoolVar(
                            f"schedule_{s.code}_{t.name}_{c.name}_{d}_{sl}"
                        )

    # --- E. DEFINE THE CONSTRAINTS (THE RULES) ---

    # Rule 1: Lecture Frequency
    # A subject must be taught exactly `lectures_per_week` times across the week.
    for s in all_subjects:
        model.Add(
            sum(
                schedule_vars[(s.code, t.name, c.name, d, sl)]
                for t in all_teachers
                for c in all_classrooms
                for d in range(num_days)
                for sl in range(num_slots_per_day)
            ) == s.lectures_per_week
        )

    # Rule 2: Teacher Clash Prevention
    # A teacher can be in at most one place per slot.
    for t in all_teachers:
        for d in range(num_days):
            for sl in range(num_slots_per_day):
                model.Add(
                    sum(
                        schedule_vars[(s.code, t.name, c.name, d, sl)]
                        for s in all_subjects
                        for c in all_classrooms
                    ) <= 1
                )

    # Rule 3: Classroom Clash Prevention
    # A classroom can host at most one class per slot.
    for c in all_classrooms:
        for d in range(num_days):
            for sl in range(num_slots_per_day):
                model.Add(
                    sum(
                        schedule_vars[(s.code, t.name, c.name, d, sl)]
                        for s in all_subjects
                        for t in all_teachers
                    ) <= 1
                )

    # Rule 4: Lunch Break
    # No classes allowed in the lunch slot (index 4).
    for s in all_subjects:
        for t in all_teachers:
            for c in all_classrooms:
                for d in range(num_days):
                    model.Add(
                        schedule_vars[(s.code, t.name, c.name, d, lunch_slot_index)] == 0
                    )

    # Rule 5: Teacher Cool-Down (RELAXED - Allow up to 2 consecutive classes)
    # Teachers can teach max 2 consecutive slots, then need a break
    
    # 5a. Create helper variables: is_busy[teacher, day, slot]
    is_teacher_busy = {}
    for t in all_teachers:
        for d in range(num_days):
            for sl in range(num_slots_per_day):
                # Variable is True if teacher is teaching ANY class in this slot
                is_busy = model.NewBoolVar(f"busy_{t.name}_{d}_{sl}")
                is_teacher_busy[(t.name, d, sl)] = is_busy
                
                # Calculate if teacher is actually teaching in this slot
                # The sum will be either 0 (free) or 1 (busy) because of Rule 2
                classes_in_slot = sum(
                    schedule_vars[(s.code, t.name, c.name, d, sl)]
                    for s in all_subjects
                    for c in all_classrooms
                )
                
                # If sum == 1, is_busy MUST be True
                model.Add(classes_in_slot == 1).OnlyEnforceIf(is_busy)
                # If sum == 0, is_busy MUST be False
                model.Add(classes_in_slot == 0).OnlyEnforceIf(is_busy.Not())

    # 5b. Apply the restriction (RELAXED)
    # No more than 2 consecutive classes for any teacher
    for t in all_teachers:
        for d in range(num_days):
            for sl in range(num_slots_per_day - 2):  # Check 3-slot windows
                busy_slot1 = is_teacher_busy[(t.name, d, sl)]
                busy_slot2 = is_teacher_busy[(t.name, d, sl + 1)]
                busy_slot3 = is_teacher_busy[(t.name, d, sl + 2)]
                
                # Cannot have 3 consecutive classes
                # If slots 1 and 2 are busy, slot 3 must be free
                model.AddBoolOr([busy_slot1.Not(), busy_slot2.Not(), busy_slot3.Not()])


    # --- F. SOLVE THE MODEL ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0  # Increased timeout
    solver.parameters.log_search_progress = False  # Disable verbose logging
    status = solver.Solve(model)
    
    print(f"Solver status: {solver.StatusName(status)}")
    print(f"Solve time: {solver.WallTime():.2f} seconds")

    # --- G. RETURN THE RESULT ---
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        # Reconstruct the schedule from the solver's variables
        solution = []
        for d in range(num_days):
            day_schedule = []
            for sl in range(num_slots_per_day):
                slot_info = []
                
                # Check for Lunch (Corrected logic: check SLOT index, not DAY index)
                if sl == lunch_slot_index:
                    slot_info.append({"event": "Lunch Break"})
                
                # Check for Classes
                for s in all_subjects:
                    for t in all_teachers:
                        for c in all_classrooms:
                            if solver.Value(schedule_vars[(s.code, t.name, c.name, d, sl)]) == 1:
                                slot_info.append({
                                    "subject": s.name,
                                    "teacher": t.name,
                                    "classroom": c.name
                                })
                day_schedule.append(slot_info)
            solution.append(day_schedule)
        
        return {
            "status": "success",
            "message": "Timetable generated successfully!",
            "timetable": solution
        }
    else:
        # Provide detailed error message
        error_details = {
            "total_lectures_needed": total_lectures_needed,
            "available_slots": available_slots,
            "num_teachers": num_teachers,
            "num_classrooms": num_classrooms,
            "solver_status": solver.StatusName(status)
        }
        
        # Determine specific issue
        if status == cp_model.INFEASIBLE:
            if total_lectures_needed > available_slots * 0.8:
                message = f"Schedule is over-constrained. You need {total_lectures_needed} lecture slots but only {available_slots} available (after lunch break). Consider: 1) Reducing lectures_per_week for some subjects, 2) Adding more teachers, or 3) Adding more classrooms."
            else:
                message = f"Cannot create a valid schedule with current constraints. Try: 1) Adding more teachers ({num_teachers} available), 2) Adding more classrooms ({num_classrooms} available), or 3) Reducing the lectures_per_week requirement."
        elif status == cp_model.MODEL_INVALID:
            message = "Internal error: The scheduling model is invalid. Please contact support."
        else:
            message = f"Solver timeout or unknown issue (status: {solver.StatusName(status)}). The problem might be too complex. Try simplifying the schedule."
        
        return {
            "status": "error",
            "message": message,
            "details": error_details
        }

@app.get("/")
def read_root():
    return {"message": "AI Solver Service is running!"}
# PHASE 6: TIMETABLE EDITING & REFINEMENT - COMPLETE EXPLANATION

## 📋 Overview

Phase 6 focuses on making generated timetables **editable** and allowing administrators to **manually refine** them after AI generation. While the AI solver creates optimal timetables based on constraints, real-world scenarios often require manual adjustments.

---

## 🎯 Why Phase 6 is Needed

### Current System (After Phase 5):
✅ AI generates timetables automatically using CP-SAT solver
✅ Timetables respect all constraints (teacher clashes, room clashes, lunch breaks, etc.)
✅ Admin can view, publish, and delete timetables
✅ Students and teachers can view their timetables

### Problem:
❌ Once generated, timetables are **READ-ONLY**
❌ No way to make manual adjustments
❌ If a teacher requests a time change, you must regenerate the entire timetable
❌ Cannot swap two classes or move a single lecture
❌ No flexibility for last-minute changes

### Real-World Scenarios That Need Manual Editing:

1. **Teacher Requests:**
   - "Can I teach Cloud Computing on Tuesday instead of Monday?"
   - "I have a meeting at 10 AM, can you move my class?"

2. **Room Changes:**
   - Lab 1 is under maintenance, need to move classes to Lab 2
   - Department wants specific subjects in specific rooms

3. **Optimization:**
   - Admin notices gaps in schedule and wants to reorganize
   - Want to group same subject on consecutive days

4. **Last-Minute Changes:**
   - Teacher on leave, substitute teacher needs different timing
   - Event scheduled, need to move classes around

---

## 🔧 What Phase 6 Will Build

### 1. **Edit Timetable Interface**

**New Component:** `EditTimetable.jsx`

**Features:**
- Access from ViewTimetables page via "Edit" button
- Shows timetable in **editable mode**
- Each cell becomes **interactive**
- Can modify individual slots

**UI Elements:**
```
┌─────────────────────────────────────────────┐
│  Editing: B.Tech CS - Sem 3 - Section A     │
│  Status: DRAFT (changes not yet published)  │
│  [Save Changes] [Cancel] [Revert]           │
└─────────────────────────────────────────────┘

Time      | Monday    | Tuesday   | Wednesday | ...
──────────┼───────────┼───────────┼───────────┼───
09:00-10:00│ [EDIT ✏️] │ [EDIT ✏️] │ [EDIT ✏️] │
           │ DS        │ Cloud     │ DB        │
           │ K. Nair   │ A. Pillai │ P. Sharma │
           │ Room 101  │ Room 102  │ Lab 1     │
──────────┼───────────┼───────────┼───────────┼───
```

---

### 2. **Drag-and-Drop Functionality**

**Why Drag-and-Drop:**
- Most intuitive way to move classes
- Visual feedback during operation
- Easy to swap two lectures

**How It Works:**

**Option A: Internal Drag-and-Drop (Same Timetable)**
```javascript
// Drag a class from Monday 9AM to Tuesday 10AM
1. User clicks and drags "Data Structures" slot
2. System highlights valid drop zones (empty slots or swappable slots)
3. User drops on Tuesday 10AM
4. System checks conflicts:
   - Is teacher available at new time?
   - Is room available at new time?
   - Any other constraint violations?
5. If valid: Swap/Move happens
6. If invalid: Show error message
```

**Option B: Slot Swapping**
```javascript
// Swap two classes
1. Click on "Data Structures" (Monday 9AM)
2. System enters "swap mode"
3. Click on "Cloud Computing" (Tuesday 10AM)
4. System checks if swap is valid (no conflicts)
5. If valid: Swap the two slots
6. If invalid: Show which constraint is violated
```

**Technical Implementation:**
- Use React DnD library or native HTML5 drag-and-drop
- Each timetable cell becomes draggable
- Drop zones validated in real-time
- Optimistic updates with rollback on conflict

---

### 3. **Conflict Detection During Edits**

**Critical Feature:** Prevent invalid timetables

When admin tries to move/edit a slot, system must check:

#### **Constraint Checks:**

1. **Teacher Availability:**
   ```
   Can't place "Data Structures by K. Nair" at Tuesday 10AM if:
   - K. Nair already teaching another class at Tuesday 10AM
   ```

2. **Room Availability:**
   ```
   Can't place class in "Room 101" at Tuesday 10AM if:
   - Another class already scheduled in Room 101 at that time
   ```

3. **Lunch Break:**
   ```
   Can't place any class at slot 4 (13:00-14:00)
   - This is lunch time for everyone
   ```

4. **Teacher Cooldown (Optional):**
   ```
   If teacher has 3+ consecutive classes, show warning
   ```

5. **Subject-Teacher Mapping:**
   ```
   Can only assign subjects to their designated teachers
   - "Data Structures" can only be taught by K. Nair (assigned teacher)
   ```

#### **Conflict UI:**

When conflict detected:
```
┌──────────────────────────────────────────┐
│  ⚠️  CONFLICT DETECTED                    │
│                                          │
│  Cannot move Data Structures to here    │
│  Reason: K. Nair already teaching       │
│          "Cloud Computing" at this time │
│                                          │
│  [View Conflict] [Cancel Move]          │
└──────────────────────────────────────────┘
```

---

### 4. **Manual Slot Editing Modal**

**For Detailed Changes:**

Click "Edit" on any slot → Opens modal:

```
┌────────────────────────────────────────┐
│  Edit Slot: Monday 09:00-10:00        │
├────────────────────────────────────────┤
│                                        │
│  Subject:   [Dropdown: Data Structures▼]│
│             (Only assigned subjects)   │
│                                        │
│  Teacher:   [Auto: K. Nair]           │
│             (Based on subject)         │
│                                        │
│  Room:      [Dropdown: Room 101 ▼]    │
│             (Show only available rooms)│
│                                        │
│  OR                                    │
│                                        │
│  ○ Mark as Free Slot                  │
│  ○ Mark as Event: [_____________]     │
│                                        │
│  [Check Conflicts] [Save] [Cancel]    │
└────────────────────────────────────────┘
```

**Features:**
- Subject dropdown shows only subjects assigned to this class
- Teacher auto-filled based on subject (from ClassSubject mapping)
- Room dropdown shows all available classrooms
- Can mark slot as free or special event
- "Check Conflicts" button validates before saving

---

### 5. **Version Control / History**

**Problem:** Need to track changes and allow undo

**Solution:** Keep edit history

```javascript
// Timetable History Structure
{
  timetableId: "...",
  versions: [
    {
      versionNumber: 1,
      timestamp: "2025-12-06 10:30",
      changedBy: "admin@college.edu",
      changes: "Generated by AI",
      schedule: { ... }  // Full timetable snapshot
    },
    {
      versionNumber: 2,
      timestamp: "2025-12-06 11:00",
      changedBy: "admin@college.edu",
      changes: "Moved Data Structures from Mon 9AM to Tue 10AM",
      schedule: { ... }
    }
  ],
  currentVersion: 2
}
```

**UI Features:**
- "View History" button
- List of all changes with timestamps
- "Revert to Version X" button
- Compare two versions side-by-side

---

### 6. **Smart Suggestions**

**Optional Enhancement:** AI-assisted editing

When admin wants to move a class but there's a conflict:

```
System: "Cannot move Data Structures to Tuesday 10AM 
         because K. Nair is teaching Cloud Computing.

         Suggestions:
         ✓ Move to Tuesday 11AM (teacher & room free)
         ✓ Swap with Wednesday 9AM slot
         ✓ Move Cloud Computing to Friday 2PM instead"
```

---

## 🗄️ Backend Changes Needed

### 1. **New API Routes**

```javascript
// Update single slot in timetable
PUT /timetables/:id/edit-slot
Body: {
  day: 0,  // Monday = 0, Tuesday = 1, etc.
  slot: 0, // 09:00 = 0, 10:00 = 1, etc.
  newSlotData: {
    subject: "Data Structures",
    teacher: "K. Nair",
    classroom: "Room 101"
  }
}

// Swap two slots
PUT /timetables/:id/swap-slots
Body: {
  slot1: { day: 0, slot: 0 },  // Monday 9AM
  slot2: { day: 1, slot: 1 }   // Tuesday 10AM
}

// Check for conflicts
POST /timetables/:id/validate-slot
Body: {
  day: 0,
  slot: 0,
  proposedData: { subject, teacher, classroom }
}
Response: {
  valid: true/false,
  conflicts: [
    { type: "teacher_clash", message: "..." },
    { type: "room_clash", message: "..." }
  ]
}

// Save version
POST /timetables/:id/save-version
Body: {
  changes: "Description of what changed",
  schedule: { ... }  // Updated timetable
}

// Get version history
GET /timetables/:id/history

// Revert to version
POST /timetables/:id/revert/:versionNumber
```

---

### 2. **Validation Logic**

**Conflict Checker Function:**

```javascript
// Backend: validate-slot.js
function validateSlot(timetableId, day, slot, newData) {
  const conflicts = [];

  // Check 1: Teacher availability
  const teacherBusy = checkTeacherAvailability(
    newData.teacher, 
    day, 
    slot, 
    timetableId // Exclude current timetable
  );
  if (teacherBusy) {
    conflicts.push({
      type: 'teacher_clash',
      message: `${newData.teacher} is already teaching ${teacherBusy.subject} at this time`
    });
  }

  // Check 2: Room availability
  const roomBusy = checkRoomAvailability(
    newData.classroom,
    day,
    slot,
    timetableId
  );
  if (roomBusy) {
    conflicts.push({
      type: 'room_clash',
      message: `${newData.classroom} is already booked for ${roomBusy.class}`
    });
  }

  // Check 3: Lunch break
  if (slot === 4) {
    conflicts.push({
      type: 'lunch_break',
      message: 'Slot 4 (13:00-14:00) is reserved for lunch break'
    });
  }

  // Check 4: Subject-Teacher mapping
  const validTeacher = checkSubjectTeacherMapping(
    newData.subject,
    newData.teacher
  );
  if (!validTeacher) {
    conflicts.push({
      type: 'invalid_teacher',
      message: `${newData.teacher} is not assigned to teach ${newData.subject}`
    });
  }

  return {
    valid: conflicts.length === 0,
    conflicts: conflicts
  };
}
```

---

### 3. **Database Schema Updates**

**Add to Timetable Model:**

```javascript
// models/timetable.model.js
const timetableSchema = new Schema({
  // ... existing fields ...
  
  // NEW FIELDS FOR PHASE 6:
  
  editHistory: [{
    versionNumber: Number,
    timestamp: Date,
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changeDescription: String,
    scheduleSnapshot: Schema.Types.Mixed  // Full schedule at that version
  }],
  
  currentVersion: {
    type: Number,
    default: 1
  },
  
  isEdited: {
    type: Boolean,
    default: false  // True if manually edited after generation
  },
  
  lastEditedAt: Date,
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});
```

---

## 📱 Frontend Components Structure

### Component Hierarchy:

```
ViewTimetables.jsx
  └─> [Edit Button] → EditTimetable.jsx
                        ├─> TimetableGrid (editable)
                        ├─> SlotEditModal
                        ├─> ConflictAlert
                        ├─> VersionHistory
                        └─> SaveChangesBar
```

### New Components to Build:

1. **EditTimetable.jsx** - Main editing interface
2. **EditableSlot.jsx** - Individual editable cell
3. **SlotEditModal.jsx** - Detailed slot editing
4. **ConflictAlert.jsx** - Shows validation errors
5. **VersionHistory.jsx** - Shows edit history
6. **SaveChangesBar.jsx** - Sticky bar with Save/Cancel/Revert

---

## 🎨 User Experience Flow

### Scenario: Admin wants to move a class

**Step 1: Enter Edit Mode**
```
1. Admin goes to "View Timetables"
2. Clicks on a timetable (e.g., B.Tech CS - Sem 3 - Section A)
3. Clicks "Edit Timetable" button
4. System creates a working copy (doesn't affect published version)
5. Timetable cells become editable with drag handles
```

**Step 2: Make Changes**
```
6. Admin drags "Data Structures" from Monday 9AM
7. System highlights valid drop zones in green
8. System highlights conflict zones in red
9. Admin drops on Tuesday 10AM (valid zone)
10. System validates in real-time
11. If valid: Slot moves with visual feedback
12. If invalid: Shows conflict message
```

**Step 3: Save or Discard**
```
13. Admin reviews all changes
14. Changes shown in "modified" state (yellow highlight)
15. Click "Save Changes" → Saves as new version
16. OR "Cancel" → Discards all changes
17. OR "Revert to Version X" → Undo to previous state
```

**Step 4: Publish**
```
18. Timetable status remains "draft" until published
19. Admin can continue editing draft
20. When satisfied, click "Publish"
21. Students and teachers see updated timetable
```

---

## ⚙️ Implementation Priority

### Phase 6.1 - Basic Editing (High Priority)
1. ✅ Edit button on ViewTimetables
2. ✅ EditTimetable component with editable grid
3. ✅ SlotEditModal for manual changes
4. ✅ Basic conflict detection
5. ✅ Save changes to database

### Phase 6.2 - Drag-and-Drop (Medium Priority)
1. ✅ Implement drag-and-drop library
2. ✅ Visual feedback during drag
3. ✅ Drop validation
4. ✅ Swap functionality

### Phase 6.3 - Version Control (Medium Priority)
1. ✅ Save edit history
2. ✅ Version history viewer
3. ✅ Revert to previous version
4. ✅ Compare versions

### Phase 6.4 - Advanced Features (Low Priority)
1. ⭕ Smart suggestions
2. ⭕ Batch operations (move multiple slots)
3. ⭕ Copy timetable (duplicate and modify)
4. ⭕ Template system (save common patterns)

---

## 🚀 Benefits After Phase 6

### For Administrators:
✅ Flexibility to handle last-minute changes
✅ Don't need to regenerate entire timetable for small tweaks
✅ Can accommodate teacher requests easily
✅ Room changes become simple
✅ Version control prevents mistakes

### For Teachers:
✅ Can request time changes that admins can implement quickly
✅ See edit history (transparency)

### For Students:
✅ More stable timetables (fewer regenerations)
✅ Changes are trackable

---

## 📊 Success Metrics

Phase 6 will be considered successful when:

1. ✅ Admin can edit any slot in a timetable
2. ✅ All constraints are validated during editing
3. ✅ No invalid timetables can be saved
4. ✅ Changes are tracked with history
5. ✅ Drag-and-drop works smoothly
6. ✅ Can revert mistakes easily
7. ✅ Published timetables update correctly

---

## 🔄 After Phase 6: What's Next?

**Phase 7: Reports & Analytics**
- Teacher workload reports
- Room utilization analysis
- Conflict reports
- Timetable comparison

**Phase 8: Enhanced Student Features**
- Personal schedule customization
- Reminders and notifications
- Mobile app integration

---

## 💡 Key Takeaways

**Phase 6 = Making AI-Generated Timetables Human-Editable**

**Core Concept:** Balance automation with manual control
- AI does the heavy lifting (initial generation)
- Humans fine-tune for real-world scenarios
- System prevents invalid states
- History tracking ensures accountability

**Real-World Value:** 
- No timetable system is perfect on first generation
- Manual editing is essential for practical deployment
- Version control prevents costly mistakes
- Drag-and-drop makes editing intuitive

---

**This is Phase 6 in its entirety!** 🎉

Would you like me to start implementing Phase 6.1 (Basic Editing)?

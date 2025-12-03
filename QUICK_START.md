# QUICK START - What To Do Now

## 🔴 IMPORTANT: The "blank" timetable page is NORMAL if you haven't generated any timetables yet!

---

## Step-by-Step Testing Instructions

### 1. Run Seed Data (If not done already)
```bash
cd Backend
node seed.js
```

**Expected Output:**
```
✅ 4 departments created
✅ 6 programs created
✅ 10 classes created
✅ 22 subjects created
✅ 59 class-subject assignments created
```

**If you see this, seed was successful!**

---

### 2. Start All Services

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```
Wait for: "Server is running on http://localhost:5000"

**Terminal 2 - Solver:**
```bash
cd Solver-service
uvicorn main:app --reload
```
Wait for: "Application startup complete"

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
```
Wait for: "Local: http://localhost:5173"

---

### 3. Generate Your First Timetable

1. Open browser: http://localhost:5173
2. Login: admin@college.edu / admin123
3. Click: "Assign Subjects" or "Generate Timetable" (depends on navigation)
4. **You should see a dropdown with 10 classes**
5. Select: "B.Tech CS - Sem 3 - Section A"
6. **You should see 6 subjects already listed** (from seed data!)
7. Click: "Generate Timetable" button
8. Wait: 5-10 seconds
9. **You should see a timetable grid appear!**

---

### 4. View Generated Timetables

1. Click: "View Timetables" (in navigation)
2. **NOW you should see 1 timetable in the list**
3. It should show: "Computer Science & Engineering • B.Tech CS • Semester 3 • Section A"
4. Click on it to view details
5. **Should show the full timetable grid (NOT blank!)**

---

## 🎯 Key Understanding

### BEFORE Generating Any Timetable:
- **View Timetables page = EMPTY** ✓ This is correct!
- It will say "No timetables generated yet"

### AFTER Generating First Timetable:
- **View Timetables page = Shows 1 timetable** ✓
- Full class hierarchy visible
- Can click and view details

---

## ❌ If Something Goes Wrong

### Issue 1: "No classes in dropdown"
**Fix:** Run `node seed.js` again

### Issue 2: "No subjects assigned to class"
**Fix:** Run `node seed.js` again (creates 59 assignments)

### Issue 3: "Solver service not running"
**Fix:** Start solver in Terminal 2

### Issue 4: "Generate button does nothing"
**Check:** Browser console for errors (F12)

---

## 📊 What Should Happen

After seed.js:
- ✅ 10 classes created
- ✅ 59 subject assignments created (automatically!)
- ✅ Each class has 4-6 subjects pre-assigned
- ✅ Each subject has a teacher pre-assigned
- ✅ **NO manual assignment needed!**

When you generate:
- ✅ Takes 5-10 seconds
- ✅ Creates timetable for THAT specific class only
- ✅ Saves to database with "draft" status
- ✅ Appears in View Timetables immediately

---

## 🐛 Still Having Issues?

Check **DEBUGGING_GUIDE.md** for detailed troubleshooting.

The most common issue is:
- **Forgetting to run seed.js** → Run it!
- **Expecting timetables before generating** → Generate one first!

---

## ✅ Success Criteria

You'll know it's working when:
1. Seed shows "59 class-subject assignments created"
2. Assign Subjects page shows 10 classes
3. Selecting a class shows 6 subjects (already assigned from seed!)
4. Generate button creates timetable in 5-10 seconds
5. View Timetables shows the generated timetable with full info
6. Clicking timetable shows grid (NOT blank!)

---

**Created:** December 4, 2025 - 4:20 PM IST
**Status:** Ready for testing
**Next:** Run seed.js → Generate one timetable → Verify it shows in View Timetables

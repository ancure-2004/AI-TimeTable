const router = require('express').Router();
const axios = require('axios');
const Timetable = require('../models/timetable.model');
const Class = require('../models/class.model');
const ClassSubject = require('../models/classSubject.model');
const Classroom = require('../models/classroom.model');

// Generate timetable for a specific class
router.post('/generate/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, userId } = req.body; // userId from auth middleware

    console.log(`Generating timetable for class ${classId}...`);

    // 1. Get class details
    const classData = await Class.findById(classId)
      .populate('program', 'name code')
      .populate('assignedRoom', 'name capacity');

    if (!classData) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Class not found' 
      });
    }

    // 2. Get all subjects assigned to this class with teachers
    const assignments = await ClassSubject.find({ class: classId })
      .populate('subject', 'name code lectures_per_week subjectType')
      .populate('teacher', 'name')
      .populate('preferredRoom', 'name capacity');

    if (assignments.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No subjects assigned to this class. Please assign subjects and teachers first.'
      });
    }

    console.log(`Found ${assignments.length} subject assignments for this class`);

    // 3. Get all available classrooms
    const allClassrooms = await Classroom.find();

    // 4. Prepare data for solver with subject-teacher mappings
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

    // Use assigned room if available, otherwise use all classrooms
    const classrooms = classData.assignedRoom 
      ? [{ name: classData.assignedRoom.name, capacity: classData.assignedRoom.capacity }]
      : allClassrooms.map(c => ({ name: c.name, capacity: c.capacity }));

    const payload = {
      subject_teacher_pairs: subjectTeacherPairs,
      classrooms
    };

    console.log('Sending data to solver:', JSON.stringify(payload, null, 2));

    // 5. Call solver service
    const pythonResponse = await axios.post('http://127.0.0.1:8000/generate', payload, {
      timeout: 35000
    });

    console.log('Received response from solver:', pythonResponse.data.status);

    if (pythonResponse.data.status === 'success') {
      // 6. Save timetable to database
      const newTimetable = new Timetable({
        class: classId,
        academicYear: academicYear || new Date().getFullYear().toString(),
        semester: classData.semester,
        schedule: pythonResponse.data.timetable,
        generatedBy: userId || null,
        status: 'draft'
      });

      await newTimetable.save();

      console.log('Timetable saved to database');

      res.json({
        status: 'success',
        message: 'Timetable generated and saved successfully!',
        timetable: pythonResponse.data.timetable,
        timetableId: newTimetable._id,
        classInfo: {
          name: classData.name,
          code: classData.code,
          semester: classData.semester
        }
      });
    } else {
      // Solver returned error
      res.status(400).json(pythonResponse.data);
    }

  } catch (error) {
    console.error('Error generating timetable:');
    
    if (error.response) {
      console.error('Error from Python service:', error.response.data);
      res.status(error.response.status || 500).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to Python solver service');
      res.status(503).json({ 
        status: 'error',
        message: 'Solver service is not running. Please start the Python solver service.'
      });
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('Request to solver timed out');
      res.status(504).json({ 
        status: 'error',
        message: 'Timetable generation timed out. Try reducing constraints.'
      });
    } else {
      console.error('Unexpected error:', error.message);
      res.status(500).json({ 
        status: 'error',
        message: 'An unexpected error occurred during timetable generation.'
      });
    }
  }
});

// Get all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate({
        path: 'class',
        select: 'name code semester section',
        populate: {
          path: 'program',
          select: 'name code',
          populate: {
            path: 'department',
            select: 'name code'
          }
        }
      })
      .populate('generatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetables', error: error.message });
  }
});

// Get timetable by ID
router.get('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate({
        path: 'class',
        select: 'name code semester section',
        populate: {
          path: 'program',
          select: 'name code',
          populate: {
            path: 'department',
            select: 'name code'
          }
        }
      })
      .populate('generatedBy', 'firstName lastName email');
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable', error: error.message });
  }
});

// Get timetables for a specific class
router.get('/class/:classId', async (req, res) => {
  try {
    const timetables = await Timetable.find({ class: req.params.classId })
      .populate({
        path: 'class',
        select: 'name code semester section',
        populate: {
          path: 'program',
          select: 'name code',
          populate: {
            path: 'department',
            select: 'name code'
          }
        }
      })
      .populate('generatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class timetables', error: error.message });
  }
});

// Publish timetable (change status from draft to published)
router.put('/:id/publish', async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { status: 'published' },
      { new: true }
    ).populate({
      path: 'class',
      select: 'name code semester section',
      populate: {
        path: 'program',
        select: 'name code',
        populate: {
          path: 'department',
          select: 'name code'
        }
      }
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({ message: 'Timetable published successfully', timetable });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing timetable', error: error.message });
  }
});

// Delete timetable
router.delete('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting timetable', error: error.message });
  }
});

// Get teacher's timetable (all classes they teach)
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Get teacher's user record to get their name
    const User = require('../models/user.model');
    const teacherUser = await User.findById(teacherId);
    
    if (!teacherUser) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const teacherFullName = `${teacherUser.firstName} ${teacherUser.lastName}`;

    // Find teacher record by name
    const Teacher = require('../models/teacher.model');
    const teacherRecord = await Teacher.findOne({ name: teacherFullName });

    if (!teacherRecord) {
      return res.json({
        teacher: teacherId,
        classes: [],
        timetables: [],
        message: 'No classes assigned to this teacher'
      });
    }

    // Get all class-subject assignments for this teacher
    const assignments = await ClassSubject.find({ teacher: teacherRecord._id })
      .populate('class', '_id name code semester section')
      .populate('subject', 'name code');

    if (assignments.length === 0) {
      return res.json({
        teacher: teacherId,
        classes: [],
        timetables: [],
        message: 'No classes assigned to this teacher'
      });
    }

    // Get timetables for all these classes
    const classIds = assignments.map(a => a.class._id);
    const timetables = await Timetable.find({
      class: { $in: classIds },
      status: 'published'
    }).populate({
      path: 'class',
      select: 'name code semester section',
      populate: {
        path: 'program',
        select: 'name code',
        populate: {
          path: 'department',
          select: 'name code'
        }
      }
    });

    // Build teacher's combined schedule
    const teacherSchedule = {
      teacherId,
      classes: assignments.map(a => ({
        class: a.class,
        subject: a.subject
      })),
      timetables: timetables
    };

    res.json(teacherSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher timetable', error: error.message });
  }
});

// Get student's timetable (their class timetable)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's user record
    const User = require('../models/user.model');
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    // Find the class based on student's program, semester, and section
    // First, find the program by name or code
    
    const Program = require('../models/program.model');
    const program = await Program.findOne(
        { code: student.program },
    );

    console.log(program);

    if (!program) {
      return res.status(404).json({ 
        message: 'Program not found for this student',
        details: `No program found matching: ${student.program}`
      });
    }

    // Find the class
    const studentClass = await Class.findOne({
      program: program._id,
      semester: student.semester,
      section: student.section
    });

    if (!studentClass) {
      return res.status(404).json({ 
        message: 'Program not found for this student',
        details: {
          program: student.program,
          semester: student.semester,
          section: student.section,
          programId: program._id.toString(),
          programName: program.name
        }
      });
    }

    // Get published timetable for this class
    const timetable = await Timetable.findOne({
      class: studentClass._id,
      status: 'published'
    }).populate({
      path: 'class',
      select: 'name code semester section',
      populate: {
        path: 'program',
        select: 'name code',
        populate: {
          path: 'department',
          select: 'name code'
        }
      }
    }).sort({ createdAt: -1 });

    if (!timetable) {
      return res.status(404).json({ 
        message: 'No published timetable found for your class' 
      });
    }

    res.json({
      studentId,
      class: timetable.class,
      timetable: timetable
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student timetable', error: error.message });
  }
});

// ============================================
// PHASE 6: TIMETABLE EDITING ROUTES
// ============================================

// Validate slot change for conflicts
router.post('/:id/validate-slot', async (req, res) => {
  try {
    const { id } = req.params;
    const { day, slot, proposedData } = req.body;

    const timetable = await Timetable.findById(id)
      .populate('class', '_id name semester');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    const conflicts = [];

    // If it's a free slot or event, no conflict checking needed
    if (!proposedData.subject || !proposedData.teacher) {
      return res.json({ valid: true, conflicts: [] });
    }

    // Check 1: Lunch break (slot 4 = 13:00-14:00)
    if (slot === 4) {
      conflicts.push({
        type: 'lunch_break',
        message: 'Slot 4 (13:00-14:00) is reserved for lunch break'
      });
    }

    // Check 2: Teacher availability - Check if teacher is teaching elsewhere at this time
    // Get all published timetables except the current one being edited
    const otherTimetables = await Timetable.find({
      _id: { $ne: id },
      status: { $in: ['published', 'draft'] }
    }).populate('class', 'name code');

    for (const tt of otherTimetables) {
      const slotContent = tt.schedule[day]?.[slot];
      if (slotContent && slotContent.length > 0) {
        for (const entry of slotContent) {
          if (entry.teacher === proposedData.teacher && !entry.event) {
            conflicts.push({
              type: 'teacher_clash',
              message: `${proposedData.teacher} is already teaching ${entry.subject} in ${tt.class.name} at this time`,
              conflictingClass: tt.class.name
            });
          }
        }
      }
    }

    // Check 3: Room availability - Check if room is being used elsewhere
    for (const tt of otherTimetables) {
      const slotContent = tt.schedule[day]?.[slot];
      if (slotContent && slotContent.length > 0) {
        for (const entry of slotContent) {
          if (entry.classroom === proposedData.classroom && !entry.event) {
            conflicts.push({
              type: 'room_clash',
              message: `${proposedData.classroom} is already booked for ${entry.subject} (${tt.class.name}) at this time`,
              conflictingClass: tt.class.name
            });
          }
        }
      }
    }

    // Check 4: Teacher cooldown - Check if teacher has too many consecutive classes
    // Count consecutive classes for this teacher in the current timetable
    let consecutiveCount = 0;
    const daySchedule = timetable.schedule[day];
    
    // Check slots before
    for (let i = slot - 1; i >= 0; i--) {
      const slotContent = daySchedule[i];
      if (slotContent && slotContent.length > 0) {
        const hasTeacher = slotContent.some(entry => entry.teacher === proposedData.teacher);
        if (hasTeacher) {
          consecutiveCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Check slots after
    for (let i = slot + 1; i < daySchedule.length; i++) {
      const slotContent = daySchedule[i];
      if (slotContent && slotContent.length > 0) {
        const hasTeacher = slotContent.some(entry => entry.teacher === proposedData.teacher);
        if (hasTeacher) {
          consecutiveCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // If adding this slot would make 3+ consecutive classes, warn
    if (consecutiveCount >= 2) {
      conflicts.push({
        type: 'teacher_cooldown_warning',
        message: `${proposedData.teacher} will have ${consecutiveCount + 1} consecutive classes. Consider adding a break.`,
        severity: 'warning'
      });
    }

    // Check 5: Verify subject-teacher mapping
    // Get class-subject assignments for this class
    const classId = timetable.class._id;
    const Teacher = require('../models/teacher.model');
    const Subject = require('../models/subject.model');
    
    const subject = await Subject.findOne({ name: proposedData.subject });
    const teacher = await Teacher.findOne({ name: proposedData.teacher });

    if (subject && teacher) {
      const assignment = await ClassSubject.findOne({
        class: classId,
        subject: subject._id,
        teacher: teacher._id
      });

      if (!assignment) {
        conflicts.push({
          type: 'invalid_teacher',
          message: `${proposedData.teacher} is not assigned to teach ${proposedData.subject} for this class`
        });
      }
    }

    const valid = conflicts.filter(c => c.severity !== 'warning').length === 0;

    res.json({
      valid,
      conflicts,
      message: valid ? 'No conflicts detected' : 'Conflicts detected'
    });

  } catch (error) {
    console.error('Error validating slot:', error);
    res.status(500).json({ message: 'Error validating slot', error: error.message });
  }
});

// Save edited timetable
router.put('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule, changes, userId } = req.body;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Save current version to history before making changes
    if (!timetable.editHistory) {
      timetable.editHistory = [];
    }

    // Save current state as a version
    timetable.editHistory.push({
      versionNumber: (timetable.currentVersion || 1),
      timestamp: new Date(),
      editedBy: userId,
      changeDescription: changes || 'Manual edit',
      scheduleSnapshot: JSON.parse(JSON.stringify(timetable.schedule))
    });

    // Update timetable
    timetable.schedule = schedule;
    timetable.isEdited = true;
    timetable.lastEditedAt = new Date();
    timetable.lastEditedBy = userId;
    timetable.currentVersion = (timetable.currentVersion || 1) + 1;

    await timetable.save();

    // Populate and return
    const updatedTimetable = await Timetable.findById(id)
      .populate({
        path: 'class',
        select: 'name code semester section',
        populate: {
          path: 'program',
          select: 'name code',
          populate: {
            path: 'department',
            select: 'name code'
          }
        }
      })
      .populate('generatedBy', 'firstName lastName email')
      .populate('lastEditedBy', 'firstName lastName email');

    res.json({
      message: 'Timetable updated successfully',
      timetable: updatedTimetable
    });

  } catch (error) {
    console.error('Error saving edited timetable:', error);
    res.status(500).json({ message: 'Error saving timetable', error: error.message });
  }
});

// Get edit history for a timetable
router.get('/:id/history', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('editHistory.editedBy', 'firstName lastName email');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({
      currentVersion: timetable.currentVersion || 1,
      history: timetable.editHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// Revert to a specific version
router.post('/:id/revert/:versionNumber', async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const { userId } = req.body;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Find the version to revert to
    const version = timetable.editHistory?.find(
      h => h.versionNumber === parseInt(versionNumber)
    );

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Save current state before reverting
    timetable.editHistory.push({
      versionNumber: timetable.currentVersion || 1,
      timestamp: new Date(),
      editedBy: userId,
      changeDescription: `Reverted to version ${versionNumber}`,
      scheduleSnapshot: JSON.parse(JSON.stringify(timetable.schedule))
    });

    // Revert to the old schedule
    timetable.schedule = version.scheduleSnapshot;
    timetable.currentVersion = (timetable.currentVersion || 1) + 1;
    timetable.lastEditedAt = new Date();
    timetable.lastEditedBy = userId;

    await timetable.save();

    const updatedTimetable = await Timetable.findById(id)
      .populate({
        path: 'class',
        select: 'name code semester section',
        populate: {
          path: 'program',
          select: 'name code',
          populate: {
            path: 'department',
            select: 'name code'
          }
        }
      });

    res.json({
      message: `Reverted to version ${versionNumber}`,
      timetable: updatedTimetable
    });

  } catch (error) {
    console.error('Error reverting timetable:', error);
    res.status(500).json({ message: 'Error reverting timetable', error: error.message });
  }
});

module.exports = router;

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

    // 4. Prepare data for solver
    const subjects = assignments.map(a => ({
      name: a.subject.name,
      code: a.subject.code,
      lectures_per_week: a.subject.lectures_per_week
    }));

    const teachers = assignments.map(a => ({
      name: a.teacher.name
    }));

    // Use assigned room if available, otherwise use all classrooms
    const classrooms = classData.assignedRoom 
      ? [{ name: classData.assignedRoom.name, capacity: classData.assignedRoom.capacity }]
      : allClassrooms.map(c => ({ name: c.name, capacity: c.capacity }));

    const payload = {
      subjects,
      teachers,
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

    // Get all class-subject assignments for this teacher
    const assignments = await ClassSubject.find({ teacher: teacherId })
      .populate('class', '_id name code semester section')
      .populate('subject', 'name code');

    if (assignments.length === 0) {
      return res.json({
        teacher: teacherId,
        schedule: [],
        message: 'No classes assigned to this teacher'
      });
    }

    // Get timetables for all these classes
    const classIds = assignments.map(a => a.class._id);
    const timetables = await Timetable.find({
      class: { $in: classIds },
      status: 'published'
    }).populate('class', 'name code semester section');

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

module.exports = router;

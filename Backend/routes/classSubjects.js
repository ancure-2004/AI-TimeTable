const router = require('express').Router();
const ClassSubject = require('../models/classSubject.model');

// Get all class-subject assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await ClassSubject.find()
      .populate('class', 'name code semester section')
      .populate('subject', 'name code lectures_per_week')
      .populate('teacher', 'name')
      .populate('preferredRoom', 'name capacity');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Get subjects for a specific class
router.get('/class/:classId', async (req, res) => {
  try {
    const assignments = await ClassSubject.find({ class: req.params.classId })
      .populate('subject', 'name code lectures_per_week subjectType credits')
      .populate('teacher', 'name')
      .populate('preferredRoom', 'name capacity');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class subjects', error: error.message });
  }
});

// Get classes taught by a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const assignments = await ClassSubject.find({ teacher: req.params.teacherId })
      .populate('class', 'name code semester section')
      .populate('subject', 'name code lectures_per_week')
      .populate('preferredRoom', 'name capacity');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher assignments', error: error.message });
  }
});

// Assign subject to class
router.post('/add', async (req, res) => {
  try {
    const { classId, subjectId, teacherId, preferredRoom } = req.body;

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ message: 'Class, subject, and teacher are required' });
    }

    // Check if assignment already exists
    const existing = await ClassSubject.findOne({ 
      class: classId, 
      subject: subjectId 
    });

    if (existing) {
      return res.status(400).json({ message: 'This subject is already assigned to this class' });
    }

    const newAssignment = new ClassSubject({
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      preferredRoom: preferredRoom || null
    });

    await newAssignment.save();
    const populatedAssignment = await ClassSubject.findById(newAssignment._id)
      .populate('class', 'name code')
      .populate('subject', 'name code lectures_per_week')
      .populate('teacher', 'name')
      .populate('preferredRoom', 'name capacity');
    
    res.status(201).json({ 
      message: 'Subject assigned to class successfully', 
      assignment: populatedAssignment 
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'This subject is already assigned to this class' });
    } else {
      res.status(500).json({ message: 'Error creating assignment', error: error.message });
    }
  }
});

// Update assignment
router.put('/:id', async (req, res) => {
  try {
    const { teacherId, preferredRoom } = req.body;
    
    const updatedAssignment = await ClassSubject.findByIdAndUpdate(
      req.params.id,
      { teacher: teacherId, preferredRoom },
      { new: true, runValidators: true }
    ).populate('class', 'name code')
     .populate('subject', 'name code lectures_per_week')
     .populate('teacher', 'name')
     .populate('preferredRoom', 'name capacity');

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment updated successfully', assignment: updatedAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await ClassSubject.findByIdAndDelete(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
});

module.exports = router;

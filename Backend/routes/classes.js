const router = require('express').Router();
const Class = require('../models/class.model');

// Get all classes (with program and room details)
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('program', 'name code')
      .populate('assignedRoom', 'name capacity')
      .sort({ semester: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// Get classes by program
router.get('/program/:programId', async (req, res) => {
  try {
    const classes = await Class.find({ program: req.params.programId })
      .populate('program', 'name code')
      .populate('assignedRoom', 'name capacity')
      .sort({ semester: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// Get single class
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('program', 'name code')
      .populate('assignedRoom', 'name capacity');
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class', error: error.message });
  }
});

// Create class
router.post('/add', async (req, res) => {
  try {
    const { name, code, program, semester, section, assignedRoom, studentCount } = req.body;

    if (!name || !code || !program || !semester) {
      return res.status(400).json({ message: 'Name, code, program, and semester are required' });
    }

    const newClass = new Class({
      name,
      code: code.toUpperCase(),
      program,
      semester,
      section: section?.toUpperCase() || 'A',
      assignedRoom: assignedRoom || null,
      studentCount: studentCount || 0
    });

    await newClass.save();
    const populatedClass = await Class.findById(newClass._id)
      .populate('program', 'name code')
      .populate('assignedRoom', 'name capacity');
    
    res.status(201).json({ message: 'Class added successfully', class: populatedClass });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Class with this code already exists' });
    } else {
      res.status(500).json({ message: 'Error creating class', error: error.message });
    }
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const { name, code, program, semester, section, assignedRoom, studentCount } = req.body;
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        code: code?.toUpperCase(), 
        program, 
        semester, 
        section: section?.toUpperCase(),
        assignedRoom,
        studentCount
      },
      { new: true, runValidators: true }
    ).populate('program', 'name code')
     .populate('assignedRoom', 'name capacity');

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class updated successfully', class: updatedClass });
  } catch (error) {
    res.status(500).json({ message: 'Error updating class', error: error.message });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
});

module.exports = router;

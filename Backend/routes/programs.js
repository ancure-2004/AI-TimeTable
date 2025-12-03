const router = require('express').Router();
const Program = require('../models/program.model');

// Get all programs (with department details)
router.get('/', async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching programs', error: error.message });
  }
});

// Get programs by department
router.get('/department/:departmentId', async (req, res) => {
  try {
    const programs = await Program.find({ department: req.params.departmentId })
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching programs', error: error.message });
  }
});

// Get single program
router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('department', 'name code');
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching program', error: error.message });
  }
});

// Create program
router.post('/add', async (req, res) => {
  try {
    const { name, code, department, duration, totalSemesters } = req.body;

    if (!name || !code || !department || !duration || !totalSemesters) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newProgram = new Program({
      name,
      code: code.toUpperCase(),
      department,
      duration,
      totalSemesters
    });

    await newProgram.save();
    const populatedProgram = await Program.findById(newProgram._id)
      .populate('department', 'name code');
    
    res.status(201).json({ message: 'Program added successfully', program: populatedProgram });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Program with this code already exists' });
    } else {
      res.status(500).json({ message: 'Error creating program', error: error.message });
    }
  }
});

// Update program
router.put('/:id', async (req, res) => {
  try {
    const { name, code, department, duration, totalSemesters } = req.body;
    
    const updatedProgram = await Program.findByIdAndUpdate(
      req.params.id,
      { name, code: code?.toUpperCase(), department, duration, totalSemesters },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!updatedProgram) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ message: 'Program updated successfully', program: updatedProgram });
  } catch (error) {
    res.status(500).json({ message: 'Error updating program', error: error.message });
  }
});

// Delete program
router.delete('/:id', async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting program', error: error.message });
  }
});

module.exports = router;

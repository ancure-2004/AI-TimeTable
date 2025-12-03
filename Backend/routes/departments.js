const router = require('express').Router();
const Department = require('../models/department.model');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

// Get single department
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department', error: error.message });
  }
});

// Create department
router.post('/add', async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const newDepartment = new Department({
      name,
      code: code.toUpperCase(),
      description
    });

    await newDepartment.save();
    res.status(201).json({ message: 'Department added successfully', department: newDepartment });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Department with this name or code already exists' });
    } else {
      res.status(500).json({ message: 'Error creating department', error: error.message });
    }
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code: code?.toUpperCase(), description },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department updated successfully', department: updatedDepartment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
});

module.exports = router;

const router = require('express').Router();
let Teacher = require('../models/teacher.model'); // Import the Teacher model

// GET ALL TEACHERS
router.route('/').get((req, res) => {
  Teacher.find() // Use the Teacher model to find all teachers
    .then(teachers => res.json(teachers))
    .catch(err => res.status(400).json('Error: ' + err));
});

// ADD A NEW TEACHER
router.route('/add').post((req, res) => {
  const name = req.body.name;
  const newTeacher = new Teacher({ name });

  newTeacher.save()
    .then(() => res.json('Teacher added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
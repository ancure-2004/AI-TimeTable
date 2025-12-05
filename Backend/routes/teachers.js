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

// UPDATE A TEACHER
router.route('/:id').put((req, res) => {
  Teacher.findById(req.params.id)
    .then(teacher => {
      teacher.name = req.body.name;

      teacher.save()
        .then(() => res.json('Teacher updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE A TEACHER
router.route('/:id').delete((req, res) => {
  Teacher.findByIdAndDelete(req.params.id)
    .then(() => res.json('Teacher deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
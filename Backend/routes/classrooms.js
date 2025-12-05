const router = require('express').Router();
let Classroom = require('../models/classroom.model');

// GET ALL CLASSROOMS
router.route('/').get((req, res) => {
  Classroom.find()
    .then(classrooms => res.json(classrooms))
    .catch(err => res.status(400).json('Error: ' + err));
});

// ADD A NEW CLASSROOM
router.route('/add').post((req, res) => {
  const name = req.body.name;
  const capacity = Number(req.body.capacity); // Ensure capacity is a number

  const newClassroom = new Classroom({
    name,
    capacity,
  });

  newClassroom.save()
    .then(() => res.json('Classroom added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// UPDATE A CLASSROOM
router.route('/:id').put((req, res) => {
  Classroom.findById(req.params.id)
    .then(classroom => {
      classroom.name = req.body.name;
      classroom.capacity = Number(req.body.capacity);

      classroom.save()
        .then(() => res.json('Classroom updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE A CLASSROOM
router.route('/:id').delete((req, res) => {
  Classroom.findByIdAndDelete(req.params.id)
    .then(() => res.json('Classroom deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
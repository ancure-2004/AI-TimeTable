const router = require('express').Router();
let Subject = require('../models/subject.model'); // We import the Subject model we just created

// === GET ALL SUBJECTS ===
// Handles incoming HTTP GET requests on the /subjects/ URL
router.route('/').get((req, res) => {
  Subject.find() // Mongoose method to get all Subjects from the database
    .populate('department') // Populate department info
    .then(subjects => res.json(subjects)) // Return the subjects in JSON format
    .catch(err => res.status(400).json('Error: ' + err)); // Catch and return any errors
});

// === ADD A NEW SUBJECT ===
// Handles incoming HTTP POST requests on the /subjects/add URL
router.route('/add').post((req, res) => {
  
  // ...and replace it with this code
  const { name, code, lectures_per_week } = req.body; // <-- Updated

  if (!name || !code || !lectures_per_week) { // <-- Updated
    return res.status(400).json('Error: Please enter all fields.');
  }

  const newSubject = new Subject({
    name,
    code,
    lectures_per_week: Number(lectures_per_week) // <-- Updated
  });

  newSubject.save()
    .then(() => res.json('Subject added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// === UPDATE A SUBJECT ===
router.route('/:id').put((req, res) => {
  Subject.findById(req.params.id)
    .then(subject => {
      subject.name = req.body.name;
      subject.code = req.body.code;
      subject.lectures_per_week = Number(req.body.lectures_per_week);
      if (req.body.subjectType) subject.subjectType = req.body.subjectType;
      if (req.body.credits) subject.credits = Number(req.body.credits);
      if (req.body.department) subject.department = req.body.department;

      subject.save()
        .then(() => res.json('Subject updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// === DELETE A SUBJECT ===
router.route('/:id').delete((req, res) => {
  Subject.findByIdAndDelete(req.params.id)
    .then(() => res.json('Subject deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router; // Export the router
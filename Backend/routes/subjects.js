const router = require('express').Router();
let Subject = require('../models/subject.model'); // We import the Subject model we just created

// === GET ALL SUBJECTS ===
// Handles incoming HTTP GET requests on the /subjects/ URL
router.route('/').get((req, res) => {
  Subject.find() // Mongoose method to get all Subjects from the database
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

module.exports = router; // Export the router
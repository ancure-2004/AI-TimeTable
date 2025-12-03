const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const Subject = require('./models/subject.model');
const Teacher = require('./models/teacher.model');
const Classroom = require('./models/classroom.model');

require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI; 
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully!");
});

// --- CONNECT THE ROUTES ---
const authRouter = require('./routes/auth');
const subjectsRouter = require('./routes/subjects');
const teachersRouter = require('./routes/teachers');
const classroomsRouter = require('./routes/classrooms');
const departmentsRouter = require('./routes/departments');
const programsRouter = require('./routes/programs');
const classesRouter = require('./routes/classes');
const classSubjectsRouter = require('./routes/classSubjects');
const timetablesRouter = require('./routes/timetables');

app.use('/auth', authRouter);
app.use('/subjects', subjectsRouter);
app.use('/teachers', teachersRouter);
app.use('/classrooms', classroomsRouter);
app.use('/departments', departmentsRouter);
app.use('/programs', programsRouter);
app.use('/classes', classesRouter);
app.use('/class-subjects', classSubjectsRouter);
app.use('/timetables', timetablesRouter);

// --- GENERATE TIMETABLE ROUTE ---
app.post('/generate-timetable', async (req, res) => {
  try {
    console.log('Starting timetable generation...');
    
    // 1. Fetch all data from MongoDB
    const subjects = await Subject.find();
    const teachers = await Teacher.find();
    const classrooms = await Classroom.find();

    console.log(`Found: ${subjects.length} subjects, ${teachers.length} teachers, ${classrooms.length} classrooms`);

    // 2. Format the data for the Python service
    const payload = {
      subjects: subjects.map(s => ({ 
        name: s.name, 
        code: s.code, 
        lectures_per_week: s.lectures_per_week
      })),
      teachers: teachers.map(t => ({ name: t.name })),
      classrooms: classrooms.map(c => ({ name: c.name, capacity: c.capacity })),
    };
    
    console.log('Sending data to Python solver...');

    // 3. Send the data to the Python solver service
    const pythonResponse = await axios.post('http://127.0.0.1:8000/generate', payload, {
      timeout: 35000 // 35 second timeout (slightly more than solver's 30s)
    });

    console.log('Received response from solver:', pythonResponse.data.status);

    // 4. Send the solver's response back to the frontend
    res.json(pythonResponse.data);

  } catch (error) {
    console.error('Error in timetable generation:');
    
    if (error.response) {
      // Python service returned an error
      console.error('Error from Python service:', error.response.data);
      res.status(error.response.status || 500).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      // Python service is not running
      console.error('Cannot connect to Python solver service');
      res.status(503).json({ 
        status: 'error',
        message: 'Solver service is not running. Please start the Python solver service at http://127.0.0.1:8000'
      });
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      // Request timed out
      console.error('Request to solver timed out');
      res.status(504).json({ 
        status: 'error',
        message: 'Timetable generation timed out. The problem might be too complex. Try reducing constraints or adding more resources.'
      });
    } else {
      // Other error
      console.error('Unexpected error:', error.message);
      res.status(500).json({ 
        status: 'error',
        message: 'An unexpected error occurred during timetable generation. Please try again.'
      });
    }
  }
});


// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

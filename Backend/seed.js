const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/user.model');
const Subject = require('./models/subject.model');
const Teacher = require('./models/teacher.model');
const Classroom = require('./models/classroom.model');
const Department = require('./models/department.model');
const Program = require('./models/program.model');
const Class = require('./models/class.model');
const ClassSubject = require('./models/classSubject.model');

// Connect to MongoDB
const uri = process.env.ATLAS_URI;
mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB database connection established successfully!");
  
  try {
    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Teacher.deleteMany({});
    await Classroom.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await Class.deleteMany({});
    await ClassSubject.deleteMany({});
    console.log('✅ Existing data cleared');

    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('\n👥 Creating users...');

    // Admin user
    const admin = await User.create({
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
      firstName: 'John',
      lastName: 'Administrator',
      phone: '+91-9876543210'
    });
    console.log('✅ Admin created');

    // Teachers (15 teachers)
    const teachersData = [
      { email: 'rajesh.kumar@college.edu', firstName: 'Rajesh', lastName: 'Kumar', department: 'Computer Science', specialization: 'Data Structures & Algorithms' },
      { email: 'priya.sharma@college.edu', firstName: 'Priya', lastName: 'Sharma', department: 'Computer Science', specialization: 'Database Management' },
      { email: 'amit.verma@college.edu', firstName: 'Amit', lastName: 'Verma', department: 'Computer Science', specialization: 'Operating Systems' },
      { email: 'neha.singh@college.edu', firstName: 'Neha', lastName: 'Singh', department: 'Computer Science', specialization: 'Computer Networks' },
      { email: 'vikram.patel@college.edu', firstName: 'Vikram', lastName: 'Patel', department: 'Computer Science', specialization: 'Software Engineering' },
      { email: 'anita.reddy@college.edu', firstName: 'Anita', lastName: 'Reddy', department: 'Computer Science', specialization: 'Web Development' },
      { email: 'sanjay.gupta@college.edu', firstName: 'Sanjay', lastName: 'Gupta', department: 'Computer Science', specialization: 'Artificial Intelligence' },
      { email: 'meena.iyer@college.edu', firstName: 'Meena', lastName: 'Iyer', department: 'Computer Science', specialization: 'Machine Learning' },
      { email: 'rahul.joshi@college.edu', firstName: 'Rahul', lastName: 'Joshi', department: 'Mathematics', specialization: 'Discrete Mathematics' },
      { email: 'kavita.nair@college.edu', firstName: 'Kavita', lastName: 'Nair', department: 'Mathematics', specialization: 'Linear Algebra' },
      { email: 'suresh.rao@college.edu', firstName: 'Suresh', lastName: 'Rao', department: 'Electronics', specialization: 'Digital Electronics' },
      { email: 'pooja.mehta@college.edu', firstName: 'Pooja', lastName: 'Mehta', department: 'Physics', specialization: 'Applied Physics' },
      { email: 'deepak.shah@college.edu', firstName: 'Deepak', lastName: 'Shah', department: 'English', specialization: 'Technical Communication' },
      { email: 'sunita.desai@college.edu', firstName: 'Sunita', lastName: 'Desai', department: 'Management', specialization: 'Engineering Economics' },
      { email: 'arun.pillai@college.edu', firstName: 'Arun', lastName: 'Pillai', department: 'Computer Science', specialization: 'Cloud Computing' }
    ];

    const teachers = [];
    for (const teacherData of teachersData) {
      const teacher = await User.create({
        ...teacherData,
        password: 'teacher123',
        role: 'teacher',
        phone: `+91-98765${Math.floor(10000 + Math.random() * 90000)}`
      });
      teachers.push(teacher);
    }
    console.log(`✅ ${teachers.length} teachers created`);

    // Students (40 students)
    const studentNames = [
      { firstName: 'Aarav', lastName: 'Sharma' },
      { firstName: 'Vivaan', lastName: 'Kumar' },
      { firstName: 'Aditya', lastName: 'Singh' },
      { firstName: 'Vihaan', lastName: 'Patel' },
      { firstName: 'Arjun', lastName: 'Gupta' },
      { firstName: 'Sai', lastName: 'Reddy' },
      { firstName: 'Arnav', lastName: 'Verma' },
      { firstName: 'Ayaan', lastName: 'Joshi' },
      { firstName: 'Krishna', lastName: 'Nair' },
      { firstName: 'Ishaan', lastName: 'Iyer' },
      { firstName: 'Ananya', lastName: 'Desai' },
      { firstName: 'Diya', lastName: 'Mehta' },
      { firstName: 'Aadhya', lastName: 'Shah' },
      { firstName: 'Saanvi', lastName: 'Pillai' },
      { firstName: 'Kiara', lastName: 'Rao' },
      { firstName: 'Navya', lastName: 'Kulkarni' },
      { firstName: 'Isha', lastName: 'Agarwal' },
      { firstName: 'Myra', lastName: 'Bhatt' },
      { firstName: 'Anika', lastName: 'Jain' },
      { firstName: 'Sara', lastName: 'Mishra' },
      { firstName: 'Rohan', lastName: 'Pandey' },
      { firstName: 'Kabir', lastName: 'Thakur' },
      { firstName: 'Reyansh', lastName: 'Malhotra' },
      { firstName: 'Shivansh', lastName: 'Kapoor' },
      { firstName: 'Rudra', lastName: 'Chopra' },
      { firstName: 'Dhruv', lastName: 'Saxena' },
      { firstName: 'Advait', lastName: 'Bansal' },
      { firstName: 'Pranav', lastName: 'Sinha' },
      { firstName: 'Om', lastName: 'Trivedi' },
      { firstName: 'Shaurya', lastName: 'Dwivedi' },
      { firstName: 'Riya', lastName: 'Arora' },
      { firstName: 'Prisha', lastName: 'Bose' },
      { firstName: 'Avni', lastName: 'Das' },
      { firstName: 'Pari', lastName: 'Ghosh' },
      { firstName: 'Aarohi', lastName: 'Chatterjee' },
      { firstName: 'Shanaya', lastName: 'Mukherjee' },
      { firstName: 'Tanvi', lastName: 'Sengupta' },
      { firstName: 'Anvi', lastName: 'Roy' },
      { firstName: 'Zara', lastName: 'Dutta' },
      { firstName: 'Nitya', lastName: 'Ganguly' }
    ];

    const students = [];
    let enrollmentCounter = 2024001;
    const programsList = ['B.Tech Computer Science', 'B.Tech Electronics', 'BCA'];
    const sections = ['A', 'B'];
    
    for (let i = 0; i < studentNames.length; i++) {
      const program = programsList[i % programsList.length];
      const semester = Math.floor(i / 10) % 4 + 3;
      const section = sections[i % sections.length];
      
      const student = await User.create({
        email: `${studentNames[i].firstName.toLowerCase()}.${studentNames[i].lastName.toLowerCase()}@student.college.edu`,
        password: 'student123',
        role: 'student',
        firstName: studentNames[i].firstName,
        lastName: studentNames[i].lastName,
        enrollmentNumber: `EN${enrollmentCounter++}`,
        program: program,
        semester: semester,
        section: section,
        phone: `+91-98765${Math.floor(10000 + Math.random() * 90000)}`
      });
      students.push(student);
    }
    console.log(`✅ ${students.length} students created`);

    // ============================================
    // 2. CREATE DEPARTMENTS
    // ============================================
    console.log('\n🏢 Creating departments...');

    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics and Communication' },
      { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
      { name: 'Mathematics', code: 'MATH', description: 'Department of Mathematics' }
    ];

    const departments = {};
    for (const deptData of departmentsData) {
      const dept = await Department.create(deptData);
      departments[deptData.code] = dept;
      console.log(`  ✓ ${deptData.name}`);
    }
    console.log(`✅ ${Object.keys(departments).length} departments created`);

    // ============================================
    // 3. CREATE PROGRAMS
    // ============================================
    console.log('\n📋 Creating programs...');

    const programsData = [
      { name: 'Bachelor of Technology in Computer Science', code: 'BTECH-CS', department: departments.CSE._id, duration: 4, totalSemesters: 8 },
      { name: 'Bachelor of Technology in Electronics', code: 'BTECH-ECE', department: departments.ECE._id, duration: 4, totalSemesters: 8 },
      { name: 'Bachelor of Technology in Mechanical', code: 'BTECH-ME', department: departments.ME._id, duration: 4, totalSemesters: 8 },
      { name: 'Bachelor of Computer Applications', code: 'BCA', department: departments.CSE._id, duration: 3, totalSemesters: 6 },
      { name: 'Master of Technology in Computer Science', code: 'MTECH-CS', department: departments.CSE._id, duration: 2, totalSemesters: 4 },
      { name: 'Master of Technology in AI & ML', code: 'MTECH-AI', department: departments.CSE._id, duration: 2, totalSemesters: 4 }
    ];

    const programs = {};
    for (const progData of programsData) {
      const prog = await Program.create(progData);
      programs[progData.code] = prog;
      console.log(`  ✓ ${progData.name}`);
    }
    console.log(`✅ ${Object.keys(programs).length} programs created`);

    // ============================================
    // 4. CREATE SUBJECTS
    // ============================================
    console.log('\n📚 Creating subjects...');

    const subjectsData = [
      { name: 'Data Structures and Algorithms', code: 'CS301', lectures_per_week: 4, subjectType: 'theory', credits: 4, department: departments.CSE._id },
      { name: 'Database Management Systems', code: 'CS302', lectures_per_week: 4, subjectType: 'theory', credits: 4, department: departments.CSE._id },
      { name: 'Operating Systems', code: 'CS303', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Computer Networks', code: 'CS304', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Software Engineering', code: 'CS305', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Web Technologies', code: 'CS306', lectures_per_week: 4, subjectType: 'theory', credits: 4, department: departments.CSE._id },
      { name: 'Artificial Intelligence', code: 'CS401', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Machine Learning', code: 'CS402', lectures_per_week: 4, subjectType: 'theory', credits: 4, department: departments.CSE._id },
      { name: 'Cloud Computing', code: 'CS403', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Compiler Design', code: 'CS404', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.CSE._id },
      { name: 'Data Structures Lab', code: 'CS301L', lectures_per_week: 2, subjectType: 'lab', credits: 1, department: departments.CSE._id },
      { name: 'Database Lab', code: 'CS302L', lectures_per_week: 2, subjectType: 'lab', credits: 1, department: departments.CSE._id },
      { name: 'Operating Systems Lab', code: 'CS303L', lectures_per_week: 2, subjectType: 'lab', credits: 1, department: departments.CSE._id },
      { name: 'Networks Lab', code: 'CS304L', lectures_per_week: 2, subjectType: 'lab', credits: 1, department: departments.CSE._id },
      { name: 'Web Technologies Lab', code: 'CS306L', lectures_per_week: 2, subjectType: 'lab', credits: 1, department: departments.CSE._id },
      { name: 'Discrete Mathematics', code: 'MA301', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.MATH._id },
      { name: 'Linear Algebra', code: 'MA302', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.MATH._id },
      { name: 'Probability and Statistics', code: 'MA303', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.MATH._id },
      { name: 'Digital Electronics', code: 'EC301', lectures_per_week: 3, subjectType: 'theory', credits: 3, department: departments.ECE._id },
      { name: 'Applied Physics', code: 'PH301', lectures_per_week: 2, subjectType: 'theory', credits: 2, department: departments.MATH._id },
      { name: 'Technical Communication', code: 'EN301', lectures_per_week: 2, subjectType: 'theory', credits: 2, department: departments.MATH._id },
      { name: 'Engineering Economics', code: 'MG301', lectures_per_week: 2, subjectType: 'theory', credits: 2, department: departments.MATH._id }
    ];

    const subjects = {};
    for (const subjectData of subjectsData) {
      const subject = await Subject.create(subjectData);
      subjects[subjectData.code] = subject;
    }
    console.log(`✅ ${Object.keys(subjects).length} subjects created`);

    // ============================================
    // 5. CREATE TEACHER RECORDS
    // ============================================
    console.log('\n👨‍🏫 Creating teacher records...');

    const teacherRecords = {};
    for (const teacher of teachers) {
      const teacherRecord = await Teacher.create({
        name: `${teacher.firstName} ${teacher.lastName}`
      });
      teacherRecords[`${teacher.firstName} ${teacher.lastName}`] = teacherRecord;
    }
    console.log(`✅ ${Object.keys(teacherRecords).length} teacher records created`);

    // ============================================
    // 6. CREATE CLASSROOMS
    // ============================================
    console.log('\n🏫 Creating classrooms...');

    const classroomsData = [
      { name: 'Room 101', capacity: 60 },
      { name: 'Room 102', capacity: 60 },
      { name: 'Room 103', capacity: 60 },
      { name: 'Room 104', capacity: 60 },
      { name: 'Room 201', capacity: 60 },
      { name: 'Room 202', capacity: 60 },
      { name: 'Room 203', capacity: 60 },
      { name: 'Room 204', capacity: 60 },
      { name: 'Room 301', capacity: 80 },
      { name: 'Room 302', capacity: 80 },
      { name: 'Computer Lab 1', capacity: 30 },
      { name: 'Computer Lab 2', capacity: 30 },
      { name: 'Computer Lab 3', capacity: 30 },
      { name: 'Network Lab', capacity: 25 },
      { name: 'Electronics Lab', capacity: 25 }
    ];

    const classrooms = {};
    for (const classroomData of classroomsData) {
      const classroom = await Classroom.create(classroomData);
      classrooms[classroomData.name] = classroom;
    }
    console.log(`✅ ${Object.keys(classrooms).length} classrooms created`);

    // ============================================
    // 7. CREATE CLASSES
    // ============================================
    console.log('\n🎓 Creating classes...');

    const classesData = [
      { name: 'B.Tech CS - Sem 3 - Section A', code: 'BTECH-CS-3A', program: programs['BTECH-CS']._id, semester: 3, section: 'A', assignedRoom: classrooms['Room 101']._id, studentCount: 60 },
      { name: 'B.Tech CS - Sem 3 - Section B', code: 'BTECH-CS-3B', program: programs['BTECH-CS']._id, semester: 3, section: 'B', assignedRoom: classrooms['Room 102']._id, studentCount: 60 },
      { name: 'B.Tech CS - Sem 4 - Section A', code: 'BTECH-CS-4A', program: programs['BTECH-CS']._id, semester: 4, section: 'A', assignedRoom: classrooms['Room 103']._id, studentCount: 58 },
      { name: 'B.Tech CS - Sem 4 - Section B', code: 'BTECH-CS-4B', program: programs['BTECH-CS']._id, semester: 4, section: 'B', assignedRoom: classrooms['Room 104']._id, studentCount: 58 },
      { name: 'B.Tech CS - Sem 5 - Section A', code: 'BTECH-CS-5A', program: programs['BTECH-CS']._id, semester: 5, section: 'A', assignedRoom: classrooms['Room 201']._id, studentCount: 55 },
      { name: 'B.Tech ECE - Sem 3 - Section A', code: 'BTECH-ECE-3A', program: programs['BTECH-ECE']._id, semester: 3, section: 'A', assignedRoom: classrooms['Room 202']._id, studentCount: 50 },
      { name: 'BCA - Sem 3', code: 'BCA-3', program: programs['BCA']._id, semester: 3, section: 'A', assignedRoom: classrooms['Room 203']._id, studentCount: 40 },
      { name: 'BCA - Sem 4', code: 'BCA-4', program: programs['BCA']._id, semester: 4, section: 'A', assignedRoom: classrooms['Room 204']._id, studentCount: 40 },
      { name: 'M.Tech CS - Sem 1', code: 'MTECH-CS-1', program: programs['MTECH-CS']._id, semester: 1, section: 'A', assignedRoom: classrooms['Room 301']._id, studentCount: 30 },
      { name: 'M.Tech AI - Sem 1', code: 'MTECH-AI-1', program: programs['MTECH-AI']._id, semester: 1, section: 'A', assignedRoom: classrooms['Room 302']._id, studentCount: 25 }
    ];

    const classes = {};
    for (const classData of classesData) {
      const cls = await Class.create(classData);
      classes[classData.code] = cls;
      console.log(`  ✓ ${classData.name}`);
    }
    console.log(`✅ ${Object.keys(classes).length} classes created`);

    // ============================================
    // 8. CREATE CLASS-SUBJECT ASSIGNMENTS
    // ============================================
    console.log('\n📌 Creating class-subject assignments...');

    const assignments = [
      // B.Tech CS - Sem 3 - Section A (6 subjects)
      { class: classes['BTECH-CS-3A']._id, subject: subjects['CS301']._id, teacher: teacherRecords['Rajesh Kumar']._id },
      { class: classes['BTECH-CS-3A']._id, subject: subjects['CS301L']._id, teacher: teacherRecords['Rajesh Kumar']._id, preferredRoom: classrooms['Computer Lab 1']._id },
      { class: classes['BTECH-CS-3A']._id, subject: subjects['CS302']._id, teacher: teacherRecords['Priya Sharma']._id },
      { class: classes['BTECH-CS-3A']._id, subject: subjects['CS302L']._id, teacher: teacherRecords['Priya Sharma']._id, preferredRoom: classrooms['Computer Lab 1']._id },
      { class: classes['BTECH-CS-3A']._id, subject: subjects['MA301']._id, teacher: teacherRecords['Rahul Joshi']._id },
      { class: classes['BTECH-CS-3A']._id, subject: subjects['EN301']._id, teacher: teacherRecords['Deepak Shah']._id },
      
      // B.Tech CS - Sem 3 - Section B (6 subjects)
      { class: classes['BTECH-CS-3B']._id, subject: subjects['CS301']._id, teacher: teacherRecords['Rajesh Kumar']._id },
      { class: classes['BTECH-CS-3B']._id, subject: subjects['CS301L']._id, teacher: teacherRecords['Anita Reddy']._id, preferredRoom: classrooms['Computer Lab 2']._id },
      { class: classes['BTECH-CS-3B']._id, subject: subjects['CS302']._id, teacher: teacherRecords['Priya Sharma']._id },
      { class: classes['BTECH-CS-3B']._id, subject: subjects['CS302L']._id, teacher: teacherRecords['Vikram Patel']._id, preferredRoom: classrooms['Computer Lab 2']._id },
      { class: classes['BTECH-CS-3B']._id, subject: subjects['MA301']._id, teacher: teacherRecords['Kavita Nair']._id },
      { class: classes['BTECH-CS-3B']._id, subject: subjects['EN301']._id, teacher: teacherRecords['Deepak Shah']._id },
      
      // B.Tech CS - Sem 4 - Section A (6 subjects)
      { class: classes['BTECH-CS-4A']._id, subject: subjects['CS303']._id, teacher: teacherRecords['Amit Verma']._id },
      { class: classes['BTECH-CS-4A']._id, subject: subjects['CS303L']._id, teacher: teacherRecords['Amit Verma']._id, preferredRoom: classrooms['Computer Lab 1']._id },
      { class: classes['BTECH-CS-4A']._id, subject: subjects['CS304']._id, teacher: teacherRecords['Neha Singh']._id },
      { class: classes['BTECH-CS-4A']._id, subject: subjects['CS304L']._id, teacher: teacherRecords['Neha Singh']._id, preferredRoom: classrooms['Network Lab']._id },
      { class: classes['BTECH-CS-4A']._id, subject: subjects['MA302']._id, teacher: teacherRecords['Kavita Nair']._id },
      { class: classes['BTECH-CS-4A']._id, subject: subjects['MG301']._id, teacher: teacherRecords['Sunita Desai']._id },
      
      // B.Tech CS - Sem 4 - Section B (6 subjects)
      { class: classes['BTECH-CS-4B']._id, subject: subjects['CS303']._id, teacher: teacherRecords['Amit Verma']._id },
      { class: classes['BTECH-CS-4B']._id, subject: subjects['CS303L']._id, teacher: teacherRecords['Vikram Patel']._id, preferredRoom: classrooms['Computer Lab 2']._id },
      { class: classes['BTECH-CS-4B']._id, subject: subjects['CS304']._id, teacher: teacherRecords['Neha Singh']._id },
      { class: classes['BTECH-CS-4B']._id, subject: subjects['CS304L']._id, teacher: teacherRecords['Arun Pillai']._id, preferredRoom: classrooms['Network Lab']._id },
      { class: classes['BTECH-CS-4B']._id, subject: subjects['MA302']._id, teacher: teacherRecords['Rahul Joshi']._id },
      { class: classes['BTECH-CS-4B']._id, subject: subjects['MG301']._id, teacher: teacherRecords['Sunita Desai']._id },
      
      // B.Tech CS - Sem 5 - Section A (5 subjects)
      { class: classes['BTECH-CS-5A']._id, subject: subjects['CS305']._id, teacher: teacherRecords['Vikram Patel']._id },
      { class: classes['BTECH-CS-5A']._id, subject: subjects['CS306']._id, teacher: teacherRecords['Anita Reddy']._id },
      { class: classes['BTECH-CS-5A']._id, subject: subjects['CS306L']._id, teacher: teacherRecords['Anita Reddy']._id, preferredRoom: classrooms['Computer Lab 3']._id },
      { class: classes['BTECH-CS-5A']._id, subject: subjects['CS401']._id, teacher: teacherRecords['Sanjay Gupta']._id },
      { class: classes['BTECH-CS-5A']._id, subject: subjects['MA303']._id, teacher: teacherRecords['Kavita Nair']._id },
      
      // B.Tech ECE - Sem 3 - Section A (4 subjects)
      { class: classes['BTECH-ECE-3A']._id, subject: subjects['EC301']._id, teacher: teacherRecords['Suresh Rao']._id },
      { class: classes['BTECH-ECE-3A']._id, subject: subjects['MA301']._id, teacher: teacherRecords['Rahul Joshi']._id },
      { class: classes['BTECH-ECE-3A']._id, subject: subjects['PH301']._id, teacher: teacherRecords['Pooja Mehta']._id },
      { class: classes['BTECH-ECE-3A']._id, subject: subjects['EN301']._id, teacher: teacherRecords['Deepak Shah']._id },
      
      // BCA - Sem 3 (5 subjects)
      { class: classes['BCA-3']._id, subject: subjects['CS301']._id, teacher: teacherRecords['Rajesh Kumar']._id },
      { class: classes['BCA-3']._id, subject: subjects['CS301L']._id, teacher: teacherRecords['Anita Reddy']._id, preferredRoom: classrooms['Computer Lab 3']._id },
      { class: classes['BCA-3']._id, subject: subjects['CS302']._id, teacher: teacherRecords['Priya Sharma']._id },
      { class: classes['BCA-3']._id, subject: subjects['CS302L']._id, teacher: teacherRecords['Priya Sharma']._id, preferredRoom: classrooms['Computer Lab 3']._id },
      { class: classes['BCA-3']._id, subject: subjects['MA301']._id, teacher: teacherRecords['Rahul Joshi']._id },
      
      // BCA - Sem 4 (5 subjects)
      { class: classes['BCA-4']._id, subject: subjects['CS303']._id, teacher: teacherRecords['Amit Verma']._id },
      { class: classes['BCA-4']._id, subject: subjects['CS306']._id, teacher: teacherRecords['Anita Reddy']._id },
      { class: classes['BCA-4']._id, subject: subjects['CS306L']._id, teacher: teacherRecords['Anita Reddy']._id, preferredRoom: classrooms['Computer Lab 3']._id },
      { class: classes['BCA-4']._id, subject: subjects['MA302']._id, teacher: teacherRecords['Kavita Nair']._id },
      { class: classes['BCA-4']._id, subject: subjects['EN301']._id, teacher: teacherRecords['Deepak Shah']._id },
      
      // M.Tech CS - Sem 1 (4 subjects)
      { class: classes['MTECH-CS-1']._id, subject: subjects['CS401']._id, teacher: teacherRecords['Sanjay Gupta']._id },
      { class: classes['MTECH-CS-1']._id, subject: subjects['CS402']._id, teacher: teacherRecords['Meena Iyer']._id },
      { class: classes['MTECH-CS-1']._id, subject: subjects['CS403']._id, teacher: teacherRecords['Arun Pillai']._id },
      { class: classes['MTECH-CS-1']._id, subject: subjects['CS404']._id, teacher: teacherRecords['Vikram Patel']._id },
      
      // M.Tech AI - Sem 1 (4 subjects)
      { class: classes['MTECH-AI-1']._id, subject: subjects['CS401']._id, teacher: teacherRecords['Sanjay Gupta']._id },
      { class: classes['MTECH-AI-1']._id, subject: subjects['CS402']._id, teacher: teacherRecords['Meena Iyer']._id },
      { class: classes['MTECH-AI-1']._id, subject: subjects['CS403']._id, teacher: teacherRecords['Arun Pillai']._id },
      { class: classes['MTECH-AI-1']._id, subject: subjects['MA303']._id, teacher: teacherRecords['Kavita Nair']._id }
    ];

    let assignmentCount = 0;
    for (const assignment of assignments) {
      await ClassSubject.create(assignment);
      assignmentCount++;
    }
    console.log(`✅ ${assignmentCount} class-subject assignments created`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Departments: ${Object.keys(departments).length}`);
    console.log(`   • Programs: ${Object.keys(programs).length}`);
    console.log(`   • Classes: ${Object.keys(classes).length}`);
    console.log(`   • Subjects: ${Object.keys(subjects).length}`);
    console.log(`   • Classrooms: ${Object.keys(classrooms).length}`);
    console.log(`   • Admin: 1`);
    console.log(`   • Teachers (Users): ${teachers.length}`);
    console.log(`   • Teachers (Records): ${Object.keys(teacherRecords).length}`);
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Class-Subject Assignments: ${assignmentCount}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin:');
    console.log('   • Email: admin@college.edu');
    console.log('   • Password: admin123');
    console.log('\n   Teacher (example):');
    console.log('   • Email: rajesh.kumar@college.edu');
    console.log('   • Password: teacher123');
    console.log('\n   Student (example):');
    console.log('   • Email: aarav.sharma@student.college.edu');
    console.log('   • Password: student123');
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Next Steps:');
    console.log('   1. Login as admin@college.edu');
    console.log('   2. Go to "Generate Timetable" section');
    console.log('   3. Select a class from the list');
    console.log('   4. Click "Generate Timetable"');
    console.log('   5. View and publish timetables');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
});
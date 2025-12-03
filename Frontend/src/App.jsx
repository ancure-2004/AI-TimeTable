import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Users from './components/Users';
import Subjects from './components/Subjects';
import Teachers from './components/Teachers';
import Classrooms from './components/Classrooms';
import TimetableDisplay from './components/TimetableDisplay';
import Departments from './components/Departments';
import Programs from './components/Programs';
import Classes from './components/Classes';
import AssignSubjects from './components/AssignSubjects';
import GenerateTimetableNew from './components/GenerateTimetableNew';
import ViewTimetables from './components/ViewTimetables';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Only Routes */}
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/subjects" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Subjects />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teachers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Teachers />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/classrooms" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Classrooms />
              </ProtectedRoute>
            } 
          />
          
          {/* Phase 2 Routes */}
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Departments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/programs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Programs />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/classes" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Classes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/assign-subjects" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssignSubjects />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/generate-timetable-new/:classId" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GenerateTimetableNew />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/view-timetables" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViewTimetables />
              </ProtectedRoute>
            } 
          />
          
          {/* Old timetable route (kept for backward compatibility) */}
          <Route 
            path="/generate-timetable" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TimetableDisplay />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

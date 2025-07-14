// client/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analyse from './pages/Analyse';
import Chatbot from './pages/Chatbot';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

export default function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero onOpen={() => {}} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/analyse" element={<Analyse />} />
        <Route path="/dashboard/chatbot" element={<Chatbot />} />
        <Route path="/admin"             element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

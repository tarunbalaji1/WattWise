// client/src/App.js
import React, { useState }     from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Hero           from './components/Hero';
import LoginModal     from './components/LoginModal';
import SignupModal    from './components/SignupModal';

import Dashboard      from './pages/Dashboard';
import Profile        from './pages/Profile';
import Analyse        from './pages/Analyse';
import Chatbot        from './pages/Chatbot';
import AdminDashboard from './pages/AdminDashboard';


import './App.css';

export default function App() {
  // Tracks which modal is open: 'login', 'signup', or null
  const [openModal, setOpenModal] = useState(null);

  return (
    <BrowserRouter>
      {/* Conditionally render the login/signup popups */}
      {openModal === 'login'  && <LoginModal  onClose={() => setOpenModal(null)} />}
      {openModal === 'signup' && <SignupModal onClose={() => setOpenModal(null)} />}

      <Routes>
        {/* Landing page: pass the setter so Hero can open modals */}
        <Route
          path="/"
          element={<Hero onOpen={setOpenModal} />}
        />

        {/* User dashboard routes */}
        <Route path="/dashboard"           element={<Dashboard />} />
        <Route path="/dashboard/profile"   element={<Profile />} />
        <Route path="/dashboard/analyse" element={<Analyse />} />
        <Route path="/dashboard/chatbot"   element={<Chatbot />} />

        {/* Admin console */}
        <Route path="/admin"               element={<AdminDashboard />} />

        {/* TODO: add sub‑routes for analyse-datewise, predictions, admin features… */}
      </Routes>
    </BrowserRouter>
  );
}

// client/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analyse from './pages/Analyse';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero onOpen={() => {}} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/analyse" element={<Analyse />} />
      </Routes>
    </BrowserRouter>
  );
}

// client/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => navigate('/');

  return (
    <header className="navbar">
      <div className="navbar__logo">WattWise</div>
      <button className="navbar__logout" onClick={handleLogout}>
        Log Out
      </button>
    </header>
  );
}

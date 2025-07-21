// client/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="sidebar__toggle"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <nav className="sidebar__nav">
          <Link to="/dashboard" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/dashboard/profile" onClick={() => setOpen(false)}>User Profile</Link>
          <Link to="/dashboard/analyse" onClick={() => setOpen(false)}>Analyse</Link>
          <Link to="/dashboard/chatbot" onClick={() => setOpen(false)}>Chatbot</Link>
          <Link to="/dashboard/predictions" onClick={() => setOpen(false)}>Predictions</Link>
        </nav>
      </aside>

      {open && (
        <div
          className="sidebar__overlay"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  // FIX 1: Initialize 'open' to false so the sidebar is closed by default
  const [open, setOpen] = useState(false);

  // Helper function to close the sidebar when a link is clicked
  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        className="admin-sidebar__toggle"
        onClick={() => setOpen(!open)} // This button still toggles it open/closed
      >
        ☰
      </button>

      <aside className={`admin-sidebar ${open ? 'open' : 'closed'}`}>
        <nav className="admin-sidebar__nav">
          {/* FIX 2: Add onClick handler to each Link to close the sidebar */}
          <Link to="/admin/residents" onClick={handleLinkClick}>Manage Residents</Link>
          <Link to="/admin/upload" onClick={handleLinkClick}>Daily Upload</Link>
          <Link to="/admin/analyse" onClick={handleLinkClick}>Analyse Usage</Link>
          <Link to="/admin/high-consumers" onClick={handleLinkClick}>High Consumers</Link>
        </nav>
      </aside>

      {/* This overlay still closes the sidebar if clicked outside */}
      {open && (
        <div
          className="admin-sidebar__overlay"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
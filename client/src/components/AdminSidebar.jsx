import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        className="admin-sidebar__toggle"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      <aside className={`admin-sidebar ${open ? 'open' : 'closed'}`}>
        <nav className="admin-sidebar__nav">
          <Link to="/admin/residents">Manage Residents</Link>
          <Link to="/admin/upload">Daily Upload</Link>
          <Link to="/admin/analyse">Analyse Usage</Link>
          <Link to="/admin/high-consumers">High Consumers</Link>
        </nav>
      </aside>

      {open && (
        <div
          className="admin-sidebar__overlay"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

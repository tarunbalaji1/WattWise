import React from 'react';
import './AdminDashboard.css';
import AdminSidebar from '../components/AdminSidebar';
import '../components/AdminSidebar.css';


export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <AdminSidebar />

      <div className="admin-main">
        <header className="admin-header">
          <h1>Admin Console</h1>
        </header>

        <div className="admin-content">
          <p>Welcome, <strong>Admin</strong>! Choose an action from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}

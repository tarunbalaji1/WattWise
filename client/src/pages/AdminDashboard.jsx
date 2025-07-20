import React from 'react';
import './AdminDashboard.css';
import AdminSidebar from '../components/AdminSidebar';
import '../components/AdminSidebar.css';
import Navbar from '../components/Navbar';
import AdminCsvUploader from '../components/AdminCsvUploader'; // ADDED: Import the new component

export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <AdminSidebar />

      <div className="admin-main">
        
        <Navbar />
        
        <div className="admin-content">
          {/* ADDED: The CSV Uploader component is placed here */}
          <AdminCsvUploader />
          
          {/* You can keep or remove the welcome message below */}
          <p style={{marginTop: '40px'}}>Welcome, <strong>Admin</strong>! Choose an action from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}
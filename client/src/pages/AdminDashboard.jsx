import React from 'react';
import './AdminDashboard.css';
import AdminSidebar from '../components/AdminSidebar';
import '../components/AdminSidebar.css';
import Navbar from '../components/Navbar'; 


export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <AdminSidebar />

      <div className="admin-main">
         
        
         
        <Navbar />
       
         

        <div className="admin-content">
          <p>Welcome, <strong>Admin</strong>! Choose an action from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}

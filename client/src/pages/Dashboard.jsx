// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState({
    userYest: null,
    commYest: null,
    userMonth: null,
  });

  useEffect(() => {
    // Replace these with real API calls
    setData({
      userYest: 12.4,
      commYest: 15.8,
      userMonth: 320,
    });
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard__main">
        <Navbar />
        <div className="dashboard__cards">
          <div className="card">
            <h3>Yesterday’s Usage</h3>
            <p>{data.userYest} kWh</p>
          </div>
          <div className="card">
            <h3>Community Avg (Yesterday)</h3>
            <p>{data.commYest} kWh</p>
          </div>
          <div className="card">
            <h3>This Month’s Usage</h3>
            <p>{data.userMonth} kWh</p>
          </div>
        </div>
      </div>
    </div>
  );
}

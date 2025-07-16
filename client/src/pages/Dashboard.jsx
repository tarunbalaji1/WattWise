// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Navbar  from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

export default function Dashboard() {
  const [data,    setData]    = useState({ userYest:0, commYest:0, userMonth:0 });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn('No token—redirecting to login');
      setLoading(false);
      return;
    }

    fetch('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        setData({
          userYest:  json.userYesterday,
          commYest:  json.communityYesterday,
          userMonth: json.userMonthTotal
        });
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard__main">
          <Navbar />
          <div className="dashboard__loading">Loading…</div>
        </div>
      </div>
    );
  }

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
            <p>{data.commYest.toFixed(2)} kWh</p>
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

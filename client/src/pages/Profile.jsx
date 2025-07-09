import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // TODO: replace with real API call
    setUser({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      tower: 'Tower A',
      flat: 'Flat 302',
      username: 'alicej',
      dailyLimit: 25,    // kWh
      monthlyLimit: 750, // kWh
    });
  }, []);

  if (!user) return null;

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-page__main">
        <Navbar />

        <div className="profile-page__content">
          {/* User Details */}
          <section className="profile-page__section">
            <h2 className="section-title">Your Details</h2>
            <ul className="details-list">
              <li><strong>Name:</strong> {user.name}</li>
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>Tower:</strong> {user.tower}</li>
              <li><strong>Flat:</strong> {user.flat}</li>
              <li><strong>Username:</strong> {user.username}</li>
            </ul>
          </section>

          {/* Limits */}
          <section className="profile-page__section">
            <h2 className="section-title">Your Energy Limits</h2>
            <div className="limits-cards">
              <div className="limit-card">
                <h3>Daily Limit</h3>
                <p>{user.dailyLimit} kWh</p>
              </div>
              <div className="limit-card">
                <h3>Monthly Limit</h3>
                <p>{user.monthlyLimit} kWh</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

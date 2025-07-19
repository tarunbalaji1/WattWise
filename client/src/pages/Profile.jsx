import React, { useEffect, useState } from 'react';
import Sidebar  from '../components/Sidebar';
import Navbar   from '../components/Navbar';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [dailyInput,   setDailyInput]   = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');
  const token = localStorage.getItem('token');

  // 1) fetch profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/dashboard/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setUser(data);
        // preset inputs
        setDailyInput(data.dailyLimit ?? '');
        setMonthlyInput(data.monthlyLimit ?? '');
      } catch (err) {
        console.error('Profile fetch error:', err);
        alert('Could not load profile');
      }
    }
    loadProfile();
  }, [token]);

  if (!user) return null;  // or a spinner

  // 2) handle save
  const handleSave = async () => {
    const daily   = Number(dailyInput);
    const monthly = Number(monthlyInput);
    if (isNaN(daily) || isNaN(monthly)) {
      return alert('Please enter valid numbers');
    }
    try {
      const res = await fetch('/api/dashboard/thresholds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ daily, monthly })
      });
      if (!res.ok) throw new Error(await res.text());
      const { daily: newDaily, monthly: newMonthly } = await res.json();
      // update UI
      setUser(u => ({
        ...u,
        dailyLimit:   newDaily,
        monthlyLimit: newMonthly
      }));
      setEditMode(false);
    } catch (err) {
      console.error('Save thresholds error:', err);
      alert('Failed to save limits');
    }
  };

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-page__main">
        <Navbar />

        <div className="profile-page__content">
          {/* 1) User Details */}
          <section className="profile-page__section">
            <h2 className="section-title">Your Details</h2>
            <ul className="details-list">
              <li><strong>Name:</strong>     {user.name}</li>
              <li><strong>Email:</strong>    {user.email}</li>
              <li><strong>Tower:</strong>    {user.tower}</li>
              <li><strong>Flat:</strong>     {user.flat}</li>
              <li><strong>Mobile Number:</strong> {user.mobile}</li>
            </ul>
          </section>

          {/* 2) Energy Limits */}
          <section className="profile-page__section">
            <h2 className="section-title">Your Energy Limits</h2>
            <div className="limits-cards">

              {/* Daily Limit Card */}
              <div className="limit-card">
                <h3>Daily Limit</h3>
                {editMode ? (
                  <input
                    type="number"
                    value={dailyInput}
                    onChange={e => setDailyInput(e.target.value)}
                  />
                ) : (
                  <p>{user.dailyLimit ?? '—'} kWh</p>
                )}
              </div>

              {/* Monthly Limit Card */}
              <div className="limit-card">
                <h3>Monthly Limit</h3>
                {editMode ? (
                  <input
                    type="number"
                    value={monthlyInput}
                    onChange={e => setMonthlyInput(e.target.value)}
                  />
                ) : (
                  <p>{user.monthlyLimit ?? '—'} kWh</p>
                )}
              </div>

            </div>

            {/* Edit / Save buttons */}
            <div className="profile-actions">
              {editMode ? (
                <>
                  <button onClick={handleSave}>Save</button>
                  <button onClick={() => setEditMode(false)}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)}>Edit Limits</button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

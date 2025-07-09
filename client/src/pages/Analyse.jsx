import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './Analyse.css';

export default function Analyse() {
  const options = [
    { label: 'Check Last 5 Days',   path: '/dashboard/analyse/5days' },
    { label: 'Check Last 15 Days',  path: '/dashboard/analyse/15days' },
    { label: 'Check Last 30 Days',  path: '/dashboard/analyse/30days' },
    { label: 'This Month’s Usage',  path: '/dashboard/analyse/month' },
  ];

  return (
    <div className="analyse-page">
      <Sidebar />
      <div className="analyse-page__main">
        <Navbar />
        <div className="analyse-page__content">
          <h2 className="analyse-title">Choose a Time Window</h2>
          <div className="analyse-buttons">
            {options.map(opt => (
              <button
                key={opt.path}
                className="analyse-button"
                onClick={() => {
                  // TODO: navigate to opt.path or fetch data
                  // e.g. navigate(opt.path)
                  console.log('Navigate to', opt.path);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

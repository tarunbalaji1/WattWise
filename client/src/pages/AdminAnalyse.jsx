import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, LineElement, PointElement,
  CategoryScale, LinearScale,
  Title, Tooltip, Legend
} from 'chart.js';
import AdminSidebar from '../components/AdminSidebar'; // Use AdminSidebar
import Navbar from '../components/Navbar'; // No need for Navbar here, AdminDashboard handles header
import './AdminAnalyse.css'; // Use the new CSS file


Chart.register(
  LineElement, PointElement,
  CategoryScale, LinearScale,
  Title, Tooltip, Legend
);

export default function AdminAnalyse() {
  const [rows, setRows] = useState([]);
  const [windowSize, setWindowSize] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flatNo, setFlatNo] = useState(''); // New state for flat number
  const [towerNo, setTowerNo] = useState(''); // New state for tower number
  const token = localStorage.getItem('token');

  const options = [
    { label: 'Check Last 5 Days', days: 5 },
    { label: 'Check Last 15 Days', days: 15 },
    { label: 'Check Last 30 Days', days: 30 },
    { label: 'This Month’s Usage', days: 'month' },
  ];

  async function loadData(days, customStartDate = null, customEndDate = null) {
    // Ensure flatNo and towerNo are provided for admin analysis
    if (!flatNo || !towerNo) {
      alert('Please enter both Flat Number and Tower Number.');
      return;
    }

    setWindowSize(days);
    let apiUrl;

    // Base URL for the new admin-specific endpoint
    let baseUrl = `/api/admin/range-by-flat?flatNo=${flatNo}&towerNo=${towerNo}`;

    if (days === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert('Please select both start and end dates for a custom range.');
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('Start date cannot be after end date.');
        return;
      }
      apiUrl = `${baseUrl}&startDate=${customStartDate}&endDate=${customEndDate}`;
    } else {
      apiUrl = `${baseUrl}&days=${days}`;
    }

    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data);
    } catch (err) {
      console.error('Admin Analyse fetch error:', err);
      alert('Failed to load data for the specified resident. Check numbers or data availability.');
    }
  }

  const handleCustomRangeLoad = () => {
    loadData('custom', startDate, endDate);
  };

  // Prepare chart datasets (same as Analyse.jsx)
  const labels = rows.map(r => r.date);
  const userData = rows.map(r => r.user); // This will be the selected resident's data
  const commData = rows.map(r => r.community); // This will be the community average

  const commonOpts = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: windowSize === 'custom'
          ? `Usage for Flat ${flatNo}, Tower ${towerNo} (${startDate} to ${endDate})`
          : windowSize > 0
            ? `Usage for Flat ${flatNo}, Tower ${towerNo} (Last ${windowSize} Days)`
            : `Usage for Flat ${flatNo}, Tower ${towerNo} (Month to Date)`,
        font: { size: 18 }
      },
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kWh' }
      }
    }
  };

  const datasetYou = {
    label: `Flat ${flatNo}, Tower ${towerNo}`, // Label for the selected resident
    data: userData,
    borderColor: '#00223e',
    backgroundColor: '#00223e',
    tension: 0.3,
    pointRadius: 4
  };
  const datasetBoth = [
    datasetYou,
    {
      label: 'Community Avg',
      data: commData,
      borderColor: '#fdbb2d',
      backgroundColor: '#fdbb2d',
      borderDash: [5, 5],
      tension: 0.3,
      pointRadius: 4
    }
  ];

  return (
    <div className="analyse-page">
      <AdminSidebar /> {/* Use AdminSidebar */}
      <div className="analyse-page__main">
         <Navbar />
        <div className="analyse-page__content">
          <h2 className="analyse-title">Analyse Resident Usage</h2>

          {/* New Input Fields for Flat No and Tower No */}
          <div className="resident-input-section">
            <label htmlFor="towerNo">Tower No:</label>
            <input
              type="text"
              id="towerNo"
              value={towerNo}
              onChange={(e) => setTowerNo(e.target.value)}
              className="resident-input"
              placeholder="e.g., A"
            />
            <label htmlFor="flatNo">Flat No:</label>
            <input
              type="text"
              id="flatNo"
              value={flatNo}
              onChange={(e) => setFlatNo(e.target.value)}
              className="resident-input"
              placeholder="e.g., 101"
            />
          </div>

          <h3 className="analyse-subtitle">Choose a Time Window</h3>
          <div className="analyse-buttons">
            {options.map(opt => (
              <button
                key={opt.days}
                className="analyse-button"
                onClick={() => loadData(opt.days)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="custom-range-section">
            <h3 className="custom-range-title">Select Custom Dates:</h3>
            <div className="custom-range-inputs">
              <label htmlFor="startDate">From:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="custom-date-input"
              />
              <label htmlFor="endDate">To:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="custom-date-input"
              />
              <button
                className="analyse-button custom-range-button"
                onClick={handleCustomRangeLoad}
              >
                Load Custom Range
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p style={{ marginTop: '2rem', color: '#555' }}>
              Enter resident details and select a window to view usage…
            </p>
          ) : (
            <div className="analyse-charts">
              {/* Selected Resident's chart */}
              <div className="analyse-chart">
                <Line
                  data={{ labels, datasets: [datasetYou] }}
                  options={commonOpts}
                />
              </div>
              {/* Selected Resident + Community chart */}
              <div className="analyse-chart">
                <Line
                  data={{ labels, datasets: datasetBoth }}
                  options={commonOpts}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
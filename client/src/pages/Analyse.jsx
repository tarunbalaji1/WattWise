import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, LineElement, PointElement,
  CategoryScale, LinearScale,
  Title, Tooltip, Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom'; // if you ever need navigation
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import './Analyse.css';

Chart.register(
  LineElement, PointElement,
  CategoryScale, LinearScale,
  Title, Tooltip, Legend
);

export default function Analyse() {
  const [rows, setRows] = useState([]);
  const [windowSize, setWindowSize] = useState(null); // Keep this for existing chart titles
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const token = localStorage.getItem('token');

  const options = [
    { label: 'Check Last 5 Days', days: 5 },
    { label: 'Check Last 15 Days', days: 15 },
    { label: 'Check Last 30 Days', days: 30 },
    { label: 'This Month’s Usage', days: 'month' },
    // Removed 'custom' from here, as it will have its own dedicated input fields
  ];

  async function loadData(days, customStartDate = null, customEndDate = null) {
    setWindowSize(days); // This will track '5', '15', '30', 'month' or 'custom' for display
    let apiUrl;

    if (days === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert('Please select both start and end dates for a custom range.');
        return;
      }
      // Ensure start date is not after end date
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('Start date cannot be after end date.');
        return;
      }
      apiUrl = `/api/dashboard/range?startDate=${customStartDate}&endDate=${customEndDate}`;
    } else {
      apiUrl = `/api/dashboard/range?days=${days}`;
    }

    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data);
    } catch (err) {
      console.error('Analyse fetch error:', err);
      alert('Failed to load data');
    }
  }

  // Handle custom range button click
  const handleCustomRangeLoad = () => {
    loadData('custom', startDate, endDate); // Pass 'custom' and selected dates
  };

  // Prepare chart datasets
  const labels = rows.map(r => r.date);
  const userData = rows.map(r => r.user);
  const commData = rows.map(r => r.community);

  // Chart configs (update title logic to handle 'custom')
  const commonOpts = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: windowSize === 'custom'
          ? `Custom Range (${startDate} to ${endDate})`
          : windowSize > 0
            ? `Last ${windowSize} Days`
            : 'Month to Date',
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
    label: 'You',
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
      <Sidebar />
      <div className="analyse-page__main">
        <Navbar />
        <div className="analyse-page__content">
          <h2 className="analyse-title">Choose a Time Window</h2>
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
              Select a window above or a custom range to view your usage…
            </p>
          ) : (
            <div className="analyse-charts">
              {/* User-only chart */}
              <div className="analyse-chart">
                <Line
                  data={{ labels, datasets: [datasetYou] }}
                  options={commonOpts}
                />
              </div>
              {/* User + Community chart */}
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


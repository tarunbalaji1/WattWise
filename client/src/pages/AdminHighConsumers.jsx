import React, { useEffect, useState } from 'react';
import Sidebar from '../components/AdminSidebar';
import Navbar  from '../components/Navbar';
import './AdminHighConsumers.css';

export default function AdminHighConsumers() {
  const [list, setList]       = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/high-consumers?sort=${sortOrder}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setList(data);
      } catch (e) {
        console.error(e);
        alert('Failed to load high consumers');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sortOrder, token]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="high-consumers-page">
      <Sidebar />
      <div className="high-consumers-main">
        <Navbar />
        <div className="high-consumers-content">
          <h2>High Consumers</h2>

          <button
            className="sort-btn"
            onClick={toggleSort}
            disabled={loading}
          >
            {loading
              ? 'Loading…'
              : (sortOrder === 'desc'
                  ? 'Showing: Highest → Lowest'
                  : 'Showing: Lowest → Highest'
                )
            }
          </button>

          <table className="high-consumers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tower</th>
                <th>Flat</th>
                <th>Usage (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.towerNo}</td>
                  <td>{u.flatNo}</td>
                  <td>{u.consumption.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

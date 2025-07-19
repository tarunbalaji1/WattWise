// src/pages/ManageResidents.jsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/AdminSidebar';
import Navbar  from '../components/Navbar';
import './ManageResidents.css';

export default function ManageResidents() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    name:   '',
    email:  '',
    towerNo:'',
    flatNo: '',
    mobile: '',
    password: ''
  });
  const [currentUserId, setCurrentUserId] = useState('');
  const token = localStorage.getItem('token');

  // 1) load residents + current user _id
  useEffect(() => {
    (async () => {
      try {
        // a) fetch all residents
        const resList = await fetch('/api/admin/residents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resList.ok) throw new Error(await resList.text());
        setList(await resList.json());

        // b) fetch profile (ensure it returns {_id,...})
        const resProf = await fetch('/api/dashboard/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resProf.ok) {
          const prof = await resProf.json();
          setCurrentUserId(prof._id);
        }
      } catch (e) {
        console.error(e);
        alert('Failed to initialize data');
      }
    })();
  }, [token]);

  // 2) handle delete (backend blocks deleting yourself)
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this resident?')) return;
    await fetch(`/api/admin/residents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    // reload list
    const reload = await fetch('/api/admin/residents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setList(await reload.json());
  };

  // 3) handle add
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      // clear form
      setForm({
        name:   '',
        email:  '',
        towerNo:'',
        flatNo: '',
        mobile: '',
        password: ''
      });
      // reload list
      const reload = await fetch('/api/admin/residents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(await reload.json());
    } catch (e) {
      console.error(e);
      alert('Failed to add resident');
    }
  };

  return (
    <div className="manage-residents-page">
      <Sidebar />
      <div className="manage-residents-main">
        <Navbar />
        <div className="manage-residents-content">
          <h2>Manage Residents</h2>

          {/* ➕ Add form */}
          <form className="add-form" onSubmit={handleAdd}>
            {['name','email','towerNo','flatNo','mobile','password'].map(field => (
              <input
                key={field}
                type={field === 'password' ? 'password' : 'text'}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required
              />
            ))}
            <button type="submit">Add Resident</button>
          </form>

          {/* 🗒️ List */}
          <table className="residents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tower</th>
                <th>Flat</th>
                <th>Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.towerNo}</td>
                  <td>{r.flatNo}</td>
                  <td>{r.mobile}</td>
                  <td>
                    {r._id !== currentUserId ? (
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(r._id)}
                      >
                        Remove
                      </button>
                    ) : (
                      <em style={{ color: '#666' }}>You</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

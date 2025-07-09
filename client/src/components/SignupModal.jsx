import React, { useState } from 'react';
import './Modal.css';

export default function SignupModal({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    tower: '',
    flat: '',
    username: '',
    password: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: call your signup API here
    console.log('Signing up:', form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__form">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            {['name','email','tower','flat','username','password'].map(field => (
              <label key={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <input
                  name={field}
                  type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={handleChange}
                  required
                />
              </label>
            ))}
            <button type="submit" className="modal__submit">
              Sign Up
            </button>
          </form>
        </div>
        <div className="modal__side">
          <h3>Join WattWise</h3>
          <p>Create your account to compare usage, get tips, and compete with neighbors.</p>
        </div>
      </div>
    </div>
  );
}

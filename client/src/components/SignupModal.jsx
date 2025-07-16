import React, { useState } from 'react';
import './Modal.css';

export default function SignupModal({ onClose }) {
  const [form, setForm] = useState({
    name:     '',
    email:    '',
    tower:    '',
    flat:     '',
    mobile:   '',
    password: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Normalize email
    const payload = {
      ...form,
      email: form.email.trim().toLowerCase(),
    };
    console.log('▶️ Signing up:', payload);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('◀️ Signup response:', res.status, data);

      if (res.ok) {
        alert(data.msg || 'Signup successful!');
        onClose();
      } else {
        alert(data.msg || 'Signup failed.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      alert('Unexpected error. Please try again.');
    }
  };

  const fields = [
    { key: 'name',     label: 'Name'     },
    { key: 'email',    label: 'Email'    },
    { key: 'tower',    label: 'Tower'    },
    { key: 'flat',     label: 'Flat'     },
    { key: 'mobile',   label: 'Mobile'   },
    { key: 'password', label: 'Password' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__form">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label }) => (
              <label key={key}>
                {label}
                <input
                  name={key}
                  type={
                    key === 'email'    ? 'email' :
                    key === 'password' ? 'password' :
                                         'text'
                  }
                  value={form[key]}
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
          <p>
            Create your account to compare usage, get tips, and compete
            with neighbors.
          </p>
        </div>
      </div>
    </div>
  );
}

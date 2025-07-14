import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css'; // shared styles

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();                  

 // in sendMessage login form
const handleSubmit = async e => {
  e.preventDefault();
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    onClose();
    navigate('/dashboard');  // or however you redirect
  } else {
    alert(data.msg);
  }
};


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Left side: form */}
        <div className="modal__form">
          <h2>Log In</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="modal__submit">
              Log In
            </button>
          </form>
        </div>
        {/* Right side: orange info panel */}
        <div className="modal__side">
          <h3>Welcome Back!</h3>
          <p>Enter your credentials to access your community dashboard and start saving energy.</p>
        </div>
      </div>
    </div>
  );
}

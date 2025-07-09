import React, { useState } from 'react';
import './Modal.css'; // shared styles

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: call your login API here
    console.log('Logging in:', { email, password });
    onClose();
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

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './Modal.css';

// export default function LoginModal({ onClose }) {
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async e => {
//     e.preventDefault();
//     const payload = {
//       email: email.trim().toLowerCase(),
//       password,
//     };
//     console.log('▶️ Logging in:', payload);

//     try {
//       const res = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       console.log('◀️ Login response:', res.status, data);

//       if (res.ok) {
//         localStorage.setItem('token', data.token);
//         onClose();
//         navigate('/dashboard');
//       } else {
//         alert(data.msg || 'Login failed.');
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       alert('Unexpected error. Please try again.');
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal" onClick={e => e.stopPropagation()}>
//         <div className="modal__form">
//           <h2>Log In</h2>
//           <form onSubmit={handleSubmit}>
//             <label>
//               Email
//               <input
//                 type="email"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//               />
//             </label>
//             <label>
//               Password
//               <input
//                 type="password"
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 required
//               />
//             </label>
//             <button type="submit" className="modal__submit">
//               Log In
//             </button>
//           </form>
//         </div>
//         <div className="modal__side">
//           <h3>Welcome Back!</h3>
//           <p>
//             Enter your credentials to access your community dashboard
//             and start saving energy.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css';

export default function LoginModal({ onClose }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    console.log('▶️ Logging in:', payload);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('◀️ Login response:', res.status, data);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        onClose(); // Close the modal

        // --- START: Client-side hardcoded check as requested ---
        if (payload.email === 'wattwise@admin.com') {
          navigate('/admin-dashboard'); // Navigate to the admin dashboard
        } else {
          navigate('/dashboard'); // Navigate to the regular user dashboard
        }
        // --- END: Client-side hardcoded check ---

      } else {
        alert(data.msg || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Unexpected error. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
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
        <div className="modal__side">
          <h3>Welcome Back!</h3>
          <p>
            Enter your credentials to access your community dashboard
            and start saving energy.
          </p>
        </div>
      </div>
    </div>
  );
}

// // client/src/App.js
// import React, { useState }     from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';

// import Hero           from './components/Hero';
// import LoginModal     from './components/LoginModal';
// import SignupModal    from './components/SignupModal';

// import Dashboard      from './pages/Dashboard';
// import Profile        from './pages/Profile';
// import Analyse        from './pages/Analyse';
// import Chatbot        from './pages/Chatbot';
// import AdminDashboard from './pages/AdminDashboard';


// import './App.css';

// export default function App() {
//   // Tracks which modal is open: 'login', 'signup', or null
//   const [openModal, setOpenModal] = useState(null);

//   return (
//     <BrowserRouter>
//       {/* Conditionally render the login/signup popups */}
//       {openModal === 'login'  && <LoginModal  onClose={() => setOpenModal(null)} />}
//       {openModal === 'signup' && <SignupModal onClose={() => setOpenModal(null)} />}

//       <Routes>
//         {/* Landing page: pass the setter so Hero can open modals */}
//         <Route
//           path="/"
//           element={<Hero onOpen={setOpenModal} />}
//         />

//         {/* User dashboard routes */}
//         <Route path="/dashboard"           element={<Dashboard />} />
//         <Route path="/dashboard/profile"   element={<Profile />} />
//         <Route path="/dashboard/analyse" element={<Analyse />} />
//         <Route path="/dashboard/chatbot"   element={<Chatbot />} />

//         {/* Admin console */}
//         <Route path="/admin-dashboard"               element={<AdminDashboard />} />
//         <Route path="/admin/analyse" element={<PrivateRoute allowedRoles={['admin']}><AdminAnalyse /></PrivateRoute>}/>

//         {/* TODO: add sub‑routes for analyse-datewise, predictions, admin features… */}
//       </Routes>
//     </BrowserRouter>
//   );
// }
// client/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate for redirects

import Hero from './components/Hero';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analyse from './pages/Analyse';
import Chatbot from './pages/Chatbot';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalyse from './pages/AdminAnalyse'; // NEW: Import AdminAnalyse

import './App.css';

// --- Define PrivateRoute component HERE, outside of the App function ---
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole'); // Get the stored role

  if (!token) {
    // Not logged in, redirect to home/login
    return <Navigate to="/" replace />;
  }

  // Check if allowedRoles is provided and if the user's role is not included
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but not authorized for this specific role,
    // Redirect to the default dashboard or a more appropriate 'access denied' page
    // For now, redirecting to the general dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children; // Render the child component if authorized
};
// ----------------------------------------------------------------------


export default function App() {
  // Tracks which modal is open: 'login', 'signup', or null
  const [openModal, setOpenModal] = useState(null);

  return (
    <BrowserRouter>
      {/* Conditionally render the login/signup popups */}
      {openModal === 'login'  && <LoginModal  onClose={() => setOpenModal(null)} />}
      {openModal === 'signup' && <SignupModal onClose={() => setOpenModal(null)} />}

      <Routes>
        {/* Landing page: pass the setter so Hero can open modals */}
        <Route
          path="/"
          element={<Hero onOpen={setOpenModal} />}
        />

        {/* User dashboard routes - NOW PROTECTED */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}> {/* Both user and admin can access general dashboard */}
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/analyse"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <Analyse />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/chatbot"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <Chatbot />
            </PrivateRoute>
          }
        />

        {/* Admin console routes - STRICTLY PROTECTED FOR ADMIN ONLY */}
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analyse"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminAnalyse />
            </PrivateRoute>
          }
        />

        {/* TODO: add sub‑routes for analyse-datewise, predictions, admin features… */}
      </Routes>
    </BrowserRouter>
  );
}
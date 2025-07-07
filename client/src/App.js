import React from 'react';

import Hero from './components/Hero';
import './App.css';
// import './styles/index.css';

function App() {
  return (
    <div className="container">
      <Hero />
      <h1>Welcome to WattWise</h1>
      <button className="button">Check Usage</button>
    </div>
  );
}

export default App;


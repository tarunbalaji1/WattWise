// client/src/components/Hero.js
import React from 'react';
import './Hero.css';


export default function Hero() {
  return (
    <header className="hero">
      <nav className="hero__nav">
        <div className="hero__logo">WattWise</div>
        <ul className="hero__links">
          <li><a href="/">home</a></li>
          <li><a href="/dashboard">dashboard</a></li>
          <li><a href="/alerts">alerts</a></li>
          <li><a href="/tips">tips</a></li>
          <li><a href="/leaderboard">leaderboard</a></li>
          <li><a href="/login">member login</a></li>
          <li><button className="hero__cta">make the switch</button></li>
        </ul>
      </nav>

      <div className="hero__content">
        <img src={"/icons/bulb.png"} alt="Bulb icon" className="hero__icon" />
        <h1 className="hero__title">Our guides to saving</h1>
        <p className="hero__subtitle">
          At WattWise, we empower communities with smart insights &amp; tips to lower your electricity bills.
        </p>
      </div>

      <div className="hero__wave"></div>
    </header>
  );
}

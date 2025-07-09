import React from 'react';
import './Hero.css';

export default function Hero({ onOpen }) {
  return (
    <header className="hero">
      <nav className="hero__nav">
        <div className="hero__logo">WattWise</div>
        <div className="hero__auth">
          <button
            className="hero__btn hero__btn--login"
            onClick={() => onOpen('login')}
          >
            Log In
          </button>
          <button
            className="hero__btn hero__btn--signup"
            onClick={() => onOpen('signup')}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="hero__content">
        <img src="/icons/bulb.png" alt="Bulb icon" className="hero__icon" />
        <h1 className="hero__title">Our guides to saving</h1>
        <p className="hero__subtitle">
          At WattWise, we empower communities with smart insights & tips to lower your electricity bills.
        </p>
      </div>
    </header>
  );
}

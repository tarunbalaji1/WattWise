// src/components/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './Chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // auto‑scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message: userMsg.text })
      });
      const { reply, error } = await res.json();
      if (error) throw new Error(error);

      setMessages(m => [...m, { from: 'bot', text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { from: 'bot', text: 'Oops, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-page">
      <Sidebar />
      <div className="chatbot-page__main">
        <Navbar />
        <div className="chatbot-container">
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-message chatbot-message--${msg.from}`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message chatbot-message--bot">
                Typing…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type your message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

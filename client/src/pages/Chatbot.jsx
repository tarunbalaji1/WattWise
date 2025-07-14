import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './Chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = e => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulated bot response (replace with real API call)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: `You said: “${userMsg.text}”` }
      ]);
    }, 500);
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
            <div ref={endRef} />
          </div>

          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type your message…"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

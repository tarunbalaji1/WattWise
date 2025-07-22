// server/routes/chatbot.js
const express         = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

// Your system pre-prompt (or from .env)
const SYSTEM_PROMPT = process.env.DOMAIN_CONTEXT
  || 'You are a concise energy-savings assistant for residents, always give clear, actionable tips.';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post('/', async (req, res) => {
  try {
    const userText = req.body.message;
    if (!userText) {
      return res.status(400).json({ error: 'No message provided.' });
    }

    // Merge system + user into one string
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${userText}\nAssistant:`;

    // Call Gemini with a single-string contents
    const response = await ai.models.generateContent({
      model:    'gemini-2.5-flash',
      contents: fullPrompt,    // single string
      temperature: 0.7,
      maxOutputTokens: 512
    });

    // response.text holds the assistant reply
    const botReply = response.text || 'Sorry, I didn’t get that.';

    return res.json({ reply: botReply });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;

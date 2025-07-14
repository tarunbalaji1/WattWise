// server/index.js
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(conn => {
    console.log('✔️ MongoDB connected to DB:', conn.connection.db.databaseName);
    console.log('✔️ Collections:', Object.keys(conn.connection.collections));

    // 2) Mount your auth routes after DB is ready
    app.use('/api/auth', authRoutes);

    // 3) Start the HTTP server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

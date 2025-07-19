// // server/index.js
// require('dotenv').config();
// const path     = require('path');
// const express  = require('express');
// const mongoose = require('mongoose');
// const cors     = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // —— PRE‑LOAD MODELS ——————————————————————
// require('./models/Login');
// require('./models/Resident');
// require('./models/DailyConsumption');
// require('./models/Threshold');    // ← Threshold.js contains your thresholdSchema
// // ————————————————————————————————————————

// const authRoutesPath = path.join(__dirname, 'routes', 'auth.js');
// const authRoutes     = require(authRoutesPath);
// const dashRoutes     = require('./routes/dashboard');

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(conn => {
//     console.log('✔️  Connected to MongoDB DB:', conn.connection.db.databaseName);

//     // At this point Mongoose.collections includes all loaded models:
//     console.log(
//       '✔️  Collections loaded by Mongoose:',
//       Object.keys(conn.connection.collections)
//     );

//     // —— ROUTES ———————————————————————————————
//     app.use('/api/auth', authRoutes);
//     app.use('/api/dashboard', dashRoutes);
//     // ————————————————————————————————————————

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`🚀  Server is running on port ${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error('❌  MongoDB connection error:', err);
//     process.exit(1);
//   });
// server/index.js
require('dotenv').config();
const path      = require('path');
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// —— PRE‑LOAD MODELS ——
require('./models/Login');
require('./models/Resident');
require('./models/DailyConsumption');


const authRoutesPath = path.join(__dirname, 'routes', 'auth.js');
const authRoutes     = require(authRoutesPath);
const dashRoutes     = require('./routes/dashboard');
const adminDashRoutes = require('./routes/admindashboard'); // NEW: Import the admin dashboard routes

mongoose
  .connect(process.env.MONGO_URI)
  .then(conn => {
    console.log('✔️  Connected to MongoDB DB:', conn.connection.db.databaseName);

    // At this point Mongoose.collections includes all loaded models:
    console.log('✔️  Collections loaded by Mongoose:', Object.keys(conn.connection.collections));

    // —— ROUTES ——
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashRoutes);
    app.use('/api/admin', adminDashRoutes); // NEW: Use the admin dashboard routes

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀  Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1);
  });
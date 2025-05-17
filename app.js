const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('partials', path.join(__dirname, 'views/partials'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./components/admin/routes/adminRoutes'));
app.use('/admin', require('./components/admin/routes/adminRoutes'));
app.use('/engineer', require('./components/engineer/routes/engineerRoutes'));
app.use('/client', require('./components/client/routes/clientRoutes'));

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// 404 handler for all other routes
app.use((req, res) => {
  // Check if the request is for an API endpoint
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  // For all other routes, render the 404 page
  res.status(404).render('partials/404', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Check if the request is for an API endpoint
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  // For all other routes, render the 500 page
  res.status(500).render('500', {
    title: '500 - Server Error',
    message: 'Something went wrong on our end.'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codekarwalo')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const env = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(session({
    secret: env.SESSION_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
} else {
  app.use(passport.initialize());
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

module.exports = app;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const {sequelize} = require('./config/database');
require('dotenv').config();


const authRoutes = require('.//routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 , // 1 day
      httpOnly: true
    }
      }));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(async (id, done) => {
    try {
      const User = require('./models/User');
      const user = await User.findByPk(id);
      done(null, user);
    }
    catch (e) {
      done(e, null);
    }
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ states: false, error: 'Something went wrong!' });
})


module.exports = app;
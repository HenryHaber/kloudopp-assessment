const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User  = require('../models/User');
const env = require('./env');


passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID || 'dummy-id',
  clientSecret: env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
  callbackURL: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;
    const profilePicture = profile.photos?.[0]?.value;

    let user = await User.findOne({ where: { googleId } });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    user = await User.findOne({ where: { email } });
    if (user && user.authProvider === 'local') {
      user.googleId = googleId;
      user.authProvider = 'google';
      user.isEmailVerified = true;
      user.profilePicture = profilePicture;
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    const userType = request.session?.userType || 'freelancer';
    const newUser = await User.create({
      email,
      googleId,
      authProvider: 'google',
      firstName,
      lastName,
      profilePicture,
      isEmailVerified: true,
      userType,
      lastLogin: new Date()
    });
    return done(null, newUser);
  } catch (e) {
    return done(e, null);
  }
}));

const jwtSecret = env.JWT_ACCESS_SECRET || env.JWT_SECRET;
if (jwtSecret) {
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret
  };
  passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await User.findByPk(jwtPayload.id);
      if (!user || !user.isActive) {
        return done(null, false);
      }
      return done(null, user);
    } catch (e) {
      return done(e, false);
    }
  }));
}

module.exports = passport;
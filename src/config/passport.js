const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User  = require('../models/User');
require('dotenv').config();


passport.use( new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    passRequestToCallback: true
     },
     async (request, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const profilePicture = profile.photos[0].value;

        let user = await User.findOne({ where: { googleId } });

        if (user){
          user.lastLogin = new Date();
          await user.save();
          return done (null, user);
        }

        user = await User.findOne({ where: { email } });

        if (user && user.authProvider === 'local'){
          user.googleId = googleId,
          user.authProvider = 'google',
          user.isEmailVerified = true,
          user.profilePicture = profilePicture,
          user.lastLogin = new Date();

          await  user.save();
          return  done(null, user);

        }

        const userType = req.session?.userType || 'freelancer';

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

        return done (null, newUser);
      }
       catch (e) {
         return done (e, null);
       }
 }))

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}

passport.use( new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await User.findByPk(jwtPayload.id);
      if (!user || user.isActive){
        return done (null, false);
      }

      return  done(null, user);
    }
    catch (e) {
      return done (e, false);
    }
}));


module.exports = passport;
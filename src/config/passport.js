import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // 1. Check if user logged in with Google before
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }
        // 2. Account Linking: Check if email exists from a normal signup
        user = await User.findOne({ email });
        if (user) {
          // Link the Google account to the existing email
          user.googleId = profile.id;
          // If they weren't verified via email yet, Google verifies them implicitly!
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }
        // 3. Create a brand new user
        user = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          isVerified: true,
          avatar: profile.photos[0]?.value || "",
        });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

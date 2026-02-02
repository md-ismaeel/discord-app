import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { UserModel } from "../models/user.model.js";
import { getEnv } from "../config/env.config.js";

// passport.serializeUser((user, done) => done(null, user.id));

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await UserModel.findById(id);
//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// });

// // Helper function to handle OAuth callbacks
// const handleOAuthCallback = async (profile, provider, done) => {
//     try {
//         const email = profile.emails?.[0]?.value;

//         if (!email) {
//             return done(new Error("No email found in profile"), null);
//         }

//         let user = await UserModel.findOne({ email });

//         if (!user) {
//             user = await UserModel.create({
//                 name: profile.displayName || profile.username,
//                 email,
//                 provider,
//                 providerId: profile.id,
//                 avatar: profile.photos?.[0]?.value || null,
//             });
//         }

//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// };

// // Google Strategy
// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: getEnv("GOOGLE_CLIENT_ID"),
//             clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
//             callbackURL: "/api/auth/google/callback",
//         },
//         (_, __, profile, done) => handleOAuthCallback(profile, "google", done)
//     )
// );

// // GitHub Strategy
// passport.use(
//     new GitHubStrategy(
//         {
//             clientID: getEnv("GITHUB_CLIENT_ID"),
//             clientSecret: getEnv("GITHUB_CLIENT_SECRET"),
//             callbackURL: "/api/auth/github/callback",
//             scope: ["user:email"],
//         },
//         (_, __, profile, done) => handleOAuthCallback(profile, "github", done)
//     )
// );

// // Facebook Strategy
// passport.use(
//     new FacebookStrategy(
//         {
//             clientID: getEnv("FACEBOOK_APP_ID"),
//             clientSecret: getEnv("FACEBOOK_APP_SECRET"),
//             callbackURL: "/api/auth/facebook/callback",
//             profileFields: ["id", "displayName", "emails", "photos"],
//         },
//         (_, __, profile, done) => handleOAuthCallback(profile, "facebook", done)
//     )
// );



passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Helper function to handle OAuth callbacks
const handleOAuthCallback = async (profile, provider, done) => {
    try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
            return done(new Error("No email found in profile"), null);
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: profile.displayName || profile.username,
                email,
                provider,
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value || null,
            });
        }

        done(null, user);
    } catch (err) {
        done(err, null);
    }
};

// Google Strategy
const googleClientId = getEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = getEnv("GOOGLE_CLIENT_SECRET");

if (googleClientId && googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: "/api/auth/google/callback",
            },
            (_, __, profile, done) => handleOAuthCallback(profile, "google", done)
        )
    );
    console.log("Google OAuth configured");
} else {
    console.log("Google OAuth not configured (missing credentials)");
}

// GitHub Strategy
const githubClientId = getEnv("GITHUB_CLIENT_ID");
const githubClientSecret = getEnv("GITHUB_CLIENT_SECRET");

if (githubClientId && githubClientSecret) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: githubClientId,
                clientSecret: githubClientSecret,
                callbackURL: "/api/auth/github/callback",
                scope: ["user:email"],
            },
            (_, __, profile, done) => handleOAuthCallback(profile, "github", done)
        )
    );
    console.log("GitHub OAuth configured");
} else {
    console.log("GitHub OAuth not configured (missing credentials)");
}

// Facebook Strategy
const facebookAppId = getEnv("FACEBOOK_APP_ID");
const facebookAppSecret = getEnv("FACEBOOK_APP_SECRET");

if (facebookAppId && facebookAppSecret) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: facebookAppId,
                clientSecret: facebookAppSecret,
                callbackURL: "/api/auth/facebook/callback",
                profileFields: ["id", "displayName", "emails", "photos"],
            },
            (_, __, profile, done) => handleOAuthCallback(profile, "facebook", done)
        )
    );
    console.log("Facebook OAuth configured");
} else {
    console.log("Facebook OAuth not configured (missing credentials)");
}
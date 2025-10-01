import dotenv from 'dotenv';

// Load environment variables first thing
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env' });
} else {
    dotenv.config({ path: '.env_local' });
}

// Export some common environment values for easy access
export const frontendUrl = process.env.FRONTEND_URL;
export const backendUrl = process.env.BACKEND_URL;
export const jwtSecret = process.env.JWT_SECRET;
export const sessionCookieDomain = process.env.SESSION_COOKIE_DOMAIN;
export const jwtIssuer = process.env.JWT_ISSUER;
export const jwtAudience = process.env.JWT_AUDIENCE;

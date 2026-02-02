import { config } from 'dotenv';

config();

const requiredEnvVars = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'REDIS_URL',
    'JWT_SECRET',
];

const optionalEnvVars = {
    PORT: '5000',
    CLIENT_URL: 'http://localhost:5173',
    NODE_ENV: 'development',
    JWT_EXPIRE: '7d',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    FACEBOOK_APP_ID: '',
    FACEBOOK_APP_SECRET: '',
};

export const validateEnv = () => {
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
};

export const getEnv = (key, fallback = null) => {
    return process.env[key] || optionalEnvVars[key] || fallback;
};

export const isProduction = () => getEnv('NODE_ENV') === 'production';
export const isDevelopment = () => getEnv('NODE_ENV') === 'development';
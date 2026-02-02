import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.config.js";

const JWT_SECRET_KEY = getEnv("JWT_SECRET");
const JWT_EXPIRE_KEY = getEnv("JWT_EXPIRE");

export const generateToken = (userId) => {

    return jwt.sign({ id: userId }, JWT_SECRET_KEY,
        { expiresIn: JWT_EXPIRE_KEY }
    );
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET_KEY);
    } catch (error) {
        return null;
    }
};
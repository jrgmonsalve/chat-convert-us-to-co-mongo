import dotenv from "dotenv";
dotenv.config();

export const SERVER_PORT = process.env.SERVER_PORT || 4001;
export const CLIENT_PORT = process.env.CLIENT_PORT || 4000;
export const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY;
export const CURRENCY_API_URL = process.env.CURRENCY_API_URL;
export const MONGO_STR_CONNECTION = process.env.MONGO_STR_CONNECTION;
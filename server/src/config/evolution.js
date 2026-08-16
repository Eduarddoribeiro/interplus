import axios from "axios";

export const evolution = axios.create({
  baseURL: process.env.EVOLUTION_URL,
  headers: {
    apikey: process.env.EVOLUTION_API_KEY,
    "Content-Type": "application/json",
  },
});
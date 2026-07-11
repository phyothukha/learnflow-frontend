import axios from "axios";

/**
 * Server-side axios instance for the API gateway pattern.
 * Only used inside Next.js API routes — the backend URL and
 * credentials are never exposed to the browser.
 */
export const serverAxios = axios.create({
  baseURL: process.env.BACKEND_URL ?? "http://localhost:5068",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Client-side axios instance — always talks to our own
 * Next.js API routes, never to the backend directly.
 */
export const clientAxios = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

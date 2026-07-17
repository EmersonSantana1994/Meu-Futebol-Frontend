import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api"
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("keyToken");
    if (token) {
      config.headers["x-access-token"] = token.replaceAll('"', "");
    }
  }

  return config;
});

import axios from "axios";
import { API_ROOT } from "../constants";

const api = axios.create({
  baseURL: API_ROOT,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Or sessionStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

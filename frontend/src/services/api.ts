import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.BACKEND_API_URL || "http://localhost:4000",
});

export default API;

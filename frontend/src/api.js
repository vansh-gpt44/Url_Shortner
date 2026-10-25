import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retried &&
      !original.url?.includes("/auth/")
    ) {
      original._retried = true;
      try {
        await api.post("/auth/refresh");
        return api(original);
      } catch {
        /* caller handles auth */
      }
    }
    return Promise.reject(error);
  },
);

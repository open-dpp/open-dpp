import axios from "axios";
import { API_URL } from "../const";
import { logout } from "./keycloak";

const axiosIns = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosIns.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // const authStore = useAuthStore();
    if (
      error.response
      && error.response.status === 401
      && error.message === "Unauthorized"
    ) {
      logout();
    }
    return Promise.reject(new Error(error));
  },
);

export function setAxiosAuthHeader(token: string) {
  axiosIns.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default axiosIns;

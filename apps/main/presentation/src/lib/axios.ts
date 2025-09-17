import axios from "axios";
import { logout } from "./keycloak";
import { API_URL } from "../const";

const axiosIns = axios.create({
  baseURL: API_URL,
});

axiosIns.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // const authStore = useAuthStore();
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  },
);

export const setAxiosAuthHeader = (token: string) => {
  axiosIns.defaults.headers.common.Authorization = "Bearer " + token;
};

export default axiosIns;

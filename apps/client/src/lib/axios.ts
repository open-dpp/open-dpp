import axios from "axios";
import { API_URL } from "../const";

const axiosIns = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export function setAxiosAuthHeader(token: string) {
  axiosIns.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function setAxiosOrganizationId(organizationId: string) {
  axiosIns.defaults.headers.common["X-OPEN-DPP-ORGANIZATION-ID"] = organizationId;
}

export default axiosIns;

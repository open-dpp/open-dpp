import axios from "axios";
import { API_URL } from "../const";

const axiosIns = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export function setAxiosAuthHeader(token: string) {
  axiosIns.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function setAxiosOrganizationId(organizationId?: string | null) {
  if (organizationId) {
    axiosIns.defaults.headers.common["X-OPEN-DPP-ORGANIZATION-ID"]
      = organizationId;
  }
  else {
    delete axiosIns.defaults.headers.common["X-OPEN-DPP-ORGANIZATION-ID"];
  }
}

export default axiosIns;

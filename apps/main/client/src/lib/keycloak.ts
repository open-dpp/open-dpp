import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { setAxiosAuthHeader } from './axios';
import { API_URL, KEYCLOAK_URL } from '../const';
import apiClient from './api-client';
import { useProfileStore } from '../stores/profile';

export const keycloakIns = new Keycloak({
  url: KEYCLOAK_URL,
  realm: 'open-dpp',
  clientId: 'frontend',
});

const initOptions: KeycloakInitOptions = {
  scope: 'openid profile',
  pkceMethod: 'S256',
  checkLoginIframe: false,
};

// use the access token from cypress if it exists
if (window.localStorage.getItem('access_token')) {
  initOptions.token = window.localStorage.getItem('access_token') || undefined;
}

// use the refresh token from cypress if it exists
if (window.localStorage.getItem('refresh_token')) {
  initOptions.refreshToken =
    window.localStorage.getItem('refresh_token') || undefined;
}

export const initializeKeycloak = async (keycloak: Keycloak) => {
  await keycloak.init(initOptions);
  if (keycloak.authenticated && keycloak.token && keycloak.tokenParsed) {
    setAxiosAuthHeader(keycloak.token);
    apiClient.setApiKey(keycloak.token);
    const profileStore = useProfileStore();
    profileStore.setProfile({
      name: keycloak.tokenParsed.name || '',
      email: keycloak.tokenParsed.email || '',
      firstName: keycloak.tokenParsed.given_name || '',
      lastName: keycloak.tokenParsed.family_name || '',
    });
  }

  setInterval(() => updateKeycloakToken(keycloak, 70), 60000);
  return keycloak;
};

export const updateKeycloakToken = async (
  keycloak: Keycloak,
  minValidity: number,
) => {
  const isRefreshed = await keycloak.updateToken(minValidity);
  if (isRefreshed && keycloak.token) {
    setAxiosAuthHeader(keycloak.token);
    apiClient.setApiKey(keycloak.token);
  }
};

export const logout = async () => {
  // const authStore = useAuthStore();
  // authStore.logout();
  await keycloakIns.logout({ redirectUri: window.location.origin });
};

export const generateRegistrationLink = (token: string) => {
  return API_URL + '/register/' + token;
};

export default keycloakIns;

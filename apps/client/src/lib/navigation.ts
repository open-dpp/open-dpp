/** Full-page navigation, for targets outside the SPA such as the Trusted Client's redirect URI. */
export function navigateTo(url: string): void {
  window.location.assign(url);
}

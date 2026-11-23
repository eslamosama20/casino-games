import { Platform } from 'react-native';

// On web, if accessed via LAN IP (e.g. http://192.168.1.5:8081), automatically target the same host on port 5000
function getDefaultBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || /^192\.168\.|^10\.|^172\./.test(host)) {
      return `http://${host}:5000`;
    }
  }
  return 'http://localhost:5000';
}

export const config = {
  API_BASE_URL: getDefaultBaseUrl(),
  SOCKET_URL: getDefaultBaseUrl(),
  API_TIMEOUT_MS: 5000,
};

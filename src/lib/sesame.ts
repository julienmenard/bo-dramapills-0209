import { SesameAuth } from '@julienmertens/sesame-auth-bolt';

// Initialize Sesame Auth configuration
const sesameConfig = {
  clientId: import.meta.env.VITE_SESAME_CLIENT_ID || 'dramapills-backoffice',
  redirectUri: import.meta.env.VITE_SESAME_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  scopes: ['openid', 'profile', 'email'],
  // Add other configuration options as needed
};

export const sesameAuth = new SesameAuth(sesameConfig);

export default sesameAuth;
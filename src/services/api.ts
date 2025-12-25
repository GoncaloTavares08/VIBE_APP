// 1. Lógica para detetar o cliente
const getClientId = () => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  // Only return club ID if it exists in URL, otherwise null
  return pathSegments[0] || null;
};

// 2. Função personalizada de fetch com error handling
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseURL = 'https://vibe.infinityfree.me/api';

  const clientId = getClientId();

  // Prepara os headers
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (clientId) {
    headers['X-Client-ID'] = clientId;

    // Append client ID to URL to prevent browser caching of different club data for the same endpoint
    // This ensures /vr/events and /eskada/events are treated as different resources
    const separator = endpoint.includes('?') ? '&' : '?';
    endpoint = `${endpoint}${separator}__cid=${clientId}`;
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers
    });

    // Get response as text first
    const text = await response.text();

    // Check if response is empty
    if (!text) {
      throw new Error('Empty response from server');
    }

    // Try to parse JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', text.substring(0, 200)); // Log first 200 chars
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};
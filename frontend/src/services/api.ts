// 1. Lógica para detetar o cliente
const getClientId = () => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  // Only return club ID if it exists in URL, otherwise null
  return pathSegments[0] || null;
};

// 2. Função personalizada de fetch com error handling
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseURL = import.meta.env.VITE_API_URL;

  const clientId = getClientId();

  // Prepara os headers
  const headers: any = {
    ...(options.headers || {}),
  };

  // Only set application/json if we are not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure cookies are sent with requests
  if (!options.credentials) {
    options.credentials = 'include';
  }

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
  } catch (error: any) {
    console.error('API Fetch Error:', error);
    
    // Check if it's a network error (e.g. offline)
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      window.dispatchEvent(new CustomEvent('networkError', { detail: { message: 'Sem ligação à internet. Verifica a tua rede.' } }));
    }
    
    throw error;
  }
};
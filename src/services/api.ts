// 1. Lógica para detetar o cliente
const getClientId = () => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  return pathSegments[0] || 'vr'; // default to 'vr' instead of 'default'
};

// 2. Função personalizada de fetch com error handling
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseURL = 'https://vibe.infinityfree.me/api';
  
  // Prepara os headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': getClientId(),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers,
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
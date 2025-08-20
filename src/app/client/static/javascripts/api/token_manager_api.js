// Token Manager with sessionStorage persistence
const TOKEN_KEY = 'auth_tokens';

export function setTokens(data) {
  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry: Date.now() + (15 * 60 * 1000) // 15 mins expiry
  };
  
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function getAccessToken() {
  const tokenData = sessionStorage.getItem(TOKEN_KEY);
  if (!tokenData) return null;

  try {
    const { access_token, expiry } = JSON.parse(tokenData);
    return (access_token && Date.now() < expiry) ? access_token : null;
  } catch {
    return null;
  }
}

function getRefreshToken() {
  const tokenData = sessionStorage.getItem(TOKEN_KEY);
  if (!tokenData) return null;

  try {
    const { refresh_token } = JSON.parse(tokenData);
    return refresh_token;
  } catch {
    return null;
  }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error("No refresh token available");
    auto_logout();
    return null;
  }

  try {
    const response = await fetch('http://localhost:8000/api/user/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.ok) throw new Error('Refresh failed');
    
    const data = await response.json();
    if (!data.access_token) throw new Error('No access token in response');

    // Update only the access token (keep same refresh token)
    const tokenData = JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    setTokens({
      access_token: data.access_token,
      refresh_token: tokenData.refresh_token
    });

    return data.access_token;

  } catch (error) {
    console.error('Refresh failed:', error);
    auto_logout();
    return null;
  }
}

export function auto_logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.href = "sign_up_sign_in_page.html";
}

export async function secureFetch(url, options = {}) {
  // Check token expiry and refresh if needed
  const tokenData = sessionStorage.getItem(TOKEN_KEY);
  if (tokenData) {
    const { expiry } = JSON.parse(tokenData);
    if (expiry && Date.now() > expiry - 120000) {
      console.log("THE TOKEN IS LESS THAN 2MINS. REQUESTING FOR NEW TOKEN USING REFRESH TOKEN")

      await refreshAccessToken();
    }
  }

  // Attach current access token
  const token = getAccessToken();
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  let response = await fetch(url, options);

  // Retry once if token expired
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      options.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, options);
    }
  }

  return response;
}
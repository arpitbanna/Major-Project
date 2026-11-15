/**
 * Safe API request utility for CoalSafe frontend
 * Safely handles JSON responses, empty bodies, non-JSON error pages, and network failures.
 */
export async function apiRequest(url, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = {
    Accept: 'application/json',
    ...(fetchOptions.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure Content-Type is set for requests with a payload
  if (fetchOptions.body && !headers['Content-Type'] && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers
    });
  } catch (netErr) {
    throw new Error(`Unable to connect to server (${netErr.message}). Ensure backend is running.`);
  }

  // Safely read response text without crashing on empty body or invalid JSON
  let text = '';
  try {
    text = await response.text();
  } catch (readErr) {
    text = '';
  }

  let parsed = null;
  if (text && text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      // Non-JSON response (e.g. HTML proxy error or plain text)
      parsed = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      parsed?.message ||
      parsed?.error ||
      (response.status === 403
        ? 'Access forbidden. Please verify your role permissions or backend server.'
        : response.status === 401
        ? 'Session expired or invalid. Please sign in again.'
        : response.status === 404
        ? 'Requested record or endpoint was not found.'
        : response.status >= 500
        ? `Server error (${response.status}). Please check backend service logs.`
        : `Request failed with status ${response.status}`);

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = parsed;
    throw error;
  }

  return parsed || {};
}

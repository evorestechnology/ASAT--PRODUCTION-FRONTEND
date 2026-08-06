import { supabase } from './supabase';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();

export async function apiFetch(path, options = {}) {
  // 1. Get current access token from active Supabase session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch (_) {}

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  // For FormData uploads, let browser set the boundary and content-type automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // 2. If response is 401 (token expired/invalid), attempt automatic token refresh & retry request once
  if (res.status === 401 && !options._isRetry) {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      const freshToken = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
      if (freshToken) {
        authToken = freshToken;
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${freshToken}`,
        };
        res = await fetch(`${API_URL}${path}`, {
          ...options,
          _isRetry: true,
          headers: retryHeaders,
        });
      }
    } catch (refreshErr) {
      console.warn('Session auto-refresh on 401 failed:', refreshErr);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'An unknown error occurred.' }));
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Upload a file to Supabase Storage via our backend API.
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within bucket
 * @param {File} file - The File object to upload
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadFile(file, path, bucket = "asat-uploads") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  formData.append("bucket", bucket);

  const data = await apiFetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  return data.publicUrl;
}


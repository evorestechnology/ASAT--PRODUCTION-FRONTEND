import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Supabase client for auth token retrieval (same as AuthContext uses)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

let authToken = null;

/**
 * Set auth token manually (used by AuthContext)
 * @param {string|null} token
 */
export function setAuthToken(token) {
  authToken = token;
}

/**
 * Get the current auth token (prefers token set by AuthContext, falls back to Supabase session)
 */
async function getAuthToken() {
  if (authToken) return authToken;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Core API fetch wrapper
 * - Adds Authorization header from Supabase session
 * - Handles JSON parsing and errors
 * - Returns typed response data
 *
 * @param {string} path - API path (e.g., '/designs/mine')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiFetch(path, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    // Sign out and redirect to login
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  // Parse response
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Handle API errors (non-2xx responses)
  if (!response.ok) {
    // Backend returns { success: false, message, errors, statusCode }
    const message = data?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    error.errors = data?.errors;
    throw error;
  }

  // Return data directly (backend wraps in { success: true, data, message })
  return data?.data ?? data;
}

/**
 * Upload file to Supabase storage via backend
 * Uses multipart/form-data
 *
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'designs/user-id/filename.png')
 * @param {string} bucket - Storage bucket name (default: 'asat-uploads')
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
export async function uploadFile(file, path, bucket = 'asat-uploads') {
  const token = await getAuthToken();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('bucket', bucket);

  const response = await fetch(`${API_BASE_URL}/storage/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Don't set Content-Type for FormData - browser sets it with boundary
    },
    body: formData,
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.message || 'Upload failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data?.data ?? data;
}

/**
 * Upload multiple files
 * @param {File[]} files - Files to upload
 * @param {string} basePath - Base path for uploads
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Array<{ path: string, publicUrl: string }>>}
 */
export async function uploadFiles(files, basePath, bucket = 'asat-uploads') {
  const uploads = files.map((file, index) => {
    const ext = file.name.split('.').pop();
    const path = `${basePath}/${Date.now()}-${index}.${ext}`;
    return uploadFile(file, path, bucket);
  });
  return Promise.all(uploads);
}

/**
 * Helper for GET requests
 */
export function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: 'GET' });
}

/**
 * Helper for POST requests
 */
export function apiPost(path, body, options = {}) {
  return apiFetch(path, { ...options, method: 'POST', body: JSON.stringify(body) });
}

/**
 * Helper for PUT requests
 */
export function apiPut(path, body, options = {}) {
  return apiFetch(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete(path, options = {}) {
  return apiFetch(path, { ...options, method: 'DELETE' });
}
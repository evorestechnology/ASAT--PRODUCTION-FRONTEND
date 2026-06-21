let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  // For FormData uploads, let browser set the boundary and content-type automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

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
export async function uploadFile(bucket, path, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('bucket', bucket);

  const data = await apiFetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });

  return data.publicUrl;
}

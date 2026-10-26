// Frontend Talks to the Backend and database. All calls to the FastAPI backend live here.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper functions to manage the auth token in localStorage
export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

async function request(path, options = {}) {
  const token = getToken();

  // Merge headers and attach Authorization Bearer token if logged in
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ");
      }
    } catch {
      /* body was not JSON, keep the generic message */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

// Auth API Calls
export const loginUser = (credentials) =>
  request("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

// Post API Calls (Backend automatically extracts user ID from token)
export const listPosts = () => request("/posts");
export const createPost = (form) => request("/posts", { method: "POST", body: form });
export const updatePost = (id, form) => request(`/posts/${id}`, { method: "PUT", body: form });
export const deletePost = (id) => request(`/posts/${id}`, { method: "DELETE" });

// Vocabulary API Call
export const getWord = (letter) => request(`/vocabulary?letter=${letter}`);
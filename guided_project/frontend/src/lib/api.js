// Frontend Talks to the Backend and database. All calls to the FastAPI backend live here.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// No login yet: every story belongs to this author (matches the backend default).
export const AUTHOR_ID = "ada";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
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

// FormData bodies: the browser sets the multipart Content-Type itself.
export const listPosts = () => request(`/posts?author_id=${AUTHOR_ID}`);
export const createPost = (form) => request("/posts", { method: "POST", body: form });
export const updatePost = (id, form) => request(`/posts/${id}`, { method: "PUT", body: form });
export const deletePost = (id) => request(`/posts/${id}`, { method: "DELETE" });
export const getWord = (letter) => request(`/vocabulary?letter=${letter}&author_id=${AUTHOR_ID}`);

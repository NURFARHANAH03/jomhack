const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Core fetch helper
export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = "API request failed";
    
    if (typeof errorData.detail === "string") {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((err) => err.msg || err.message).join(", ");
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// Token & Auth Storage Helpers
export const setToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");

export function setGuestMode() {
  localStorage.setItem("guest_mode", "true");
}

export function isGuestMode() {
  return localStorage.getItem("guest_mode") === "true";
}

export function clearAuth() {
  localStorage.clear();
  sessionStorage.clear();
}

// Authentication API
export const loginUser = async (credentials) => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  const response = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = "Login failed";
    if (typeof errorData.detail === "string") {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      msg = errorData.detail.map((e) => e.msg).join(", ");
    } else if (errorData.message) {
      msg = errorData.message;
    }
    throw new Error(msg);
  }

  return response.json();
};

export const signupUser = (credentials) =>
  request("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

export const getMe = () => request("/me");

// Guest Posts Local Storage Helpers
function getGuestPosts() {
  const data = localStorage.getItem("guest_posts");
  return data ? JSON.parse(data) : [];
}

function saveGuestPosts(posts) {
  localStorage.setItem("guest_posts", JSON.stringify(posts));
}

// Posts CRUD
export async function listPosts() {
  if (isGuestMode()) {
    return getGuestPosts();
  }
  return request("/posts");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

// Guests: small photos only, stored inside the story itself
async function getGuestImage(formData) {
  const file = formData.get("image");
  if (!(file instanceof File) || !file.size) return undefined;
  if (!file.type.startsWith("image/")) {
    throw new Error("Guests can only attach photos. Log in to upload videos.");
  }
  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error("Guest photos must be under 1.5 MB. Log in for larger files.");
  }
  return fileToDataUrl(file);
}

export async function createPost(formData) {
    if (isGuestMode()) {
    const posts = getGuestPosts();
    const image = await getGuestImage(formData);
    const newPost = {
      id: "guest_" + Date.now(),
      title: formData.get("title"),
      body: formData.get("body"),
      mood: formData.get("mood") || null,
      image: image ?? null,
      created_at: new Date().toISOString(),
      author_id: "guest",
    };
    posts.unshift(newPost);
    try {
      saveGuestPosts(posts);
    } catch {
      throw new Error("Guest storage is full. Delete a story or log in.");
    }
    return newPost;
  }
  return request("/posts", {
    method: "POST",
    body: formData,
  });
}

export async function updatePost(id, formData) {
    if (isGuestMode()) {
    const posts = getGuestPosts();
    const index = posts.findIndex((p) => p.id === id);
    if (index !== -1) {
      const newImage = await getGuestImage(formData);
      const removed = formData.get("remove_image") === "true";
      posts[index] = {
        ...posts[index],
        title: formData.get("title"),
        body: formData.get("body"),
        mood: formData.get("mood") || null,
        image: removed ? null : newImage ?? posts[index].image ?? null,
        updated_at: new Date().toISOString(),
      };
      try {
        saveGuestPosts(posts);
      } catch {
        throw new Error("Guest storage is full. Delete a story or log in.");
      }
      return posts[index];
    }
    return null;
  }
  return request(`/posts/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deletePost(id) {
  if (isGuestMode()) {
    const posts = getGuestPosts().filter((p) => p.id !== id);
    saveGuestPosts(posts);
    return;
  }
  return request(`/posts/${id}`, {
    method: "DELETE",
  });
}

// Vocabulary API:
// Signed-in users fetch AI words via backend.
// Guest users utilize local fallback generator.
export async function getWord(letter) {
  const targetLetter = (letter || "S").trim().toUpperCase();
  if (!/^[A-Z]$/.test(targetLetter)) {
    throw new Error("Pick a letter from A to Z.");
  }

  if (isGuestMode()) {
    return getGuestWordFallback(targetLetter);
  }
  return request(`/vocabulary?letter=${targetLetter}`);
}

function getGuestWordFallback(targetLetter) {
  const fallbacks = {
    A: [
      { word: "Amiable", part_of_speech: "adjective", definition: "Having or displaying a friendly and pleasant manner.", example: "She welcomed the guests with an amiable smile." },
      { word: "Astral", part_of_speech: "adjective", definition: "Relating to or resembling the stars.", example: "The clear night sky felt almost astral." }
    ],
    B: [
      { word: "Benevolent", part_of_speech: "adjective", definition: "Well meaning and kindly.", example: "A benevolent smile lit up his face." },
      { word: "Blissful", part_of_speech: "adjective", definition: "Extremely happy; full of joy.", example: "Morning reflection led to a blissful start." }
    ],
    C: [
      { word: "Clarity", part_of_speech: "noun", definition: "The quality of being clear, coherent, and intelligible.", example: "Journaling brought clarity to her thoughts." }
    ],
    D: [
      { word: "Delight", part_of_speech: "noun", definition: "Great pleasure or satisfaction.", example: "Reading old memories brought immense delight." }
    ],
    E: [
      { word: "Ephemeral", part_of_speech: "adjective", definition: "Lasting for a very short time.", example: "The morning mist was beautiful but ephemeral." }
    ],
    F: [
      { word: "Flourish", part_of_speech: "verb", definition: "Grow or develop in a healthy or vigorous way.", example: "With daily reflection, peace begins to flourish." }
    ],
    G: [
      { word: "Gratitude", part_of_speech: "noun", definition: "The quality of being thankful.", example: "She wrote three things she felt gratitude for." }
    ],
    H: [
      { word: "Harmony", part_of_speech: "noun", definition: "A pleasing arrangement or agreement of parts.", example: "Mindfulness brings harmony to daily routines." }
    ],
    I: [
      { word: "Insight", part_of_speech: "noun", definition: "The capacity to gain deep intuitive understanding.", example: "The prompt offered a new insight into her goals." }
    ],
    J: [
      { word: "Jubilant", part_of_speech: "adjective", definition: "Feeling or expressing great happiness and triumph.", example: "The team was jubilant after completing the project." }
    ],
    K: [
      { word: "Kindred", part_of_speech: "adjective", definition: "Similar in kind; related.", example: "They found kindred spirits in the book club." }
    ],
    L: [
      { word: "Luminous", part_of_speech: "adjective", definition: "Full of or shedding light; bright or shining.", example: "The evening light gave the room a luminous glow." }
    ],
    M: [
      { word: "Mindful", part_of_speech: "adjective", definition: "Consciously aware and present in the moment.", example: "Taking a mindful pause helps calm a busy day." }
    ],
    N: [
      { word: "Nurture", part_of_speech: "verb", definition: "Care for and encourage the growth of.", example: "Journaling is a peaceful way to nurture creativity." }
    ],
    O: [
      { word: "Optimistic", part_of_speech: "adjective", definition: "Hopeful about the future.", example: "He felt optimistic about the upcoming projects." }
    ],
    P: [
      { word: "Perseverance", part_of_speech: "noun", definition: "Persistence in doing something despite difficulty.", example: "Her perseverance paid off in the end." }
    ],
    Q: [
      { word: "Quaint", part_of_speech: "adjective", definition: "Attractively unusual or old-fashioned.", example: "They stayed in a quaint little village." }
    ],
    R: [
      { word: "Resilience", part_of_speech: "noun", definition: "The capacity to recover quickly from difficulties.", example: "Writing helps build emotional resilience." }
    ],
    S: [
      { word: "Serendipity", part_of_speech: "noun", definition: "Finding valuable or agreeable things not sought for.", example: "Writing brought a sense of serendipity to her evening." }
    ],
    T: [
      { word: "Tranquility", part_of_speech: "noun", definition: "The quality or state of being tranquil; calm.", example: "A quiet morning brings pure tranquility." }
    ],
    U: [
      { word: "Uplift", part_of_speech: "verb", definition: "Elevate or inspire mentally or emotionally.", example: "Positive thoughts uplift the mind." }
    ],
    V: [
      { word: "Vibrant", part_of_speech: "adjective", definition: "Full of energy and enthusiasm.", example: "The journal entry was full of vibrant details." }
    ],
    W: [
      { word: "Wisdom", part_of_speech: "noun", definition: "The quality of having experience, knowledge, and good judgment.", example: "Reflection is the path to personal wisdom." }
    ],
    X: [
      { word: "Xenial", part_of_speech: "adjective", definition: "Hospitable, warm, and welcoming to strangers.", example: "Her xenial nature made everyone feel at home." }
    ],
    Y: [
      { word: "Yearning", part_of_speech: "noun", definition: "A feeling of intense longing for something.", example: "A gentle yearning for peace filled the room." }
    ],
    Z: [
      { word: "Zenith", part_of_speech: "noun", definition: "The time at which something is most powerful or successful.", example: "Reaching the mountain peak was the zenith of the trip." }
    ]
  };

  const wordList = fallbacks[targetLetter] || fallbacks["S"];
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return { ...wordList[randomIndex], letter: targetLetter };
}
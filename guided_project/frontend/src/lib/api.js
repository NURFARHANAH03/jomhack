const API_BASE = "http://localhost:8000";

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
    const error = new Error(errorData.detail || "API request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// Token & Guest Storage Helpers
export const setToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");

export function setGuestMode() {
  localStorage.setItem("guest_mode", "true");
}

export function isGuestMode() {
  return localStorage.getItem("guest_mode") === "true";
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("guest_mode");
}

// Authentication API

export const loginUser = async (credentials) => {
  // OAuth2 expects form-urlencoded parameters (username & password)
  const formData = new URLSearchParams();
  formData.append("username", credentials.email); // OAuth2 standard uses "username"
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
    throw new Error(errorData.detail || "Login failed");
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

export async function createPost(formData) {
  if (isGuestMode()) {
    const posts = getGuestPosts();
    const newPost = {
      id: "guest_" + Date.now(),
      title: formData.get("title"),
      body: formData.get("body"),
      mood: formData.get("mood") || null,
      created_at: new Date().toISOString(),
      author_id: "guest",
    };
    posts.unshift(newPost);
    saveGuestPosts(posts);
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
      posts[index] = {
        ...posts[index],
        title: formData.get("title"),
        body: formData.get("body"),
        mood: formData.get("mood") || null,
        updated_at: new Date().toISOString(),
      };
      saveGuestPosts(posts);
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

// Vocabulary API with A-Z multi-word arrays for Guest Mode
export async function getWord(letter) {
  const targetLetter = (letter).toUpperCase();
  const query = letter ? `?letter=${targetLetter}` : "";
  
  try {
    return await request(`/vocabulary${query}`);
  } catch (err) {
    console.warn("Backend/Gemini offline or high demand, using dynamic guest fallback:", err);
    
    const fallbacks = {
      A: [
        { word: "Amiable", definition: "Having or displaying a friendly and pleasant manner.", example: "She welcomed the guests with an amiable smile." },
        { word: "Astral", definition: "Relating to or resembling the stars.", example: "The clear night sky felt almost astral." },
        { word: "Affection", definition: "A gentle feeling of liking or fondness.", example: "Writing down memories filled her with affection." }
      ],
      B: [
        { word: "Benevolent", definition: "Well meaning and kindly.", example: "A benevolent smile lit up his face." },
        { word: "Blissful", definition: "Extremely happy; full of joy.", example: "Morning reflection led to a blissful start." },
        { word: "Bespoke", definition: "Made to individual specifications.", example: "Her journal felt like a bespoke personal space." }
      ],
      C: [
        { word: "Clarity", definition: "The quality of being clear, coherent, and intelligible.", example: "Journaling brought clarity to her thoughts." },
        { word: "Cherish", definition: "Protect and care for someone or something lovingly.", example: "She cherished the peaceful morning hours." },
        { word: "Calm", definition: "Not showing or feeling nervousness or agitation.", example: "A quiet moment restored calm to her day." }
      ],
      D: [
        { word: "Delight", definition: "Great pleasure or satisfaction.", example: "Reading old memories brought immense delight." },
        { word: "Dawn", definition: "The first appearance of light in the sky before sunrise.", example: "She woke at dawn to write in her journal." },
        { word: "Devotion", definition: "Love, loyalty, or enthusiasm for a person or activity.", example: "Her daily writing showed true devotion to self-care." }
      ],
      E: [
        { word: "Ephemeral", definition: "Lasting for a very short time.", example: "The morning mist was beautiful but ephemeral." },
        { word: "Empathy", definition: "The ability to understand and share feelings.", example: "Writing entries cultivated deep empathy." },
        { word: "Elegance", definition: "The quality of being graceful and stylish.", example: "Her words flowed with natural elegance." }
      ],
      F: [
        { word: "Flourish", definition: "Grow or develop in a healthy or vigorous way.", example: "With daily reflection, peace begins to flourish." },
        { word: "Focus", definition: "The center of interest or activity.", example: "Journaling helped bring focus to her goals." },
        { word: "Freedom", definition: "The power or right to act, speak, or think without hindrance.", example: "The page offered freedom of expression." }
      ],
      G: [
        { word: "Gratitude", definition: "The quality of being thankful.", example: "She wrote three things she felt gratitude for." },
        { word: "Glow", definition: "A steady radiance or warmth.", example: "The warm tea gave the evening a cozy glow." },
        { word: "Grace", definition: "Simple elegance or refinement of movement.", example: "She handled the busy week with grace." }
      ],
      H: [
        { word: "Harmony", definition: "A pleasing arrangement or agreement of parts.", example: "Mindfulness brings harmony to daily routines." },
        { word: "Haven", definition: "A place of safety or refuge.", example: "Her journal was a quiet haven." },
        { word: "Heartfelt", definition: "Deeply felt; sincere.", example: "She wrote a heartfelt entry about her week." }
      ],
      I: [
        { word: "Insight", definition: "The capacity to gain deep intuitive understanding.", example: "The prompt offered a new insight into her goals." },
        { word: "Inspire", definition: "Fill someone with the urge to do or feel something.", example: "Quiet moments inspire new thoughts." },
        { word: "Infinite", definition: "Limitless or endless in space, extent, or size.", example: "The notebook held infinite possibilities." }
      ],
      J: [
        { word: "Jubilant", definition: "Feeling or expressing great happiness and triumph.", example: "The team was jubilant after completing the project." },
        { word: "Joyful", definition: "Feeling, causing, or showing great happiness.", example: "It was a joyful ending to a long week." },
        { word: "Journal", definition: "A daily record of news and events of a personal nature.", example: "She opened her journal every night." }
      ],
      K: [
        { word: "Kindred", definition: "Similar in kind; related.", example: "They found kindred spirits in the book club." },
        { word: "Kindness", definition: "The quality of being friendly, generous, and considerate.", example: "A simple act of kindness brightened her afternoon." },
        { word: "Keen", definition: "Having or showing eagerness or enthusiasm.", example: "She took a keen interest in learning new words." }
      ],
      L: [
        { word: "Luminous", definition: "Full of or shedding light; bright or shining.", example: "The evening light gave the room a luminous glow." },
        { word: "Light", definition: "The natural agent that stimulates sight and makes things visible.", example: "Morning light poured through the window." },
        { word: "Legacy", definition: "Something left or handed down to others.", example: "Her thoughts formed a meaningful personal legacy." }
      ],
      M: [
        { word: "Mindful", definition: "Consciously aware and present in the moment.", example: "Taking a mindful pause helps calm a busy day." },
        { word: "Melody", definition: "A sequence of single notes that is musically satisfying.", example: "A soft melody played in the background." },
        { word: "Momentum", definition: "The quantity of motion of a moving body.", example: "Writing daily builds positive momentum." }
      ],
      N: [
        { word: "Nurture", definition: "Care for and encourage the growth of.", example: "Journaling is a peaceful way to nurture creativity." },
        { word: "Novel", definition: "New or unusual in an interesting way.", example: "She came up with a novel idea during her walk." },
        { word: "Nestle", definition: "Settle or lie comfortably within or against something.", example: "She nestles in a quiet corner to read." }
      ],
      O: [
        { word: "Optimism", definition: "Hopefulness and confidence about the future.", example: "She faced the new week with optimism." },
        { word: "Origin", definition: "The point or place where something begins.", example: "Every great journey has a humble origin." },
        { word: "Openness", definition: "Lack of secrecy or concealment; frankness.", example: "She wrote with complete openness." }
      ],
      P: [
        { word: "Perseverance", definition: "Persistence in doing something despite difficulty.", example: "Her perseverance paid off in the end." },
        { word: "Peace", definition: "Freedom from disturbance; tranquility.", example: "The evening brought stillness and peace." },
        { word: "Ponder", definition: "Think about something carefully before making a decision.", example: "She took a moment to ponder the prompt." }
      ],
      Q: [
        { word: "Quaint", definition: "Attractively unusual or old-fashioned.", example: "They stayed in a quaint little village." },
        { word: "Quiet", definition: "Making little or no noise.", example: "A quiet room is perfect for reflection." },
        { word: "Quest", definition: "A long or arduous search for something.", example: "Her journal was a quest for self-discovery." }
      ],
      R: [
        { word: "Resilience", definition: "The capacity to recover quickly from difficulties.", example: "Writing helps build emotional resilience." },
        { word: "Radiance", definition: "Light or heat emitted or reflected by something.", example: "Her face shone with natural radiance." },
        { word: "Reverie", definition: "A state of being pleasantly lost in one's thoughts.", example: "She slipped into a quiet reverie while writing." }
      ],
      S: [
        { word: "Serendipity", definition: "Finding valuable or agreeable things not sought for.", example: "Writing brought a sense of serendipity to her evening." },
        { word: "Solitude", definition: "The state of being alone without feeling lonely.", example: "She cherished the morning solitude." },
        { word: "Starlight", definition: "The light coming from the stars.", example: "The room was softly lit by starlight." }
      ],
      T: [
        { word: "Tranquility", definition: "The quality or state of being tranquil; calm.", example: "A quiet morning brings pure tranquility." },
        { word: "Treasure", definition: "A quantity of precious elements or valuable memories.", example: "Her past entries were a treasure trove of moments." },
        { word: "Thoughtful", definition: "Absorbed in or showing thinking.", example: "She gave a thoughtful answer to the question." }
      ],
      U: [
        { word: "Uplift", definition: "Elevate or inspire mentally or emotionally.", example: "Positive thoughts uplift the mind." },
        { word: "Unity", definition: "The state of being united or joined as a whole.", example: "Writing brought unity to her scattered thoughts." },
        { word: "Unwind", definition: "Relax after a period of work or tension.", example: "Journaling is her favorite way to unwind." }
      ],
      V: [
        { word: "Vibrant", definition: "Full of energy and enthusiasm.", example: "The journal entry was full of vibrant details." },
        { word: "Vision", definition: "The ability to think about or plan the future with wisdom.", example: "She wrote down her vision for the upcoming year." },
        { word: "Valor", definition: "Great courage in the face of danger or difficulty.", example: "She showed remarkable valor during tough times." }
      ],
      W: [
        { word: "Wisdom", definition: "The quality of having experience, knowledge, and good judgment.", example: "Reflection is the path to personal wisdom." },
        { word: "Wonder", definition: "A feeling of amazement caused by something beautiful.", example: "The night sky filled her with wonder." },
        { word: "Warmth", definition: "The quality, state, or sensation of being warm.", example: "She felt the warmth of the morning sun." }
      ],
      X: [
        { word: "Xenial", definition: "Hospitable, warm, and welcoming to strangers.", example: "Her xenial nature made everyone feel at home." },
        { word: "Xenon", definition: "A noble gas known for creating bright, clear light.", example: "The neon glow shone bright like xenon lamps." }
      ],
      Y: [
        { word: "Yearning", definition: "A feeling of intense longing for something.", example: "A gentle yearning for peace filled the room." },
        { word: "Yonder", definition: "At or in that indicated place.", example: "New horizons awaited just yonder." },
        { word: "Yield", definition: "To produce or provide a natural result.", example: "Daily quiet time yields clarity of mind." }
      ],
      Z: [
        { word: "Zenith", definition: "The time at which something is most powerful or successful.", example: "Reaching the mountain peak was the zenith of the trip." },
        { word: "Zeal", definition: "Great energy or enthusiasm in pursuit of a cause.", example: "She approached her goals with renewed zeal." },
        { word: "Zest", definition: "Great enthusiasm and energy.", example: "She lived her life with a wonderful zest." }
      ]
    };

    const wordList = fallbacks[targetLetter] || fallbacks["S"];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  }
}
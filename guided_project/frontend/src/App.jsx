//The main control center. It holds your top-level state (e.g., list of stories, active modals), renders the navigation header, and controls the main page layout.
import { useCallback, useEffect, useState } from "react";
import { deletePost, listPosts, getToken, isGuestMode, clearAuth } from "./lib/api";
import LoginForm from "./components/LoginForm";
import { PROMPTS } from "./constants";
import StoryCard from "./components/StoryCard";
import StoryForm from "./components/StoryForm";
import ReadDialog from "./components/ReadDialog";
import VocabularyPopup from "./components/VocabularyPopup";

const isThisMonth = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export default function App() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [posts, setPosts] = useState([]);//React uses state to store dynamic data that changes when users interact with the app.
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [filter, setFilter] = useState("all"); // all | month
  const [editing, setEditing] = useState(null); // null | {} (new) | post (edit)
  const [reading, setReading] = useState(null);
  const [vocab, setVocab] = useState(null); // null | "saved" | "browse"
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);


  // ========================================================
  // 1. READ TOKEN FROM LOCALSTORAGE
  // ========================================================
  const token = getToken();
  const isGuest = isGuestMode();

  // ========================================================
  // 2. IF NO TOKEN, SHOW LOGIN SCREEN & BLOCK APP DASHBOARD
  // ========================================================
  if (!token && !isGuest) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  // ========================================================
  // 3. REST OF YOUR DASHBOARD LOGIC (load, useEffect, etc.)
  // ========================================================
  const load = useCallback(async () => {
    try {
      setPosts(await listPosts());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaved(isNew) {
    await load();
    setEditing(null);
    if (isNew) setVocab("saved"); // reward popup right after a new story
  }

  async function handleDelete(post) {
    if (!window.confirm("Delete this story? This can't be undone.")) return;
    try {
      await deletePost(post.id);
      await load();
    } catch (err) {
      window.alert(err.message);
    }
  }

  const visible = filter === "month" ? posts.filter((p) => isThisMonth(p.created_at)) : posts;
  const filterBtn = (value, label) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        filter === value ? "bg-brand-500 text-white" : "text-gray-500 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-brand-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xl shadow-sm">
              <i className="fa-solid fa-book-open text-brand-500" />
            </div>
            <div>
              <h1 className="serif-title text-2xl font-bold text-brand-700 tracking-tight leading-none">Kokoronal</h1>
              <p className="text-xs text-brand-500 font-medium tracking-wide mt-0.5"> Journal with heart, mind, and spirit </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-600">
            <span className="text-brand-600 flex items-center space-x-2">
              <i className="fa-solid fa-leaf text-xs" />
              <span>My Stories</span>
            </span>
            <button onClick={() => setVocab("browse")} className="hover:text-brand-600 transition flex items-center space-x-2">
              <i className="fa-solid fa-spell-check text-xs text-gray-400" />
              <span>Vocabulary</span>
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button onClick={() => setEditing({})} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center space-x-2">
              <i className="fa-solid fa-plus text-xs" />
              <span>New Story</span>
            </button>
            <div className="relative">
              {/* Profile Avatar Button */}
              <button 
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className={`w-10 h-10 rounded-full font-bold flex items-center justify-center cursor-pointer transition ${
                  isGuest ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-pink-200 text-pink-900"
                }`}
              >
                {isGuest ? "G" : "NF"}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      {isGuest ? "Guest User" : "Nurfarhanah"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isGuest ? "Local Sandbox Session" : "User Account"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      clearAuth(); // Clears both token and guest_mode
                      setShowProfileMenu(false);
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-stretch">
          <div className="lg:col-span-2 bg-gradient-to-br from-brand-100/60 via-white to-brand-50 border border-brand-100/80 rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute -right-10 -bottom-10 text-brand-200/40 text-9xl pointer-events-none">
              <i className="fa-solid fa-spa" />
            </div>
            <div className="relative z-10 max-w-lg">
              <span className="inline-block bg-white border border-brand-200 text-brand-600 text-xs px-3 py-1 rounded-full font-semibold mb-4">
                ✨ Daily mindful space
              </span>
              <h2 className="serif-title text-3xl md:text-4xl font-bold text-brand-700 leading-tight mb-4">Your thoughts, your space.</h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                Every feeling has a place here. Capture your moments, track your emotional journey, and learn new words along the way.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-4 pt-2">
              <button onClick={() => setEditing({})} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2">
                <i className="fa-solid fa-pen-nib text-sm" />
                <span>Create entry</span>
              </button>
              <span className="text-xs font-medium text-brand-600">
                <i className="fa-solid fa-shield-heart mr-1" /> Your stories, kept in one place
              </span>
            </div>
          </div>

          <div className="bg-white border border-brand-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg mb-4">
                <i className="fa-regular fa-sun" />
              </div>
              <h3 className="serif-title text-xl font-bold text-brand-700 mb-2">A moment to check in</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{prompt}"</p>
            </div>
            <button
              onClick={() => setEditing({ body: `${prompt}\n\n` })}
              className="w-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-2xl py-3 px-4 font-semibold text-xs transition flex items-center justify-center space-x-2"
            >
              <i className="fa-regular fa-comment-dots" />
              <span>Write about this</span>
            </button>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="serif-title text-2xl font-bold text-brand-700">Your story shelf</h3>
              <p className="text-xs text-gray-500 mt-1">Reflect, read, edit, or manage past stories</p>
            </div>
            <div className="flex items-center space-x-2 bg-white border border-brand-100 p-1 rounded-full">
              {filterBtn("all", "All stories")}
              {filterBtn("month", "This month")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {status === "loading" && <p className="col-span-full text-center text-sm text-gray-500 py-12">Loading your stories…</p>}

            {status === "error" && (
              <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-brand-100">
                <i className="fa-solid fa-plug-circle-exclamation text-rose-400 text-3xl mb-3" />
                <p className="text-sm font-semibold text-brand-700">Can't reach the server</p>
                <p className="text-xs text-gray-500 mt-1">
                  Start the backend on port 8000, then{" "}
                  <button onClick={load} className="underline text-brand-600">try again</button>.
                </p>
              </div>
            )}

            {status === "ready" && visible.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-brand-100">
                <i className="fa-solid fa-feather text-brand-200 text-4xl mb-3" />
                <p className="text-sm font-semibold text-brand-700">Your shelf is empty</p>
                <p className="text-xs text-gray-400 mt-1">Click "New Story" to capture your first moment.</p>
              </div>
            )}

            {status === "ready" &&
              visible.map((post) => (
                <StoryCard
                  key={post.id}
                  post={post}
                  onRead={() => setReading(post)}
                  onEdit={() => setEditing(post)}
                  onDelete={() => handleDelete(post)}
                />
              ))}
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-brand-100 bg-white/50 py-6 text-center text-xs text-gray-500">
        <p className="serif-title font-medium text-brand-700">Kokoronal Journal App</p>
        <p className="mt-1">Made for the moments that make you, you. &copy; 2026</p>
      </footer>

      {editing && <StoryForm post={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {reading && (
        <ReadDialog
          post={reading}
          onClose={() => setReading(null)}
          onEdit={() => {
            setEditing(reading);
            setReading(null);
          }}
        />
      )}
      {vocab && <VocabularyPopup justSaved={vocab === "saved"} onClose={() => setVocab(null)} />}
    </div>
  );
}

import { useState } from "react";
import { createPost, updatePost } from "../lib/api";
import { MOODS, PROMPTS, isVideo } from "../constants";
import Modal from "./Modal";

// One form for both create and edit. `post` has an id when editing.
export default function StoryForm({ post, onClose, onSaved }) {
  const isEdit = Boolean(post?.id);
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [mood, setMood] = useState(isEdit ? post.mood ?? "" : "Happy");
  const [format, setFormat] = useState(isVideo(post?.image) ? "video" : "text");
  const [file, setFile] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const data = new FormData();
    data.append("title", title);
    data.append("body", body);
    if (mood) data.append("mood", mood);
    else if (isEdit && post.mood) data.append("clear_mood", "true"); // blank values are ignored by the API
    if (file) data.append("image", file);
    else if (isEdit && removeMedia) data.append("remove_image", "true");

    try {
      if (isEdit) await updatePost(post.id, data);
      else await createPost(data);
      await onSaved(!isEdit);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const formatBtn = (value, icon, label) => (
    <button
      type="button"
      onClick={() => setFormat(value)}
      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition ${
        format === value ? "bg-brand-500 text-white" : "text-gray-500 hover:text-brand-600"
      }`}
    >
      <i className={`fa-solid ${icon} mr-1.5`} /> {label}
    </button>
  );

  return (
    <Modal onClose={onClose}>
      <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100">
        <div>
          <h3 className="serif-title text-2xl font-bold text-brand-700">{isEdit ? "Edit your story" : "Create your story"}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Take a moment. Your thoughts matter.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <form onSubmit={submit} className="p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-brand-700 mb-3">How are you feeling right now?</label>
          <div className="grid grid-cols-4 gap-3">
            {MOODS.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setMood(mood === m.name ? "" : m.name)} /* click again to clear */
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  mood === m.name ? "border-brand-500 bg-brand-50 text-brand-700 font-bold scale-105" : "border-gray-200 hover:border-brand-200 text-gray-600"
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-[11px]">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-700 mb-2">Journal format</label>
          <div className="inline-flex p-1 bg-brand-50 border border-brand-100 rounded-2xl w-full sm:w-auto">
            {formatBtn("text", "fa-align-left", "Text journal")}
            {formatBtn("video", "fa-video", "Upload video")}
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4">
          <button type="button" onClick={() => setShowPrompts(!showPrompts)} className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center space-x-2">
              <i className="fa-solid fa-lightbulb text-amber-500" />
              <span>Need an idea? Pick a prompt</span>
            </span>
            <i className={`fa-solid fa-chevron-down text-xs text-amber-700 transition ${showPrompts ? "rotate-180" : ""}`} />
          </button>
          {showPrompts && (
            <div className="mt-3 space-y-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBody(`${p}\n\n${body}`)}
                  className="w-full text-left text-xs bg-white hover:bg-amber-100/50 border border-amber-200 text-gray-700 p-2.5 rounded-xl transition"
                >
                  💡 {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="post-title" className="block text-xs font-bold text-brand-700 mb-1">Title</label>
            <input
              id="post-title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition"
            />
          </div>
          <div>
            <label htmlFor="post-body" className="block text-xs font-bold text-brand-700 mb-1">Your story</label>
            <textarea
              id="post-body" required rows={5} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm transition resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-700 mb-1">
            Attach {format === "video" ? "a video (mp4 or webm)" : "a photo"} (optional)
          </label>
          <label className="block border-2 border-dashed border-brand-200 rounded-2xl p-4 text-center hover:bg-brand-50/50 transition cursor-pointer">
            <i className="fa-solid fa-cloud-arrow-up text-brand-500 text-xl mb-1" />
            <p className="text-xs text-gray-500 font-medium">{file ? `Selected: ${file.name}` : "Click to choose a file"}</p>
            <input
              type="file" className="hidden"
              accept={format === "video" ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp,image/gif"}
              onChange={(e) => setFile(e.target.files[0] ?? null)}
            />
          </label>
          {isEdit && post.image && !file && (
            <label className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
              <input type="checkbox" checked={removeMedia} onChange={(e) => setRemoveMedia(e.target.checked)} />
              <span>Remove the current {isVideo(post.image) ? "video" : "photo"}</span>
            </label>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl p-3">{error}</p>}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-7 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-bold shadow-md transition flex items-center space-x-2">
            <i className="fa-solid fa-paper-plane" />
            <span>{saving ? "Saving…" : isEdit ? "Save changes" : "Save and unlock a word"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

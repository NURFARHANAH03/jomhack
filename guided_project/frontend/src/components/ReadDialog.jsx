import { MOODS, formatDate, isVideo } from "../constants";
import Modal from "./Modal";

export default function ReadDialog({ post, onClose, onEdit }) {
  const mood = MOODS.find((m) => m.name === post.mood);

  return (
    <Modal onClose={onClose} width="max-w-xl">
      <div className="p-8">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          {mood && <span className={`px-3 py-1 rounded-full text-xs font-bold ${mood.tag}`}>{mood.emoji} {mood.name}</span>}
          <span className="text-xs text-gray-400 font-medium">{formatDate(post.created_at)}</span>
        </div>

        <h3 className="serif-title text-2xl font-bold text-brand-700 mb-4 pr-10">{post.title}</h3>

        {post.image && (
          <div className="mb-4">
            {isVideo(post.image) ? (
              <video src={post.image} controls className="w-full rounded-2xl max-h-80 bg-black" />
            ) : (
              <img src={post.image} alt="" className="w-full rounded-2xl max-h-80 object-cover" />
            )}
          </div>
        )}

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-6">{post.body}</p>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-4">
          <button onClick={onEdit} className="px-4 py-2 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-full text-xs font-bold transition">
            <i className="fa-regular fa-pen-to-square mr-1" /> Edit
          </button>
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-xs font-bold transition">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

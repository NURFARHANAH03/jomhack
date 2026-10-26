import { MOODS, formatDate } from "../constants";

export default function StoryCard({ post, onRead, onEdit, onDelete }) {
  const mood = MOODS.find((m) => m.name === post.mood);

  return (
    <div className="bg-white border border-brand-100 hover:border-brand-200 rounded-3xl p-6 hover:shadow-md transition flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          {mood ? (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${mood.tag}`}>
              {mood.emoji} {mood.name}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-gray-400">{formatDate(post.created_at)}</span>
        </div>
        <h4 className="serif-title text-xl font-bold text-brand-700 group-hover:text-brand-500 transition mb-2">
          {post.title}
        </h4>
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-6">{post.body}</p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-semibold">
        <button onClick={onRead} className="text-brand-600 hover:text-brand-700 flex items-center space-x-1">
          <i className="fa-regular fa-eye" />
          <span>Read</span>
        </button>
        <div className="flex items-center space-x-3">
          <button onClick={onEdit} className="text-gray-500 hover:text-brand-600 transition flex items-center space-x-1">
            <i className="fa-regular fa-pen-to-square" />
            <span>Edit</span>
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-rose-500 transition flex items-center space-x-1">
            <i className="fa-regular fa-trash-can" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

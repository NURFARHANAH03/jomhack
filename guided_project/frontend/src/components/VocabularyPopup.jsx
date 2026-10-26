import { useRef, useState } from "react";
import { getWord } from "../lib/api";
import { LETTERS } from "../constants";
import Modal from "./Modal";

// justSaved = opened right after a story was saved (the reward). Otherwise opened from the nav.
export default function VocabularyPopup({ justSaved, onClose }) {
  const [letter, setLetter] = useState("");
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(0); // ignore slow answers from an earlier letter

  async function pick(l) {
    const id = ++latest.current;
    setLetter(l);
    setWord(null);
    setError("");
    setLoading(true);
    try {
      const result = await getWord(l);
      if (id === latest.current) setWord(result);
    } catch (err) {
      if (id === latest.current) setError(err.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} width="max-w-md">
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600 text-2xl shadow-inner">
          <i className="fa-solid fa-award" />
        </div>
        {justSaved && (
          <span className="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold mb-2">
            🎉 Reward unlocked
          </span>
        )}
        <h3 className="serif-title text-2xl font-bold text-brand-700 mb-1">
          {justSaved ? "Your story has been saved" : "Learn a new word"}
        </h3>
        <p className="text-xs text-gray-500 mb-5">Pick a letter to get a new word.</p>

        <div className="grid grid-cols-9 gap-1.5 mb-5">
          {LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={`h-9 rounded-xl text-xs font-bold transition ${
                l === letter ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="min-h-[9rem] text-left">
          {loading && <p className="text-xs text-gray-500 text-center pt-10">Finding your word…</p>}
          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl p-3">{error}</p>}
          {word && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="serif-title text-2xl font-bold text-brand-700">{word.word}</h4>
                <span className="text-xs font-bold text-brand-500 italic">{word.part_of_speech}</span>
              </div>
              <p className="text-xs text-gray-700 font-medium leading-relaxed mb-3">{word.definition}</p>
              <p className="border-t border-brand-200/60 pt-2 text-[11px] text-brand-600 italic">
                Example: {word.example}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-5">
          {word && (
            <button onClick={() => pick(letter)} className="w-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold py-3 rounded-full text-xs transition">
              Another {letter} word
            </button>
          )}
          <button onClick={onClose} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-full text-xs shadow-md transition">
            {justSaved ? "Continue to my shelf" : "Close"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

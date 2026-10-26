// Moods must match the backend / database: Happy, Sad, Angry, Tired.
export const MOODS = [
  { name: "Happy", emoji: "😊", tag: "bg-amber-100 text-amber-800" },
  { name: "Sad", emoji: "😔", tag: "bg-sky-100 text-sky-800" },
  { name: "Angry", emoji: "😠", tag: "bg-rose-100 text-rose-800" },
  { name: "Tired", emoji: "😴", tag: "bg-slate-100 text-slate-800" },
];

export const PROMPTS = [
  "What made you smile today?",
  "What is one challenge you overcame today?",
  "What did you learn about yourself this week?",
  "What is one quiet thing you felt thankful for today?",
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const isVideo = (url) => /\.(mp4|webm)$/i.test(url || "");

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

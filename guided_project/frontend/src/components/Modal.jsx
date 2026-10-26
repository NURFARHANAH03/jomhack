import { useEffect } from "react";

// Dark backdrop + white card. Closes on Escape or a click on the backdrop.
export default function Modal({ onClose, children, width = "max-w-2xl" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white border border-brand-100 rounded-3xl ${width} w-full max-h-[90vh] overflow-y-auto shadow-2xl relative`}
      >
        {children}
      </div>
    </div>
  );
}

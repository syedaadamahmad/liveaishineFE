import { Sparkles, Trash2 } from "lucide-react";

export default function Header({ onClearChat }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-white" />
        <h1 className="text-xl md:text-2xl font-bold text-white">AI Shine</h1>
      </div>
      <button
        onClick={onClearChat}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
        title="Clear Chat"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
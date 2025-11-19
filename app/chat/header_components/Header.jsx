"use client";
import { motion } from "framer-motion";
import { Sparkles, Download, Lightbulb, Focus, X } from "lucide-react";
import { BACKGROUND_MAP } from "../utils/constants";

export default function Header({ 
  onClearChat, 
  onExportPDF,
  // onOpenMotivation,
  bedtimeMode, 
  focusMode,
  setFocusMode,
  playSound,
  currentBackground, // ✅ NEW PROP
  onResetToLanding // ✅ ADD THIS
}) {
  // Don't render in focus mode
  if (focusMode) return null;

  // ✅ Sync header with background gradient
 const getHeaderGradient = () => {
    if (bedtimeMode) {
      return "bg-[#e0e5ec] shadow-[0_4px_6px_#b8bdc4]";
    }

    // ✅ Dark mode gradients
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
    const darkPrefix = isDark ? 'dark ' : '';
    
   switch(currentBackground) {
      case 'ocean':
        return isDark 
          ? "bg-gradient-to-r from-[hsl(210,50%,30%)] to-[hsl(212,60%,25%)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-[hsl(210,90%,70%)] to-[hsl(212,93%,45%)] backdrop-blur-xl border-b border-white/20";
      case 'beach':
        return isDark
          ? "bg-gradient-to-r from-[hsl(40,40%,35%)] to-[hsl(22,60%,30%)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-[hsl(40,63%,75%)] to-[hsl(22,94%,70%)] backdrop-blur-xl border-b border-white/20";
      case 'forest':
        return isDark
          ? "bg-gradient-to-r from-[hsl(165,70%,18%)] to-[hsl(161,40%,25%)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-[hsl(165,89%,28%)] to-[hsl(161,46%,45%)] backdrop-blur-xl border-b border-white/20";
      case 'sunset':
        return isDark
          ? "bg-gradient-to-r from-[hsl(33,80%,35%)] to-[hsl(58,70%,40%)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-[hsl(33,100%,50%)] to-[hsl(58,100%,65%)] backdrop-blur-xl border-b border-white/20";
      case 'twilight':
        return isDark
          ? "bg-gradient-to-r from-[hsl(186,25%,30%)] to-[hsl(216,30%,35%)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-[hsl(186,33%,88%)] to-[hsl(216,41%,75%)] backdrop-blur-xl border-b border-white/20";
      default: // moon
        return isDark
          ? "bg-gradient-to-r from-pink-900/70 via-purple-900/70 to-cyan-900/70 backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-r from-pink-400/90 via-purple-500/90 to-cyan-500/90 backdrop-blur-xl border-b border-white/20";
    }
  };

  const buttonStyle = bedtimeMode
    ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-[#1a0f08] hover:shadow-[inset_2px_2px_4px_#b8bdc4,inset_-2px_-2px_4px_#ffffff]"
    : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white";

  const textColor = bedtimeMode ? 'text-[#1a0f08]' : 'text-white'; // ✅ Dark brown text

  return (
    <header className={`relative z-30 ${getHeaderGradient()} shadow-lg`}>
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
        {/* Logo & Title */}
<motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onResetToLanding} // ✅ ADD THIS PROP
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Sparkles className={`w-6 h-6 ${bedtimeMode ? 'text-[#8b5a3c]' : 'text-cyan-300'}`} />
          <div className={`text-2xl md:text-3xl font-bold tracking-tight ${textColor}`}>
            AI <span className={bedtimeMode ? 'text-[#8b5a3c]' : 'text-cyan-300'}>SHINE</span>
          </div>
        </motion.button>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          {/* Export PDF */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExportPDF}
            className={`p-2 rounded-lg transition-all cursor-pointer ${buttonStyle}`}
            title="Export to PDF"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>

          {/* Motivational Card */}
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenMotivation}
            className={`p-2 rounded-lg transition-all cursor-pointer ${buttonStyle}`}
            title="Get Motivated"
          >
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button> */}

          {/* Focus Mode */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setFocusMode(true);
              playSound('click');
            }}
            className={`p-2 rounded-lg transition-all cursor-pointer ${buttonStyle}`}
            title="Focus Mode"
          >
            <Focus className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>

          {/* Clear Chat */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearChat}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-sm md:text-base font-medium transition-all cursor-pointer ${buttonStyle}`}
          >
            Clear Chat
          </motion.button>
        </motion.div>
      </div>
    </header>
  );
}






import { useRef, useEffect, useState } from "react";
import { Send, Mic, MicOff, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InputArea({
  input,
  setInput,
  loading,
  listening,
  isFirstMessage,
  focusMode,
  bedtimeMode,
  textareaRef,
  fontFamilyMap,
  fontFamily,
  fontSizeMap,
  fontSize,
  onSend,
  onToggleListening,
  onOpenSettings,
  onTextareaChange,
  animationsEnabled
}) {
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Collapse on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef && containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const buttonProps = animationsEnabled ? {
    whileHover: { scale: 1.07 },
    whileTap: { scale: 0.95 }
  } : {};

  // ===== FOCUS MODE: GLASS UI (APPLE STYLE) =====
  if (focusMode) {
    const glassBackground = "bg-black/30 backdrop-blur-xl border border-white/20 shadow-2xl";
    const appleButton = "rounded-xl px-3 py-2 shadow-md backdrop-blur-xl active:scale-95 cursor-pointer select-none";
    const iconColor = "text-gray-200";
    const micIdle = "bg-white/20 hover:bg-white/30 border border-white/20 transition";
    const sendBtn = "bg-white/20 border border-white/20 hover:bg-white/30";
    
    // ✅ FULL WIDTH ON FOCUS
    const widthClass = isFocused ? 'w-full max-w-6xl' : 'w-full max-w-2xl';
    
    return (
      <div
        ref={containerRef}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${glassBackground} ${widthClass} rounded-2xl px-4 py-3 flex items-end gap-3 transition-all duration-300 z-30`}
      >
        <textarea
          ref={textareaRef}
          onFocus={() => setIsFocused(true)}
          className="flex-1 bg-transparent px-3 py-2 rounded-xl resize-none min-h-[44px]
            text-white placeholder-gray-400 outline-none"
          placeholder="Type your question..."
          value={input}
          rows="1"
          onChange={onTextareaChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <motion.button
          {...buttonProps}
          onClick={onToggleListening}
          disabled={loading}
          className={`${appleButton} ${
            listening ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" : micIdle
          }`}
        >
          {listening ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className={`w-5 h-5 ${iconColor}`} />
          )}
        </motion.button>

        <motion.button
          {...buttonProps}
          onClick={onSend}
          disabled={loading || !input.trim()}
          className={`${appleButton} ${sendBtn} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <Send className="w-5 h-5 text-white" />
        </motion.button>
      </div>
    );
  }

  // ===== DEFAULT & BEDTIME MODE: ENHANCED WITH FULL SCREEN ON FOCUS =====
  const containerStyle = bedtimeMode
    ? 'bg-[#e0e5ec] shadow-[0_-4px_6px_#b8bdc4]'
    : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/30';

  const inputStyle = bedtimeMode
    ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
    : 'bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-white/30 dark:border-gray-700/30';

  const appleButton = "rounded-xl px-3 py-2 shadow-md active:scale-95 cursor-pointer select-none";

  const buttonStyle = bedtimeMode
    ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]'
    : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 border border-white/30 dark:border-gray-700/30';

  const iconColor = bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-600 dark:text-gray-300';

  // ✅ DYNAMIC WIDTH: Full screen on focus, normal when not
  const getWidthClass = () => {
    if (isFirstMessage) {
      return isFocused ? 'w-full max-w-6xl' : 'w-full max-w-3xl';
    }
    return 'w-full';
  };

  // ✅ POSITIONING: Fixed on landing page, relative in chat
  const getPositionClass = () => {
    if (isFirstMessage) {
      return 'fixed bottom-8 left-1/2 -translate-x-1/2 px-4 rounded-2xl shadow-2xl';
    }
    return 'relative w-full';
  };

  return (
    <div 
      ref={containerRef}
      className={`${getPositionClass()} ${
        isFirstMessage ? getWidthClass() : ''
      } ${containerStyle} p-3 md:p-4 flex gap-3 items-end flex-shrink-0 z-20 transition-all duration-300 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
    >
      <textarea
        ref={textareaRef}
        onFocus={() => setIsFocused(true)}
        className={`flex-1 ${inputStyle} backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-2xl resize-none min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-cyan-400 transition-all duration-200 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
        placeholder="Ask anything about AI..."
        rows="1"
        value={input}
        onChange={onTextareaChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />

      <motion.button
        {...buttonProps}
        onClick={onToggleListening}
        disabled={loading}
        className={`${appleButton} ${buttonStyle} ${
          listening ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110" : ""
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={listening ? "Listening..." : "Tap to Speak"}
      >
        {listening ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className={`w-5 h-5 ${iconColor}`} />
        )}
      </motion.button>

      <motion.button
        {...buttonProps}
        onClick={onOpenSettings}
        className={`${appleButton} ${buttonStyle}`}
      >
        <Settings className={`w-5 h-5 ${iconColor}`} />
      </motion.button>

      <motion.button
        {...buttonProps}
        onClick={onSend}
        disabled={loading || !input.trim()}
        className={`${appleButton} ${
          bedtimeMode
            ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]'
            : 'bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:from-pink-500 hover:via-purple-600 hover:to-cyan-600'
        } group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Send message"
      >
        {!bedtimeMode && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        )}
        <Send className={`w-5 h-5 relative z-10 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-white'}`} />
      </motion.button>
    </div>
  );
}




















// // default navbar
// import { Send, Mic, MicOff, Settings } from 'lucide-react';
// import { motion } from 'framer-motion';

// export default function InputArea({
//   input,
//   setInput,
//   loading,
//   listening,
//   isFirstMessage,
//   focusMode,
//   bedtimeMode,
//   textareaRef,
//   fontFamilyMap,
//   fontFamily,
//   fontSizeMap,
//   fontSize,
//   onSend,
//   onToggleListening,
//   onOpenSettings,
//   onTextareaChange,
//   animationsEnabled
// }) {
//   const containerStyle = bedtimeMode
//     ? 'bg-[#e0e5ec] shadow-[0_-4px_6px_#b8bdc4]'
//     : focusMode
//       ? 'bg-black/60 backdrop-blur-xl border-t border-white/10'
//       : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/30';

//   const inputStyle = bedtimeMode
//     ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-gray-900'
//     : focusMode
//       ? 'bg-white/10 text-white placeholder:text-gray-400 border border-white/20'
//       : 'bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-white/30 dark:border-gray-700/30';

//   const buttonStyle = bedtimeMode
//     ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]'
//     : focusMode
//       ? 'bg-white/10 hover:bg-white/20 border border-white/20'
//       : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 border border-white/30 dark:border-gray-700/30';

//   // ✅ FIX: Proper conditional rendering
//   const buttonProps = animationsEnabled ? {
//     whileHover: { scale: 1.05 },
//     whileTap: { scale: 0.95 }
//   } : {};

//   return (
//     <div className={`${
//       isFirstMessage ? 'fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4' : 'relative'
//     } ${
//       focusMode ? 'max-w-4xl mx-auto w-full' : ''
//     } ${containerStyle} ${
//       isFirstMessage ? 'rounded-2xl shadow-2xl' : ''
//     } p-3 md:p-4 flex gap-2 md:gap-3 items-end flex-shrink-0 z-20 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}>
      
//       <textarea
//         ref={textareaRef}
//         className={`flex-1 ${inputStyle} backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-2xl resize-none min-h-[44px] focus:outline-none focus:ring-2 ${
//           focusMode ? 'focus:ring-white/50' : 'focus:ring-purple-500 dark:focus:ring-cyan-400'
//         } transition-all duration-200 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//         placeholder="Ask anything about AI..."
//         rows="1"
//         value={input}
//         onChange={onTextareaChange}
//         onKeyDown={(e) => {
//           if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();
//             onSend();
//           }
//         }}
//       />

//       {/* Mic Button */}
//       <motion.button
//         {...buttonProps}
//         onClick={onToggleListening}
//         disabled={loading}
//         className={`rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
//           listening
//             ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//             : buttonStyle
//         }`}
//         title={listening ? "Listening..." : "Tap to Speak"}
//       >
//         {listening ? (
//           <MicOff className="w-5 h-5 text-white" />
//         ) : (
//           <Mic className={`w-5 h-5 ${focusMode || bedtimeMode ? 'text-gray-700' : 'text-gray-600 dark:text-gray-300'}`} />
//         )}
//       </motion.button>

//       {/* Settings Button */}
//       <motion.button
//         {...buttonProps}
//         onClick={onOpenSettings}
//         className={`rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer ${buttonStyle}`}
//       >
//         <Settings className={`w-5 h-5 ${focusMode || bedtimeMode ? 'text-gray-700' : 'text-gray-600 dark:text-gray-300'}`} />
//       </motion.button>

//       {/* Send Button */}
//       <motion.button
//         {...buttonProps}
//         onClick={onSend}
//         disabled={loading || !input.trim()}
//         className={`relative rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
//           focusMode
//             ? 'bg-white/20 hover:bg-white/30 border border-white/20'
//             : bedtimeMode
//               ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]'
//               : 'bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:from-pink-500 hover:via-purple-600 hover:to-cyan-600'
//         } group overflow-hidden`}
//         title="Send message"
//       >
//         {!focusMode && !bedtimeMode && (
//           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
//         )}
//         <Send className={`w-5 h-5 relative z-10 ${focusMode || bedtimeMode ? 'text-gray-700' : 'text-white'}`} />
//       </motion.button>
//     </div>
//   );
// }














// // glass navbar
// import { useRef, useEffect, useState } from "react";
// import { Mic, MicOff, Send, Settings } from "lucide-react";

// export default function InputArea({
//   input,
//   setInput,
//   loading,
//   listening,
//   isFirstMessage,
//   focusMode,
//   bedtimeMode,
//   textareaRef,
//   fontFamilyMap,
//   fontFamily,
//   fontSizeMap,
//   fontSize,
//   onSend,
//   onToggleListening,
//   onOpenSettings,
//   onTextareaChange,
//   animationsEnabled,
// }) {
//   const containerRef = useRef(null);
//   const [isFocused, setIsFocused] = useState(false);

//   // Collapse on outside click
//   useEffect(() => {
//     const handleClick = (e) => {
//       if (!containerRef.current?.contains(e.target)) {
//         setIsFocused(false);
//       }
//     };
//     document.addEventListener("click", handleClick);
//     return () => document.removeEventListener("click", handleClick);
//   }, []);

//   // BUTTON & ICON TREATMENT (APPLE STYLE)
//   const appleButton =
//     "rounded-xl px-3 py-2 shadow-md backdrop-blur-xl active:scale-95 cursor-pointer select-none";

//   const iconColor =
//     bedtimeMode || focusMode
//       ? "text-gray-800"
//       : "text-gray-700 dark:text-gray-200";

//   // Button backgrounds
//   const micIdle =
//     "bg-white/20 hover:bg-white/30 border border-white/20 transition";
//   const settingsIdle = micIdle;

//   const sendBtn = bedtimeMode
//     ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#caced5,-4px_-4px_8px_#ffffff]"
//     : focusMode
//     ? "bg-white/20 border border-white/20 hover:bg-white/30"
//     : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:brightness-110";

//   // Glass background
//   const glassBackground = bedtimeMode
//     ? "bg-[#e0e5ec]/90 shadow-[6px_6px_12px_#babfc4,-6px_-6px_12px_#ffffff]"
//     : focusMode
//     ? "bg-black/30 border border-white/20 shadow-xl"
//     : "bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 shadow-lg";

//   // Width logic
//   const widthClass = focusMode
//     ? "w-full" // full width always in focus mode
//     : isFocused
//     ? "w-full max-w-4xl"
//     : isFirstMessage
//     ? "w-full max-w-3xl"
//     : "w-full max-w-2xl";

//   return (
//     <div
//       ref={containerRef}
//       className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${glassBackground} ${widthClass} 
//         rounded-2xl px-4 py-3 flex items-end gap-3 transition-all duration-300 z-30 
//         ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//     >
//       {/* TEXTAREA */}
//       <textarea
//         ref={textareaRef}
//         onFocus={() => setIsFocused(true)}
//         className="flex-1 bg-transparent px-3 py-2 rounded-xl resize-none min-h-[44px]
//           text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none"
//         placeholder="Type your question..."
//         value={input}
//         rows="1"
//         onChange={onTextareaChange}
//         onKeyDown={(e) => {
//           if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();
//             onSend();
//           }
//         }}
//       />

//       {/* MIC */}
//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.07 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onToggleListening}
//         disabled={loading}
//         className={`${appleButton} ${
//           listening
//             ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
//             : micIdle
//         }`}
//       >
//         {listening ? (
//           <MicOff className="w-5 h-5 text-white cursor-pointer" />
//         ) : (
//           <Mic className={`w-5 h-5 ${iconColor}`} />
//         )}
//       </motion.button>

//       {/* SETTINGS */}
//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.07 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onOpenSettings}
//         className={`${appleButton} ${settingsIdle}`}
//       >
//         <Settings className={`w-5 h-5 ${iconColor}`} />
//       </motion.button>

//       {/* SEND BUTTON */}
//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.07 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onSend}
//         disabled={loading || !input.trim()}
//         className={`${appleButton} ${sendBtn} disabled:opacity-30 disabled:cursor-not-allowed`}
//       >
//         <Send
//           className={`w-5 h-5 ${
//             bedtimeMode || focusMode ? "text-gray-800" : "text-white"
//           }`}
//         />
//       </motion.button>
//     </div>
//   );
// }























// app/chat/components/InputArea.jsx
// "use client";
// import { useRef, useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { Mic, MicOff, Send, Settings } from "lucide-react";

// export default function InputArea({
//   input,
//   setInput,
//   loading,
//   listening,
//   isFirstMessage,
//   focusMode,
//   bedtimeMode,
//   textareaRef,
//   fontFamilyMap,
//   fontFamily,
//   fontSizeMap,
//   fontSize,
//   onSend,
//   onToggleListening,
//   onOpenSettings,
//   onTextareaChange,
//   animationsEnabled,
// }) {
//   const containerRef = useRef(null);
//   const [isFocused, setIsFocused] = useState(false);

//   // Collapse on outside click
//   useEffect(() => {
//     const handleClick = (e) => {
//       if (!containerRef.current?.contains(e.target)) {
//         setIsFocused(false);
//       }
//     };
//     document.addEventListener("click", handleClick);
//     return () => document.removeEventListener("click", handleClick);
//   }, []);

//   // Apple-style rounded rect
//   const appleButton = "rounded-[16px] px-3 py-2 shadow transition active:scale-95 cursor-pointer select-none";

//   const iconColor = bedtimeMode || focusMode ? "text-gray-800" : "text-gray-200 dark:text-gray-200";

//   const micIdle = "bg-white/10 hover:bg-white/20 border border-white/10 transition";
//   const sendBtn = bedtimeMode ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#caced5,-4px_-4px_8px_#ffffff]" : focusMode ? "bg-white/10 border border-white/20" : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500";

//   const glassBackground = bedtimeMode
//     ? "bg-[#e0e5ec]/95 shadow-[6px_6px_12px_#babfc4,-6px_-6px_12px_#ffffff]"
//     : focusMode
//     ? "bg-black/70 border border-white/10 shadow-none"
//     : "bg-white/6 dark:bg-black/40 backdrop-blur-xl border border-white/6 shadow-lg";

//   const widthClass = focusMode ? "w-full left-0 -translate-x-0 px-6" : isFocused ? "w-full max-w-4xl" : isFirstMessage ? "w-full max-w-3xl" : "w-full max-w-2xl";

//   return (
//     <div
//       ref={containerRef}
//       className={`fixed bottom-6 ${focusMode ? 'left-0' : 'left-1/2 -translate-x-1/2'} ${glassBackground} ${widthClass} 
//         rounded-2xl px-4 py-3 flex items-end gap-3 transition-all duration-300 z-40 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//       style={{ pointerEvents: 'auto' }}
//     >
//       <textarea
//         ref={textareaRef}
//         onFocus={() => setIsFocused(true)}
//         className="flex-1 bg-transparent px-3 py-2 rounded-xl resize-none min-h-[44px]
//           text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
//         placeholder="Type your question..."
//         value={input}
//         rows="1"
//         onChange={onTextareaChange}
//         onKeyDown={(e) => {
//           if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();
//             onSend();
//           }
//         }}
//       />

//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.05 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onToggleListening}
//         disabled={loading}
//         className={`${appleButton} ${listening ? 'bg-red-500 text-white' : micIdle}`}
//         title={listening ? "Stop listening" : "Start listening"}
//       >
//         {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className={`w-5 h-5 ${iconColor}`} />}
//       </motion.button>

//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.05 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onOpenSettings}
//         className={`${appleButton} ${micIdle}`}
//         title="Settings"
//       >
//         <Settings className={`w-5 h-5 ${iconColor}`} />
//       </motion.button>

//       <motion.button
//         whileHover={animationsEnabled ? { scale: 1.05 } : {}}
//         whileTap={animationsEnabled ? { scale: 0.95 } : {}}
//         onClick={onSend}
//         disabled={loading || !input.trim()}
//         className={`${appleButton} ${sendBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
//         title="Send message"
//       >
//         <Send className={`w-5 h-5 ${bedtimeMode || focusMode ? 'text-gray-800' : 'text-white'}`} />
//       </motion.button>
//     </div>
//   );
// }

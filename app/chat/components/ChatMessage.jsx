import { motion } from "framer-motion";
import ChatActions from "./ChatActions";
import { BUBBLE_COLORS } from "../utils/constants";

export default function ChatMessage({
  message,
  index,
  isUser,
  feedback,
  copiedIndex,
  speaking,
  onFeedback,
  onCopy,
  onSpeak,
  onShare,
  fontSizeMap,
  fontSize,
  focusMode,
  bedtimeMode,
  currentBackground // ✅ NEW PROP
}) {
  const { role, type, content, timestamp } = message;

  // Get bubble colors based on current background
  const bubbleColors = BUBBLE_COLORS[currentBackground || 'doodles'] || BUBBLE_COLORS.doodles;

  // Determine message bubble styles
  const userBubbleStyle = bedtimeMode
    ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-[#1a0f08]' // ✅ Almost black
    : focusMode
      ? 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
      : bubbleColors.user; // ✅ Use background-synced color

const aiBubbleStyle = bedtimeMode
    ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-[#1a0f08] border-none' // ✅ Almost black
    : focusMode
      ? 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
      : `${bubbleColors.ai} backdrop-blur-md`; // ✅ Use background-synced color

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-2 max-w-[85%] md:max-w-[80%]`}>
        {/* Avatar */}
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? bedtimeMode
              ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]"
              : focusMode
                ? "bg-white/20 border border-white/30"
                : "bg-gradient-to-br from-gray-600 to-gray-800"
            : bedtimeMode
              ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]"
              : focusMode
                ? "bg-white/20 border border-white/30"
                : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"
        }`}>
          <span className={`text-lg ${bedtimeMode ? 'grayscale' : ''}`}>{isUser ? "👤" : "🤖"}</span>
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1 flex-1">
          {type === "decline" || type === "error" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
           className={`border-l-4 border-red-500 px-4 md:px-5 py-3 rounded-lg shadow-sm relative ${
                bedtimeMode
                  ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-[#1a0f08]' // ✅ Almost black
                  : focusMode
                    ? 'bg-red-900/20 text-white backdrop-blur-md'
                    : 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-200'
              }`}
            >
<div className="font-semibold mb-1">⚠️ System Notice</div>
              <div className={`text-sm ${fontSizeMap[fontSize]}`} dangerouslySetInnerHTML={{ __html: content }} />
              <div className="text-xs mt-2 text-right opacity-70">
                {timestamp}
              </div>
            </motion.div>
          ) : type === "structured" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 md:px-5 py-4 rounded-2xl shadow-lg transition-transform hover:scale-[1.01] relative ${aiBubbleStyle}`}
            >
              <h4 className={`font-semibold mb-2 ${focusMode || bedtimeMode ? '' : 'text-blue-700 dark:text-blue-400'}`}>Answer</h4>
              <div className={`text-sm mb-3 leading-relaxed ${fontSizeMap[fontSize]}`} dangerouslySetInnerHTML={{ __html: content.answer }} />
              
              {content.keyPoints && content.keyPoints.length > 0 && (
                <>
                  <h4 className={`font-semibold mb-2 ${focusMode || bedtimeMode ? '' : 'text-green-700 dark:text-green-400'}`}>Key Points</h4>
                  <ul className={`list-disc list-inside text-sm space-y-1 ${fontSizeMap[fontSize]}`}>
                    {content.keyPoints.map((kp, i) => (
                      <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: kp }} />
                    ))}
                  </ul>
                </>
              )}
              
              <div className="text-xs mt-3 text-right opacity-70"> {/* ✅ INCREASED from text-[10px] to text-xs */}
                {timestamp}
              </div>

              {!isUser && (
                <ChatActions
                  messageIndex={index}
                  content={content}
                  feedback={feedback}
                  onFeedback={onFeedback}
                  onCopy={onCopy}
                  onSpeak={onSpeak}
                  onShare={onShare}
                  copied={copiedIndex}
                  speaking={speaking}
                />
              )}
            </motion.div>
          ) : (
            <div className={`px-4 md:px-5 py-3 rounded-2xl shadow-md relative ${fontSizeMap[fontSize]} ${
              isUser ? `${userBubbleStyle} rounded-br-none` : `${aiBubbleStyle} rounded-bl-none`
            }`}>
 <div dangerouslySetInnerHTML={{ __html: content }} />
              <div className="text-xs mt-2 text-right opacity-70">
                {timestamp}
              </div>

              {!isUser && (
                <ChatActions
                  messageIndex={index}
                  content={content}
                  feedback={feedback}
                  onFeedback={onFeedback}
                  onCopy={onCopy}
                  onSpeak={onSpeak}
                  onShare={onShare}
                  copied={copiedIndex}
                  speaking={speaking}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}



























// "use client";

// import { motion } from "framer-motion";
// import ChatActions from "./ChatActions"; // ensure path is correct, export exists

// export default function ChatMessage({
//   message,
//   index,
//   isUser,
//   feedback,
//   copiedIndex,
//   speaking,
//   onFeedback,
//   onCopy,
//   onSpeak,
//   onShare,
//   fontSizeMap,
//   fontSize,
//   focusMode,      // optional prop (also read from settings fallback)
//   bedtimeMode,    // optional prop (also read from settings fallback)
//   settings        // may be undefined — we'll be defensive
// }) {
//   const { role, type, content, timestamp } = message || {};

//   // ----------------- defensive settings defaults -----------------
//   const safeSettings = {
//     bedtimeMode: (settings && typeof settings.bedtimeMode === "boolean") ? settings.bedtimeMode : !!bedtimeMode,
//     focusMode: (settings && typeof settings.focusMode === "boolean") ? settings.focusMode : !!focusMode,
//     isDarkMode: (settings && typeof settings.isDarkMode === "boolean") ? settings.isDarkMode : false
//   };

//   const { bedtimeMode: sBedtime, focusMode: sFocus, isDarkMode: sDark } = safeSettings;

//   // ---------------------------------------------------------
//   // MODE ENGINE (LIGHT, DARK, BEDTIME, FOCUS)
//   // ---------------------------------------------------------
//   const currentMode = sBedtime ? "bedtime" : sFocus ? "focus" : sDark ? "dark" : "light";

//   const bubbleBase =
//     "rounded-2xl p-4 transition-all duration-300 max-w-[80%] md:max-w-[70%]";

//   const modeStyles = {
//     light:
//       "bg-white/30 backdrop-blur-xl border border-white/20 text-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
//     dark:
//       "bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
//     bedtime:
//       "bg-[#e0e5ec] text-gray-800 shadow-[8px_8px_20px_#b8bdc4,-8px_-8px_20px_#ffffff]",
//     focus:
//       "bg-white/10 backdrop-blur-xl border border-white/10 text-white shadow-none"
//   };

//   const userBubble = `${bubbleBase} ${modeStyles[currentMode]} text-right`;
//   const aiBubble = `${bubbleBase} ${modeStyles[currentMode]} text-left`;

//   // ---------------------------------------------------------
//   // AVATAR COLORS
//   // ---------------------------------------------------------
//   const avatarBase =
//     "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0";

//   const avatarStyle = (() => {
//     if (sBedtime)
//       return "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]";

//     if (sFocus)
//       return "bg-white/20 border border-white/30";

//     if (isUser)
//       return "bg-gradient-to-br from-gray-600 to-gray-800";

//     return "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500";
//   })();

//   // ----------------- handle special message types -----------------
//   if (!message) {
//     return null;
//   }

//   if (type === "decline" || type === "error") {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -10 }}
//         transition={{ duration: 0.3 }}
//         className="flex justify-start"
//       >
//         <div
//           className={`border-l-4 border-red-500 px-4 py-3 rounded-xl shadow-md max-w-[80%] md:max-w-[70%] ${
//             sBedtime
//               ? "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-gray-900"
//               : sFocus
//               ? "bg-red-900/20 text-white backdrop-blur-md"
//               : "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-200"
//           }`}
//         >
//           <div className="font-semibold mb-1">⚠️ System Notice</div>
//           <div
//             className={`text-sm ${fontSizeMap?.[fontSize] || ""}`}
//             dangerouslySetInnerHTML={{ __html: content }}
//           />
//           <div className="text-[10px] mt-2 opacity-70 text-right">{timestamp}</div>
//         </div>
//       </motion.div>
//     );
//   }

//   if (type === "structured") {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -10 }}
//         transition={{ duration: 0.3 }}
//         className="flex justify-start"
//       >
//         <div className={aiBubble}>
//           <h4 className="font-semibold mb-2 opacity-80">Answer</h4>

//           <div
//             className="text-sm leading-relaxed mb-3"
//             dangerouslySetInnerHTML={{ __html: content?.answer || "" }}
//           />

//           {content?.keyPoints?.length > 0 && (
//             <>
//               <h4 className="font-semibold mb-2 opacity-80">Key Points</h4>
//               <ul className="list-disc list-inside space-y-1 text-sm">
//                 {content.keyPoints.map((kp, i) => (
//                   <li key={i} dangerouslySetInnerHTML={{ __html: kp }} />
//                 ))}
//               </ul>
//             </>
//           )}

//           <div className="text-[10px] opacity-60 mt-3">{timestamp}</div>

//           <ChatActions
//             messageIndex={index}
//             content={content}
//             feedback={feedback}
//             copied={copiedIndex}
//             speaking={speaking}
//             onCopy={onCopy}
//             onSpeak={onSpeak}
//             onFeedback={onFeedback}
//             onShare={onShare}
//           />
//         </div>
//       </motion.div>
//     );
//   }

//   // ----------------- default text message -----------------
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -10 }}
//       transition={{ duration: 0.3 }}
//       className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//     >
//       <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-2`}>
//         <div className={`${avatarBase} ${avatarStyle}`}>
//           <span className={`text-lg ${sBedtime ? "grayscale" : ""}`}>
//             {isUser ? "👤" : "🤖"}
//           </span>
//         </div>

//         <div className={isUser ? userBubble : aiBubble}>
//           <div dangerouslySetInnerHTML={{ __html: content || "" }} />
//           <div className="text-[10px] opacity-60 mt-2">{timestamp}</div>

//           {!isUser && (
//             <ChatActions
//               messageIndex={index}
//               content={content}
//               feedback={feedback}
//               copied={copiedIndex}
//               speaking={speaking}
//               onCopy={onCopy}
//               onSpeak={onSpeak}
//               onFeedback={onFeedback}
//               onShare={onShare}
//             />
//           )}
//         </div>
//       </div>
//     </motion.div>
//   );
// }

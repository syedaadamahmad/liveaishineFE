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





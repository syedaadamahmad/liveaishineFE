import { ThumbsUp, ThumbsDown, Copy, Share2, Volume2, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function ChatActions({
  messageIndex,
  content,
  feedback,
  onFeedback,
  onCopy,
  onSpeak,
  onShare,
  copied,
  speaking
}) {
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    if (feedback[messageIndex] === 'up') {
      // Reset if already liked
      onFeedback(messageIndex, null);
    } else {
      onFeedback(messageIndex, 'up');
      // Show Instagram-like heart animation
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleDislike = () => {
    if (feedback[messageIndex] === 'down') {
      // Reset if already disliked
      onFeedback(messageIndex, null);
    } else {
      onFeedback(messageIndex, 'down');
    }
  };

  const handleDoubleClick = () => {
    if (feedback[messageIndex] !== 'up') {
      onFeedback(messageIndex, 'up');
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  return (
    <div 
      className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 relative"
      onDoubleClick={handleDoubleClick}
    >
      {/* Instagram-like Heart Animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <Heart className="w-16 h-16 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleLike}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          feedback[messageIndex] === 'up' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleDislike}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          feedback[messageIndex] === 'down' 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Not helpful"
      >
        <ThumbsDown className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onCopy(content, messageIndex)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all cursor-pointer"
        title="Copy"
      >
        {copied === messageIndex ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onSpeak(content)}
        className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer ${
          speaking ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
        }`}
        title="Read aloud"
      >
        <Volume2 className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onShare(content, messageIndex)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all cursor-pointer"
        title="Share"
      >
        <Share2 className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

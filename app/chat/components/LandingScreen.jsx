import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SUGGESTIONS, WELCOME_GRADIENTS, WORKSHOP_GREETING } from '../utils/constants';

export default function LandingScreen({
  greeting,
  gradientIndex,
  hoveredSuggestion,
  setHoveredSuggestion,
  onSuggestionClick,
  animationsEnabled
}) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full min-h-screen flex flex-col items-center justify-start py-4 sm:py-6 px-3 sm:px-4 overflow-y-auto"
    >
      <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-5">

        {/* Greeting Section */}
        <motion.div
          initial={animationsEnabled ? { y: -15, opacity: 0 } : {}}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center space-y-3 sm:space-y-4"
        >

          {/* Title */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-1">
            <motion.h1
              className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r ${WELCOME_GRADIENTS[gradientIndex]} bg-clip-text text-transparent leading-snug`}
              animate={
                animationsEnabled
                  ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                  : {}
              }
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {greeting}
            </motion.h1>

            {animationsEnabled && (
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl sm:text-3xl"
              >
                ✨
              </motion.div>
            )}
          </div>

          {/* Subtitle */}
          <motion.p
            className={`text-sm sm:text-base md:text-lg bg-gradient-to-r ${WELCOME_GRADIENTS[gradientIndex]} bg-clip-text text-transparent font-semibold px-3`}
            animate={
              animationsEnabled
                ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                : {}
            }
            transition={{ duration: 4, repeat: Infinity }}
            style={{ backgroundSize: '200% 200%' }}
          >
            What would you like to ask <strong>AI-SHINE</strong> today?
          </motion.p>

          {/* Workshop Intro */}
          <motion.div
            initial={animationsEnabled ? { y: 15, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-3 sm:space-y-4"
          >
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto px-3 leading-relaxed">
              {WORKSHOP_GREETING.welcome}
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-w-4xl mx-auto px-3">
              {WORKSHOP_GREETING.checklist.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={animationsEnabled ? { scale: 0.95, opacity: 0 } : {}}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.07 }}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl p-3 sm:p-4 text-center hover:shadow-md"
                >
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <p className={`text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r ${WELCOME_GRADIENTS[gradientIndex]} bg-clip-text text-transparent px-3`}>
              {WORKSHOP_GREETING.divein}
            </p>
          </motion.div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={animationsEnabled ? { y: 15, opacity: 0 } : {}}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-4xl mx-auto px-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {SUGGESTIONS.map((suggestion, idx) => (
              <motion.button
                key={idx}
                initial={animationsEnabled ? { y: 15, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + idx * 0.07 }}
                whileTap={animationsEnabled ? { scale: 0.97 } : {}}
                onMouseEnter={() => setHoveredSuggestion(idx)}
                onMouseLeave={() => setHoveredSuggestion(null)}
                onClick={() => onSuggestionClick(suggestion)}
                className={`relative p-3 sm:p-4 rounded-xl backdrop-blur-md border transition-all shadow-md text-left group overflow-hidden min-h-[60px] sm:min-h-[80px] ${
                  hoveredSuggestion === idx
                    ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-cyan-900/30 border-transparent'
                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-2 relative z-10">
                  <Sparkles
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                      hoveredSuggestion === idx
                        ? 'text-purple-600'
                        : 'text-purple-500'
                    }`}
                  />
                  <span className={`text-xs sm:text-sm md:text-base leading-relaxed ${
                    hoveredSuggestion === idx
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {suggestion}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

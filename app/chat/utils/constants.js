
// post-presentaiton.json constants:
export const WELCOME_GRADIENTS = [
  "from-pink-500 via-purple-600 to-indigo-600",
  "from-cyan-500 via-blue-600 to-purple-600",
  "from-orange-500 via-pink-600 to-red-600",
  "from-green-500 via-teal-600 to-cyan-600",
  "from-violet-500 via-fuchsia-600 to-pink-600",
  "from-amber-500 via-orange-600 to-red-600",
];

export const FONT_SIZE_MAP = {
  XS: "text-xs",
  S: "text-sm",
  M: "text-base",
  L: "text-lg",
  XL: "text-xl"
};

export const FONT_FAMILY_MAP = {
  standard: "font-sans",
  lexend: "font-['Lexend',sans-serif]",
  times: "font-serif"
};

export const BACKGROUND_MAP = {
  // doodles: "bg-[url('/assets/bg_doodles.png')] bg-cover bg-center",
    moon: "bg-[#c9c9c9] [background:radial-gradient(circle,_rgba(201,201,201,1)_0%,_rgba(112,112,112,1)_100%)]",
  ocean: "bg-gradient-to-r from-[hsl(210,90%,80%)] to-[hsl(212,93%,49%)]",
  beach: "bg-gradient-to-r from-[hsl(40,63%,85%)] to-[hsl(22,94%,79%)]",
  forest: "bg-gradient-to-r from-[hsl(165,89%,31%)] to-[hsl(161,46%,49%)]",
  sunset: "bg-gradient-to-r from-[hsl(33,100%,53%)] to-[hsl(58,100%,68%)]",
  twilight: "bg-gradient-to-r from-[hsl(186,33%,94%)] to-[hsl(216,41%,79%)]"
};

export const BUBBLE_COLORS = {
  doodles: {
    user: "bg-[#005c4b] text-white",
    ai: "bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700"
  },
  ocean: {
    user: "bg-[#0974F1] text-white",
    ai: "bg-white/95 text-gray-800 border border-blue-200 shadow-blue-100"
  },
  beach: {
    user: "bg-[#FF6B35] text-white",
    ai: "bg-white/95 text-gray-800 border border-orange-200 shadow-orange-100"
  },
  forest: {
    user: "bg-[#099773] text-white",
    ai: "bg-white/95 text-gray-800 border border-green-200 shadow-green-100"
  },
  sunset: {
    user: "bg-[#FF930F] text-white",
    ai: "bg-white/95 text-gray-800 border border-yellow-200 shadow-yellow-100"
  },
  twilight: {
    user: "bg-[#6B7FBD] text-white",
    ai: "bg-white/95 text-gray-800 border border-purple-200 shadow-purple-100"
  }
};

// ✅ UPDATED: Workshop-specific prompts
export const SUGGESTIONS = [
  "Why AI for Students",
  "Future Careers Powered by AI",
  "AI in Science Labs",
  "AI in Maths Mastery"
];

// ✅ NEW: Workshop greeting data
export const WORKSHOP_GREETING = {
  welcome: "Welcome to your AI-powered future, a hands-on workshop for curious students ready to explore the exciting world of artificial intelligence.",
  checklist: [
    {
      title: "Can you see my screen?",
      description: "Make sure audio and video are working perfectly for the best experience"
    },
    {
      title: "Questions welcome anytime!",
      description: "Pop your questions in the Q&A box—no question is too small or silly"
    },
    {
      title: "Get ready for surprises",
      description: "We'll keep this fun, interactive, and full of mind-blowing demos"
    }
  ],
  divein: "Let's dive in!"
};

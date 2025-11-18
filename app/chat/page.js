// claude page.js
"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Focus } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import FocusPlant from './components/FocusPlant';
// import MotivationalCard from './components/MotivationalCard';
import { motion } from "framer-motion";
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor,
  Palette,
  Type,
  Send,
  Mic,
  MicOff,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Volume2,
  FileText,
  Zap,
  Check,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Components OUTSIDE chat
import Header from "./header_components/Header";

// Components INSIDE chat
import LandingScreen from "./components/LandingScreen";
import ChatMessage from "./components/ChatMessage";
import InputArea from "./components/InputArea";
import SettingsModal from "./components/SettingsModal";

// Hooks INSIDE chat
import { useSettings } from "./hooks/useSettings";
import { useTTS } from "./hooks/useTTS";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useConfetti } from "./hooks/useConfetti";
import {X } from "lucide-react"; 

// Utils INSIDE chat
import { playSound } from "./utils/soundEffects";
import { exportToPDF } from "./utils/exportHelpers";
import {
  FONT_SIZE_MAP,
  FONT_FAMILY_MAP,
  BACKGROUND_MAP,
  WELCOME_GRADIENTS,
} from "./utils/constants";


export default function Home() {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [gradientIndex, setGradientIndex] = useState(0);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  // const [showMotivationalCard, setShowMotivationalCard] = useState(false);
  const [previewBackground, setPreviewBackground] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Custom Hooks
  const settings = useSettings();
  const { speak, cancel, speaking, availableVoices } = useTTS(settings.ttsSettings, settings.selectedVoice);
  const speechRecognition = useSpeechRecognition();
  const { triggerCelebration } = useConfetti();

  // Initialize
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setSessionDate(formattedDate);
    setGradientIndex(Math.floor(Math.random() * WELCOME_GRADIENTS.length));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea
  useEffect(() => {
    if (textareaRef.current && isFirstMessage) {
      textareaRef.current.focus();
    }
  }, [isFirstMessage]);

  // Handle speech recognition transcript
  useEffect(() => {
    if (speechRecognition.transcript) {
      setInput(prev => prev ? `${prev} ${speechRecognition.transcript}` : speechRecognition.transcript);
      speechRecognition.resetTranscript();
    }
  }, [speechRecognition.transcript]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (settings.bedtimeMode) return 'Good evening';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
const handlePreviewBackground = (bg) => {
    setPreviewBackground(bg);
  };
const handleSuggestionClick = (suggestion) => {
    if (settings.animationsEnabled) { // ✅ ADD THIS CONDITION
      triggerCelebration();
    } // ✅ END CONDITION
    playSound('success', settings.soundEffects);
    setInput(suggestion);
    
    setTimeout(() => {
      if (!suggestion.trim()) return;
      setIsFirstMessage(false);
      
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const userMessage = {
        role: 'human',
        type: 'text',
        content: suggestion,
        timestamp
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      sendToAI(newMessages);
    }, 300);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    playSound('send', settings.soundEffects);

    if (isFirstMessage) {
      setIsFirstMessage(false);
    }

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const userMessage = {
      role: 'human',
      type: 'text',
      content: input,
      timestamp
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendToAI(newMessages);
  };

  async function sendToAI(newMessages) {
  setLoading(true);
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/chat';

    const formattedMessages = newMessages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content.answer || JSON.stringify(msg.content),
      type: msg.type || 'text',
    }));

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_history: formattedMessages }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    const rawAnswer = data.answer || '🤖 I\'m here to help!';
    const responseType = data.type || 'text';

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let messageBlock;

    if (responseType === 'greeting') {
      messageBlock = { role: 'ai', type: 'greeting', content: rawAnswer, timestamp };
    } else if (responseType === 'decline') {
      messageBlock = { role: 'ai', type: 'decline', content: rawAnswer, timestamp };
    } else if (responseType === 'structured') {
      const parsed = parseStructuredAnswer(rawAnswer);
      messageBlock = { role: 'ai', type: 'structured', content: parsed, timestamp };
    } else {
      messageBlock = { role: 'ai', type: 'text', content: rawAnswer, timestamp };
    }

    setMessages((prev) => [...prev, messageBlock]);
    playSound('success', settings.soundEffects);
  } catch (error) {
    console.error('[ERROR]', error);
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        type: 'error',
        content: '⚠️ Oops! Couldn\'t connect to AI Shine\'s server.',
        timestamp
      },
    ]);
    toast.error('Failed to connect to server');
  } finally {
    setLoading(false);
  }
}

  const markdownToHtml = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>');             // *italic*
  };
  function parseStructuredAnswer(rawAnswer) {
    const parts = rawAnswer.split(/\*\*Key Points:\*\*|<strong>Key Points:<\/strong>/i);

    if (parts.length === 2) {
      const answerPart = parts[0].replace(/\*\*Answer:\*\*|<strong>Answer:<\/strong>/gi, '').trim();
      const keyPointsPart = parts[1].trim();

      const keyPoints = keyPointsPart
        .split(/\n|<li>/)
        .map((line) => line.replace(/<\/?[^>]+(>|$)/g, '').replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);

      return { answer: answerPart, keyPoints };
    }

    return { answer: rawAnswer, keyPoints: [] };
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const maxHeight = 200;
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
    e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    setIsFirstMessage(true);
    setFeedback({});
    setGradientIndex(Math.floor(Math.random() * WELCOME_GRADIENTS.length));
    playSound('click', settings.soundEffects);
    toast.success('Chat cleared!');
  };

  const handleFeedback = (messageIndex, type) => {
  setFeedback(prev => {
    const newFeedback = { ...prev };
    if (newFeedback[messageIndex] === type) {
      // Reset if clicking same button
      delete newFeedback[messageIndex];
    } else {
      newFeedback[messageIndex] = type;
    }
    return newFeedback;
  });
  
  playSound('click', settings.soundEffects);
  
  if (type !== null) {
    toast.success('Thanks for your feedback!');
    
    const storedFeedback = JSON.parse(localStorage.getItem('aiFeedback') || '[]');
    storedFeedback.push({
      messageIndex,
      type,
      timestamp: new Date().toISOString(),
      message: messages[messageIndex]?.content
    });
    localStorage.setItem('aiFeedback', JSON.stringify(storedFeedback));
  }
};

  const handleCopy = (content, index) => {
    const textToCopy = typeof content === 'string' 
      ? content 
      : content.answer + '\n\nKey Points:\n' + content.keyPoints?.join('\n');
    navigator.clipboard.writeText(textToCopy.replace(/<[^>]*>/g, ''));
    setCopiedIndex(index);
    playSound('success', settings.soundEffects);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (content) => {
    if (speaking) {
      cancel();
    } else {
      const textToSpeak = typeof content === 'string' 
        ? content.replace(/<[^>]*>/g, '') 
        : content.answer.replace(/<[^>]*>/g, '') + '. Key Points: ' + content.keyPoints?.join('. ');
      speak(textToSpeak);
    }
  };

  const handleShare = async (content) => {
    playSound('click', settings.soundEffects);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Shine Response',
          text: typeof content === 'string' ? content.replace(/<[^>]*>/g, '') : content.answer.replace(/<[^>]*>/g, ''),
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast.error('Sharing not supported on this browser');
    }
  };

  const handleExportPDF = async () => {
    playSound('click', settings.soundEffects);
    toast.loading('Generating PDF...');
    
    try {
      await exportToPDF(messages, sessionDate);
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error('PDF error:', error);
    }
  };

  const toggleListening = () => {
    if (speechRecognition.listening) {
      speechRecognition.stopListening();
    } else {
      const started = speechRecognition.startListening();
      if (started) {
        playSound('click', settings.soundEffects);
      } else {
        toast.error('Speech recognition not supported in this browser. Try Chrome or Edge.');
      }
    }
  };

  return (
 <>
    {/* <Toaster position="top-center" />
    <MotivationalCard 
      show={showMotivationalCard} 
      onClose={() => setShowMotivationalCard(false)} 
    /> */}
    
<main className={`fixed inset-0 flex flex-col transition-all duration-500 ${
      settings.focusMode 
        ? 'bg-gray-900' // ✅ Dark base for focus mode
        : settings.bedtimeMode
          ? `${BACKGROUND_MAP[previewBackground || settings.background]} brightness-75 saturate-50`
          : BACKGROUND_MAP[previewBackground || settings.background]
    }`}>
      
      {/* Focus Mode Background - Dark Blurry Glass */}
      {settings.focusMode && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/70 to-black/80 backdrop-blur-3xl -z-10" />
      )}
      
      {/* Focus Mode Background */}
{/* Focus Mode Background - Premium Glass with Noise */}
      {settings.focusMode && (
        <>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl -z-10" />
          <div 
            className="absolute inset-0 opacity-[0.015] -z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />
        </>
      )}

      {/* Dark overlay for bedtime/dark mode */}
      {settings.isDarkMode && !settings.focusMode && (
        <div className="fixed inset-0 bg-black/80 z-0" />
      )}

      {/* Settings Modal */}
      <SettingsModal
        show={showSettings}
        onClose={() => {
          setShowSettings(false);
          setPreviewBackground(null); // ✅ ADD THIS LINE
        }}
        settings={settings}
        availableVoices={availableVoices}
        playSound={(type) => playSound(type, settings.soundEffects)}
        onPreviewBackground={handlePreviewBackground} // ✅ ADD THIS LINE
      />

      {/* Landing Screen */}
      {isFirstMessage && (
        <LandingScreen
          greeting={getGreeting()}
          gradientIndex={gradientIndex}
          hoveredSuggestion={hoveredSuggestion}
          setHoveredSuggestion={setHoveredSuggestion}
          onSuggestionClick={handleSuggestionClick}
          animationsEnabled={settings.animationsEnabled}
        />
      )}

      {/* Header - Pass bedtimeMode and focusMode */}
{!isFirstMessage && (
  <Header
    onClearChat={handleClearChat}
    onExportPDF={handleExportPDF}
    // onOpenMotivation={() => setShowMotivationalCard(true)}
    focusMode={settings.focusMode}
    bedtimeMode={settings.bedtimeMode}
    setFocusMode={settings.setFocusMode}
    playSound={(type) => playSound(type, settings.soundEffects)}
    currentBackground={previewBackground || settings.background}
    onResetToLanding={() => { // ✅ ADD THIS
      setMessages([]);
      setInput('');
      setIsFirstMessage(true);
      setFeedback({});
      playSound('click', settings.soundEffects);
    }}
  />
)}

      {/* Focus Mode Header */}
 {settings.focusMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            settings.setFocusMode(false);
            playSound('click', settings.soundEffects);
            toast.success('Focus mode disabled');
          }}
          className="fixed top-5 right-5 bg-white/10 hover:bg-white/15 backdrop-blur-2xl border border-white/20 px-3 py-1.5 rounded-full text-white text-sm font-medium z-50 flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </motion.button>
      )}

      {/* Chat Section */}
      {!isFirstMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative flex-grow overflow-y-auto px-4 md:px-5 py-6 space-y-5 scrollbar-hide ${
            FONT_FAMILY_MAP[settings.fontFamily]
          } ${FONT_SIZE_MAP[settings.fontSize]} ${
            settings.fontWeight === 'bold' ? 'font-bold' : settings.fontWeight === 'italic' ? 'italic' : ''
          } ${settings.focusMode ? 'z-10' : ''}`}
        >
          
          {/* Session Date */}
          <div className="flex justify-center mb-4">
            <div className={`px-4 py-1 rounded-full text-xs font-medium ${
              settings.focusMode 
                ? 'bg-white/10 text-white backdrop-blur-md'
                : settings.bedtimeMode
                  ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-gray-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {sessionDate}
            </div>
          </div>

          <AnimatePresence>
            {messages.map((msg, idx) => (
<ChatMessage
  key={idx}
  message={msg}
  index={idx}
  isUser={msg.role === 'human'}
  feedback={feedback}
  copiedIndex={copiedIndex}
  speaking={speaking}
  onFeedback={handleFeedback}
  onCopy={handleCopy}
  onSpeak={settings.ttsEnabled ? handleSpeak : () => toast.error('TTS is disabled')}
  onShare={handleShare}
  fontSizeMap={FONT_SIZE_MAP}
  fontSize={settings.fontSize}
  focusMode={settings.focusMode}
  bedtimeMode={settings.bedtimeMode}
  currentBackground={settings.background} // ✅ ADD THIS
/>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className={`px-4 md:px-5 py-3 rounded-2xl font-semibold shadow-md flex items-center gap-3 ${
                settings.focusMode
                  ? 'bg-white/10 text-white backdrop-blur-md'
                  : settings.bedtimeMode
                    ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-gray-700'
                    : 'bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white'
              }`}>
                <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>🤔 AI Shine is thinking...</span>
              </div>
            </div>
          )}
<div ref={messagesEndRef} />
        </motion.div>
      )}

      {/* Input Area */}
      <InputArea
        input={input}
        setInput={setInput}
        loading={loading}
        listening={speechRecognition.listening}
        isFirstMessage={isFirstMessage}
        focusMode={settings.focusMode}
        bedtimeMode={settings.bedtimeMode}
        textareaRef={textareaRef}
        fontFamilyMap={FONT_FAMILY_MAP}
        fontFamily={settings.fontFamily}
        fontSizeMap={FONT_SIZE_MAP}
        fontSize={settings.fontSize}
        onSend={sendMessage}
        onToggleListening={toggleListening}
        onOpenSettings={() => {
          setShowSettings(true);
          playSound('click', settings.soundEffects);
        }}
        onTextareaChange={handleTextareaChange}
        animationsEnabled={settings.animationsEnabled}
      />
    </main>
  </>
);
}






































// gpt

// "use client";
// import ReactMarkdown from "react-markdown";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Header from "../../../components/Header";
// import { motion, AnimatePresence } from "framer-motion";

// export default function Home() {
//   const [messages, setMessages] = useState([
//     {
//       role: "ai",
//       type: "text",
//       content:
//         "👋 Hello! I’m **AI Shine**, your friendly AI assistant. Ask me anything about Artificial Intelligence or Machine Learning!",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [listening, setListening] = useState(false);
//   const recognitionRef = useRef(null);

//   // ✅ Speech setup
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = false;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.lang = "en-IN";

//         recognitionRef.current.onresult = (event) => {
//           const transcript = event.results[0][0].transcript;
//           setInput((prev) => (prev ? prev + " " + transcript : transcript));
//           setListening(false);
//         };
//         recognitionRef.current.onend = () => setListening(false);
//       }
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition not supported in this browser.");
//       return;
//     }
//     if (listening) recognitionRef.current.stop();
//     else recognitionRef.current.start();
//     setListening(!listening);
//   };

//   // ✅ Auto-scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // ✅ Send message
//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { role: "human", type: "text", content: input };
//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
//     await sendToAI(newMessages);
//   };

//   // ✅ Call backend
// async function sendToAI(newMessages) {
// setLoading(true);
// try {
// const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL, {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ chat_history: newMessages }),
// });

//       const data = await res.json();
//       const raw = data.answer || "🤖 I’m here to help!";

//       // === Format handling ===
//       let messageBlock;
//       if (raw.startsWith("❌")) {
//         messageBlock = {
//           role: "ai",
//           type: "decline",
//           content: raw,
//         };
//       } else {
//         const [answerPart, keyPointsPart] = raw.split("**Key Points:**");
//         messageBlock = {
//           role: "ai",
//           type: "structured",
//           answer: extractSection(answerPart, "Answer"),
//           keyPoints: keyPointsPart
//             ? keyPointsPart
//                 .split("\n")
//                 .map((p) => p.replace(/[-*•]\s?/g, "").trim())
//                 .filter(Boolean)
//             : [],
//         };
//       }
//       setMessages((prev) => [...prev, messageBlock]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           type: "error",
//           content: "⚠️ Oops! Couldn’t connect to AI Shine’s server.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function extractSection(text, title) {
//     if (!text) return "";
//     return text.replace(`**${title}:**`, "").trim();
//   }

//   // ✅ Input handling
//   const handleTextareaChange = (e) => {
//     setInput(e.target.value);
//     const maxHeight = 200;
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
//     e.target.style.overflowY =
//       e.target.scrollHeight > maxHeight ? "auto" : "hidden";
//   };

//   const handleClearChat = () => {
//     setMessages([
//       {
//         role: "ai",
//         type: "text",
//         content: "✨ Hi again! I’m **AI Shine** — ready for a fresh AI chat!",
//       },
//     ]);
//     setInput("");
//   };

//   return (
//     <main className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
//       {/* Header */}
//       <div className="z-20 bg-gradient-to-r from-[#071C39] via-[#0B3266] to-[#134F95] text-white shadow-md flex-shrink-0">
//         <Header onClearChat={handleClearChat} />
//       </div>

//       {/* Chat Section */}
//       <div className="flex-grow overflow-y-auto px-5 py-6 space-y-5 scrollbar-hide">
//         <div className="flex justify-center my-2">
//           <div className="bg-white/60 text-gray-700 text-xs font-semibold px-4 py-1 rounded-full shadow-sm backdrop-blur-md">
//             {new Date().toLocaleDateString("en-US")}
//           </div>
//         </div>

//         <AnimatePresence>
//           {messages.map((msg, idx) => {
//             const isUser = msg.role === "human";
//             return (
//               <motion.div
//                 key={idx}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.3 }}
//                 className={`flex flex-col ${
//                   isUser ? "items-end" : "items-start"
//                 } space-y-1`}
//               >
//                 {/* Avatar Row */}
//                 <div
//                   className={`flex items-center gap-2 mb-1 ${
//                     isUser ? "flex-row-reverse pr-2" : "flex-row pl-2"
//                   }`}
//                 >
//                   <div
//                     className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
//                       isUser
//                         ? "bg-gray-500"
//                         : "bg-gradient-to-r from-blue-600 to-green-400"
//                     }`}
//                   >
//                     <span>{isUser ? "👤" : "🤖"}</span>
//                   </div>
//                   <span
//                     className={`text-xs font-semibold ${
//                       isUser ? "text-gray-700" : "text-blue-600"
//                     }`}
//                   >
//                     {isUser ? "You" : "AI Shine"}
//                   </span>
//                 </div>

//                 {/* Message Bubble */}
//                 {msg.type === "decline" ? (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     className="max-w-[80%] bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500 text-red-800 px-5 py-3 rounded-lg shadow-sm"
//                   >
//                     <div className="font-semibold mb-1">⚠️ System Notice</div>
//                     <p className="text-sm">{msg.content}</p>
//                   </motion.div>
//                 ) : msg.type === "structured" ? (
//                   <motion.div
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="max-w-[80%] bg-white text-gray-800 px-5 py-4 rounded-2xl shadow-lg border border-gray-200 transition-transform hover:scale-[1.01]"
//                   >
//                     <h4 className="font-semibold text-blue-700 mb-1">Answer</h4>
//                     <p className="text-sm text-gray-700 mb-3 leading-relaxed">
//                       {msg.answer}
//                     </p>
//                     {msg.keyPoints.length > 0 && (
//                       <>
//                         <h4 className="font-semibold text-green-700 mb-1">
//                           Key Points
//                         </h4>
//                         <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
//                           {msg.keyPoints.map((p, i) => (
//                             <li key={i}>{p}</li>
//                           ))}
//                         </ul>
//                       </>
//                     )}
//                   </motion.div>
//                 ) : (
//                   <div
//                     className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm md:text-base shadow-md ${
//                       isUser
//                         ? "bg-[#334155]/80 text-white rounded-br-none"
//                         : "bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-bl-none"
//                     }`}
//                   >
//                     <ReactMarkdown>{msg.content}</ReactMarkdown>
//                   </div>
//                 )}
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>

//         {loading && (
//           <div className="flex justify-start animate-pulse">
//             <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md flex items-center gap-3">
//               <svg
//                 className="w-5 h-5 animate-spin"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                 />
//               </svg>
//               <span>🤔 AI Shine is thinking...</span>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Area */}
//       <div className="bg-[#E8EEF6] border-t border-gray-300 p-4 flex gap-3 items-end flex-shrink-0">
//         <textarea
//           className="flex-grow bg-white text-gray-800 placeholder:text-gray-500 px-4 py-3 rounded-2xl resize-none min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#0B3266] transition-all duration-200"
//           placeholder="Type your AI question or use mic..."
//           rows="1"
//           value={input}
//           onChange={handleTextareaChange}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               sendMessage();
//             }
//           }}
//         />

//         {/* Mic */}
//         <button
//           className={`rounded-full p-3 flex-shrink-0 shadow-md transition-transform ${
//             listening
//               ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//               : "bg-gray-500 hover:scale-105"
//           }`}
//           onClick={toggleListening}
//           title={listening ? "Listening..." : "Tap to Speak"}
//         >
//           <Image src="/icons/mic.svg" width={22} height={22} alt="mic" className="invert" />
//         </button>

//         {/* Send */}
//         <button
//           className="bg-gradient-to-r from-[#0B3266] to-[#134F95] rounded-full p-3 flex-shrink-0 shadow-md hover:scale-105 transition-transform"
//           onClick={sendMessage}
//         >
//           <Image src="/icons/submit.svg" width={22} height={22} alt="send" className="invert-0" />
//         </button>
//       </div>
//     </main>
//   );
// }





// claude DEPLOYED CODE
// "use client";
// import ReactMarkdown from "react-markdown";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Header from "../../components/Header";
// import { motion, AnimatePresence } from "framer-motion";

// export default function Home() {
//   const [messages, setMessages] = useState([
//     {
//       role: "ai",
//       type: "greeting",
//       content:
//         "👋 Hello! I'm **AI Shine**, your friendly AI assistant. Ask me anything about Artificial Intelligence or Machine Learning!",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [listening, setListening] = useState(false);
//   const recognitionRef = useRef(null);

//   // Speech recognition setup
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = false;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.lang = "en-IN";

//         recognitionRef.current.onresult = (event) => {
//           const transcript = event.results[0][0].transcript;
//           setInput((prev) => (prev ? prev + " " + transcript : transcript));
//           setListening(false);
//         };
//         recognitionRef.current.onend = () => setListening(false);
//       }
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition not supported in this browser.");
//       return;
//     }
//     if (listening) recognitionRef.current.stop();
//     else recognitionRef.current.start();
//     setListening(!listening);
//   };

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Send message
//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const userMessage = { role: "human", type: "text", content: input };
//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
//     await sendToAI(newMessages);
//   };

//   // Call backend API
//   async function sendToAI(newMessages) {
//     setLoading(true);
//     try {
//       const backendUrl =
//         process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/chat";

//       // Format messages for backend
//       const formattedMessages = newMessages.map((msg) => ({
//         role: msg.role,
//         content:
//           typeof msg.content === "string"
//             ? msg.content
//             : msg.content.answer || JSON.stringify(msg.content),
//         type: msg.type || "text",
//       }));

//       const res = await fetch(backendUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ chat_history: formattedMessages }),
//       });

//       if (!res.ok) {
//         throw new Error(`Backend returned ${res.status}`);
//       }

//       const data = await res.json();
//       const rawAnswer = data.answer || "🤖 I'm here to help!";
//       const responseType = data.type || "text";

//       // Build message block based on type
//       let messageBlock;

//       if (responseType === "greeting") {
//         messageBlock = {
//           role: "ai",
//           type: "greeting",
//           content: rawAnswer,
//         };
//       } else if (responseType === "decline") {
//         messageBlock = {
//           role: "ai",
//           type: "decline",
//           content: rawAnswer,
//         };
//       } else if (responseType === "structured") {
//         // Parse structured response
//         const parsed = parseStructuredAnswer(rawAnswer);
//         messageBlock = {
//           role: "ai",
//           type: "structured",
//           content: parsed,
//         };
//       } else {
//         // Plain text
//         messageBlock = {
//           role: "ai",
//           type: "text",
//           content: rawAnswer,
//         };
//       }

//       setMessages((prev) => [...prev, messageBlock]);
//     } catch (error) {
//       console.error("[ERROR]", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           type: "error",
//           content: "⚠️ Oops! Couldn't connect to AI Shine's server.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Parse structured answer from backend
//   function parseStructuredAnswer(rawAnswer) {
//     const parts = rawAnswer.split("**Key Points:**");

//     if (parts.length === 2) {
//       const answerPart = parts[0].replace("**Answer:**", "").trim();
//       const keyPointsPart = parts[1].trim();

//       const keyPoints = keyPointsPart
//         .split("\n")
//         .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
//         .filter(Boolean);

//       return {
//         answer: answerPart,
//         keyPoints: keyPoints,
//       };
//     }

//     // No structure detected
//     return {
//       answer: rawAnswer,
//       keyPoints: [],
//     };
//   }

//   // Textarea auto-resize
//   const handleTextareaChange = (e) => {
//     setInput(e.target.value);
//     const maxHeight = 200;
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
//     e.target.style.overflowY =
//       e.target.scrollHeight > maxHeight ? "auto" : "hidden";
//   };

//   // Clear chat
//   const handleClearChat = () => {
//     setMessages([
//       {
//         role: "ai",
//         type: "greeting",
//         content: "✨ Hi again! I'm **AI Shine** — ready for a fresh AI chat!",
//       },
//     ]);
//     setInput("");
//   };

//   return (
//     <main className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
//       {/* Header */}
//       <div className="z-20 bg-gradient-to-r from-[#071C39] via-[#0B3266] to-[#134F95] text-white shadow-md flex-shrink-0">
//         <Header onClearChat={handleClearChat} />
//       </div>

//       {/* Chat Section */}
//       <div className="flex-grow overflow-y-auto px-5 py-6 space-y-5 scrollbar-hide">
//         <div className="flex justify-center my-2">
//           <div className="bg-white/60 text-gray-700 text-xs font-semibold px-4 py-1 rounded-full shadow-sm backdrop-blur-md">
//             {new Date().toLocaleDateString("en-US")}
//           </div>
//         </div>

//         <AnimatePresence>
//           {messages.map((msg, idx) => {
//             const isUser = msg.role === "human";
//             return (
//               <motion.div
//                 key={idx}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.3 }}
//                 className={`flex flex-col ${
//                   isUser ? "items-end" : "items-start"
//                 } space-y-1`}
//               >
//                 {/* Avatar Row */}
//                 <div
//                   className={`flex items-center gap-2 mb-1 ${
//                     isUser ? "flex-row-reverse pr-2" : "flex-row pl-2"
//                   }`}
//                 >
//                   <div
//                     className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
//                       isUser
//                         ? "bg-gray-500"
//                         : "bg-gradient-to-r from-blue-600 to-green-400"
//                     }`}
//                   >
//                     <span>{isUser ? "👤" : "🤖"}</span>
//                   </div>
//                   <span
//                     className={`text-xs font-semibold ${
//                       isUser ? "text-gray-700" : "text-blue-600"
//                     }`}
//                   >
//                     {isUser ? "You" : "AI Shine"}
//                   </span>
//                 </div>

//                 {/* Message Bubble */}
//                 {msg.type === "decline" || msg.type === "error" ? (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     className="max-w-[80%] bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500 text-red-800 px-5 py-3 rounded-lg shadow-sm"
//                   >
//                     <div className="font-semibold mb-1">⚠️ System Notice</div>
//                     <ReactMarkdown className="text-sm">{msg.content}</ReactMarkdown>
//                   </motion.div>
//                 ) : msg.type === "structured" ? (
//                   <motion.div
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="max-w-[80%] bg-white text-gray-800 px-5 py-4 rounded-2xl shadow-lg border border-gray-200 transition-transform hover:scale-[1.01]"
//                   >
//                     <h4 className="font-semibold text-blue-700 mb-2">Answer</h4>
//                     <div className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">
//                       <ReactMarkdown>{msg.content.answer}</ReactMarkdown>
//                     </div>
//                     {msg.content.keyPoints && msg.content.keyPoints.length > 0 && (
//                       <>
//                         <h4 className="font-semibold text-green-700 mb-2">
//                           Key Points
//                         </h4>
//                         <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
//                           {msg.content.keyPoints.map((kp, i) => (
//                             <li key={i}>{kp}</li>
//                           ))}
//                         </ul>
//                       </>
//                     )}
//                   </motion.div>
//                 ) : (
//                   <div
//                     className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm md:text-base shadow-md ${
//                       isUser
//                         ? "bg-[#334155]/80 text-white rounded-br-none"
//                         : "bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-bl-none"
//                     }`}
//                   >
//                     <ReactMarkdown>{msg.content}</ReactMarkdown>
//                   </div>
//                 )}
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>

//         {loading && (
//           <div className="flex justify-start animate-pulse">
//             <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md flex items-center gap-3">
//               <svg
//                 className="w-5 h-5 animate-spin"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                 />
//               </svg>
//               <span>🤔 AI Shine is thinking...</span>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Area */}
//       <div className="bg-[#E8EEF6] border-t border-gray-300 p-4 flex gap-3 items-end flex-shrink-0">
//         <textarea
//           className="flex-grow bg-white text-gray-800 placeholder:text-gray-500 px-4 py-3 rounded-2xl resize-none min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#0B3266] transition-all duration-200"
//           placeholder="Type your AI question or use mic..."
//           rows="1"
//           value={input}
//           onChange={handleTextareaChange}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               sendMessage();
//             }
//           }}
//         />

//         {/* Mic Button */}
//         <button
//           className={`rounded-full p-3 flex-shrink-0 shadow-md transition-transform ${
//             listening
//               ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//               : "bg-gray-500 hover:scale-105"
//           }`}
//           onClick={toggleListening}
//           title={listening ? "Listening..." : "Tap to Speak"}
//         >
//           <Image
//             src="/icons/mic.svg"
//             width={22}
//             height={22}
//             alt="mic"
//             className="invert"
//           />
//         </button>

//         {/* Send Button */}
//         <button
//           className="bg-gradient-to-r from-[#0B3266] to-[#134F95] rounded-full p-3 flex-shrink-0 shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
//           onClick={sendMessage}
//           disabled={loading || !input.trim()}
//         >
//           <Image
//             src="/icons/submit.svg"
//             width={22}
//             height={22}
//             alt="send"
//             className="invert-0"
//           />
//         </button>
//       </div>
//     </main>
//   );
// }


















































// user this code, it works well.
// "use client";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Header from "../../components/Header";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Settings, 
//   Sun, 
//   Moon, 
//   Monitor,
//   Palette,
//   Type,
//   Send,
//   Mic,
//   MicOff,
//   Sparkles
// } from "lucide-react";
// import { Clicker_Script } from "next/font/google";

// export default function Home() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isFirstMessage, setIsFirstMessage] = useState(true);
//   const [listening, setListening] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [sessionDate, setSessionDate] = useState("");
  
//   // Settings state
//   const [theme, setTheme] = useState("system");
//   const [fontSize, setFontSize] = useState("M");
//   const [fontFamily, setFontFamily] = useState("standard");
//   const [background, setBackground] = useState("doodles");
//   const [fontWeight, setFontWeight] = useState("regular");
  
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Set session date on mount
//   useEffect(() => {
//     const today = new Date();
//     const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
//     setSessionDate(formattedDate);
//   }, []);

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return "Good morning";
//     if (hour < 18) return "Good afternoon";
//     return "Good evening";
//   };

//   const fontSizeMap = {
//     XS: "text-xs",
//     S: "text-sm",
//     M: "text-base",
//     L: "text-lg",
//     XL: "text-xl"
//   };

//   const fontFamilyMap = {
//     standard: "font-sans",
//     // roboto: "font-['Roboto',sans-serif]",
//     // dyslexic: "font-['OpenDyslexic',sans-serif]",
//     lexend: "font-['Lexend',sans-serif]",
//     times: "font-serif"
//   };

//   const backgroundMap = {
//     doodles: "bg-[url('/assets/bg_doodles.png')] bg-cover bg-center",
//     gradient1: "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
//     gradient2: "bg-gradient-to-br from-green-400 via-teal-500 to-blue-500",
//     gradient3: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600",
//     gradient4: "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500"
//   };

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
    
//     const root = document.documentElement;
//     const applyTheme = () => {
//       const shouldBeDark = theme === "dark" || 
//         (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
//       setIsDarkMode(shouldBeDark);
      
//       if (shouldBeDark) {
//         root.classList.add("dark");
//       } else {
//         root.classList.remove("dark");
//       }
//     };

//     applyTheme();

//     if (theme === "system") {
//       const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//       mediaQuery.addEventListener('change', applyTheme);
//       return () => mediaQuery.removeEventListener('change', applyTheme);
//     }
//   }, [theme]);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = false;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.lang = "en-IN";

//         recognitionRef.current.onresult = (event) => {
//           const transcript = event.results[0][0].transcript;
//           setInput((prev) => (prev ? prev + " " + transcript : transcript));
//           setListening(false);
//         };
//         recognitionRef.current.onend = () => setListening(false);
//       }
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition not supported in this browser.");
//       return;
//     }
//     if (listening) {
//       recognitionRef.current.stop();
//     } else {
//       recognitionRef.current.start();
//     }
//     setListening(!listening);
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     if (textareaRef.current && isFirstMessage) {
//       textareaRef.current.focus();
//     }
//   }, [isFirstMessage]);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     if (isFirstMessage) {
//       setIsFirstMessage(false);
//     }

//     const timestamp = new Date().toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit"
//     });

//     const userMessage = {
//       role: "human",
//       type: "text",
//       content: input,
//       timestamp
//     };

//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
    
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }

//     await sendToAI(newMessages);
//   };

//   async function sendToAI(newMessages) {
//     setLoading(true);
//     try {
//       const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/chat";

//       const formattedMessages = newMessages.map((msg) => ({
//         role: msg.role,
//         content: typeof msg.content === "string" ? msg.content : msg.content.answer || JSON.stringify(msg.content),
//         type: msg.type || "text",
//       }));

//       const res = await fetch(backendUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ chat_history: formattedMessages }),
//       });

//       if (!res.ok) {
//         throw new Error(`Backend returned ${res.status}`);
//       }

//       const data = await res.json();
//       const rawAnswer = data.answer || "🤖 I'm here to help!";
//       const responseType = data.type || "text";

//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit"
//       });

//       let messageBlock;

//       if (responseType === "greeting") {
//         messageBlock = {
//           role: "ai",
//           type: "greeting",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "decline") {
//         messageBlock = {
//           role: "ai",
//           type: "decline",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "structured") {
//         const parsed = parseStructuredAnswer(rawAnswer);
//         messageBlock = {
//           role: "ai",
//           type: "structured",
//           content: parsed,
//           timestamp
//         };
//       } else {
//         messageBlock = {
//           role: "ai",
//           type: "text",
//           content: rawAnswer,
//           timestamp
//         };
//       }

//       setMessages((prev) => [...prev, messageBlock]);
//     } catch (error) {
//       console.error("[ERROR]", error);
//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit"
//       });
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           type: "error",
//           content: "⚠️ Oops! Couldn't connect to AI Shine's server.",
//           timestamp
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function parseStructuredAnswer(rawAnswer) {
//     const parts = rawAnswer.split(/\*\*Key Points:\*\*|<strong>Key Points:<\/strong>/i);

//     if (parts.length === 2) {
//       const answerPart = parts[0].replace(/\*\*Answer:\*\*|<strong>Answer:<\/strong>/gi, "").trim();
//       const keyPointsPart = parts[1].trim();

//       const keyPoints = keyPointsPart
//         .split(/\n|<li>/)
//         .map((line) => line.replace(/<\/?[^>]+(>|$)/g, "").replace(/^[•\-\*]\s*/, "").trim())
//         .filter(Boolean);

//       return {
//         answer: answerPart,
//         keyPoints: keyPoints,
//       };
//     }

//     return {
//       answer: rawAnswer,
//       keyPoints: [],
//     };
//   }

//   const handleTextareaChange = (e) => {
//     setInput(e.target.value);
//     const maxHeight = 200;
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
//     e.target.style.overflowY = e.target.scrollHeight > maxHeight ? "auto" : "hidden";
//   };

//   const handleClearChat = () => {
//     setMessages([]);
//     setInput("");
//     setIsFirstMessage(true);
//   };

//   const suggestions = [
//     "What is the CRAFT prompting framework?",
//     "How does AI help in creativity?",
//     "Explain machine learning to a beginner",
//     "What are the golden rules for using AI?"
//   ];

//   return (
//     <main className={`fixed inset-0 flex flex-col ${backgroundMap[background]} transition-all duration-300`}>
//       {isDarkMode && (
//         <div className="fixed inset-0 bg-black/80 z-0" />
//       )}

//       <AnimatePresence>
//         {showSettings && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
//             onClick={() => setShowSettings(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               onClick={(e) => e.stopPropagation()}
//               className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                   <Settings className="w-6 h-6" />
//                   Settings
//                 </h2>
//                 <button
//                   onClick={() => setShowSettings(false)}
//                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Theme
//                 </label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {[
//                     { value: "light", icon: Sun, label: "Light" },
//                     { value: "dark", icon: Moon, label: "Dark" },
//                     { value: "system", icon: Monitor, label: "System" }
//                   ].map((t) => (
//                     <button
//                       key={t.value}
//                       onClick={() => setTheme(t.value)}
//                       className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
//                         theme === t.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
//                       }`}
//                     >
//                       <t.icon className="w-5 h-5" />
//                       <span className="text-xs">{t.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Font Size
//                 </label>
//                 <div className="flex gap-2">
//                   {["XS", "S", "M", "L", "XL"].map((size) => (
//                     <button
//                       key={size}
//                       onClick={() => setFontSize(size)}
//                       className={`flex-1 py-2 rounded-lg border-2 transition-all ${
//                         fontSize === size
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Font Family
//                 </label>
//                 <select
//                   value={fontFamily}
//                   onChange={(e) => setFontFamily(e.target.value)}
//                   className="w-full p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
//                 >
//                   <option value="standard">Standard (Sans-serif)</option>
//                   <option value="roboto">Roboto</option>
//                   {/* <option value="dyslexic">OpenDyslexic</option> */}
//                   <option value="lexend">Lexend (for dyslexia)</option>
//                   <option value="times">Times New Roman</option>
//                 </select>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                   <Palette className="w-4 h-4" />
//                   Background
//                 </label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {[
//                     { value: "doodles", label: "Doodles" },
//                     { value: "gradient1", label: "Gradient 1" },
//                     { value: "gradient2", label: "Gradient 2" },
//                     { value: "gradient3", label: "Gradient 3" },
//                     { value: "gradient4", label: "Gradient 4" }
//                   ].map((bg) => (
//                     <button
//                       key={bg.value}
//                       onClick={() => setBackground(bg.value)}
//                       className={`p-3 rounded-lg border-2 transition-all ${
//                         background === bg.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {bg.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                   <Type className="w-4 h-4" />
//                   Font Weight
//                 </label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {[
//                     { value: "regular", label: "Regular" },
//                     { value: "bold", label: "Bold" },
//                     { value: "italic", label: "Italic" }
//                   ].map((fw) => (
//                     <button
//                       key={fw.value}
//                       onClick={() => setFontWeight(fw.value)}
//                       className={`p-2 rounded-lg border-2 transition-all ${
//                         fontWeight === fw.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {fw.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {isFirstMessage && (
//         <motion.div
//           initial={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-10 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
//         >
//           <motion.div
//             initial={{ y: -20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.2 }}
//             className="text-center mb-8"
//           >
//             <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
//               {getGreeting()}
//             </h1>
//             <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
//               What would you like to ask <strong>AI-SHINE</strong> today?
//             </p>
//           </motion.div>

//           <motion.div
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.4 }}
//             className="w-full max-w-2xl"
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
//               {suggestions.map((suggestion, idx) => (
//                 <motion.button
//                   key={idx}
//                   initial={{ y: 20, opacity: 0 }}
//                   animate={{ y: 0, opacity: 1 }}
//                   transition={{ delay: 0.5 + idx * 0.1 }}
//                   onClick={() => {
//                     setInput(suggestion);
//                     setTimeout(() => {
//                       const syntheticInput = suggestion;
//                       if (!syntheticInput.trim()) return;
//                       setIsFirstMessage(false);
//                       const timestamp = new Date().toLocaleTimeString("en-US", {
//                         hour: "2-digit",
//                         minute: "2-digit"
//                       });
//                       const userMessage = {
//                         role: "human",
//                         type: "text",
//                         content: syntheticInput,
//                         timestamp
//                       };
//                       const newMessages = [...messages, userMessage];
//                       setMessages(newMessages);
//                       setInput("");
//                       sendToAI(newMessages);
//                     }, 50);
//                   }}
//                   className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg text-left group"
//                 >
//                   <div className="flex items-start gap-3">
//                     <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
//                     <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
//                   </div>
//                 </motion.button>
//               ))}
//             </div>
//           </motion.div>
//         </motion.div>
//       )}

//       {!isFirstMessage && (
//         <div className="relative z-20 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white shadow-md flex-shrink-0">
//           <Header onClearChat={handleClearChat} />
//         </div>
//       )}

//       {!isFirstMessage && (
//         <div className={`relative flex-grow overflow-y-auto px-4 md:px-5 py-6 space-y-5 scrollbar-hide ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]} ${fontWeight === 'bold' ? 'font-bold' : fontWeight === 'italic' ? 'italic' : ''}`}>
//           {/* Session Date */}
//           <div className="flex justify-center mb-4">
//             <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
//               {sessionDate}
//             </div>
//           </div>

//           <AnimatePresence>
//             {messages.map((msg, idx) => {
//               const isUser = msg.role === "human";
//               return (
//                 <motion.div
//                   key={idx}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.3 }}
//                   className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//                 >
//                   <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-2 max-w-[85%] md:max-w-[80%]`}>
//                     <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"}`}>
//                       <span className="text-white text-lg">
//                         {isUser ? "👤" : "🤖"}
//                       </span>
//                     </div>

//                     <div className="flex flex-col gap-1">
//                       {msg.type === "decline" || msg.type === "error" ? (
//                         <motion.div
//                           initial={{ opacity: 0, scale: 0.9 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-800 dark:text-red-200 px-4 md:px-5 py-3 rounded-lg shadow-sm relative"
//                         >
//                           <div className="font-semibold mb-1">⚠️ System Notice</div>
//                           <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
//                           <div className="text-[10px] text-red-600 dark:text-red-300 mt-2 text-right">
//                             {msg.timestamp}
//                           </div>
//                         </motion.div>
//                       ) : msg.type === "structured" ? (
//                         <motion.div
//                           initial={{ opacity: 0, y: 10 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 md:px-5 py-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.01] relative"
//                         >
//                           <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Answer</h4>
//                           <div className="text-sm mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.answer }} />
//                           {msg.content.keyPoints && msg.content.keyPoints.length > 0 && (
//                             <>
//                               <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Key Points</h4>
//                               <ul className="list-disc list-inside text-sm space-y-1">
//                                 {msg.content.keyPoints.map((kp, i) => (
//                                   <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: kp }} />
//                                 ))}
//                               </ul>
//                             </>
//                           )}
//                           <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 text-right">
//                             {msg.timestamp}
//                           </div>
//                         </motion.div>
//                       ) : (
//                         <div className={`px-4 md:px-5 py-3 rounded-2xl text-sm shadow-md relative ${
//                           isUser
//                             ? "bg-[#334155] dark:bg-gray-700 text-white rounded-br-none"
//                             : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none"
//                         }`}>
//                           <div dangerouslySetInnerHTML={{ __html: msg.content }} />
//                           <div className={`text-[10px] mt-2 text-right ${isUser ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
//                             {msg.timestamp}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>

//           {loading && (
//             <div className="flex justify-start animate-pulse">
//               <div className="px-4 md:px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white font-semibold shadow-md flex items-center gap-3">
//                 <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                 </svg>
//                 <span>🤔 AI Shine is thinking...</span>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>
//       )}

//       <div className={`${isFirstMessage ? 'fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4' : 'relative'} bg-white dark:bg-gray-800 backdrop-blur-md ${isFirstMessage ? 'border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl' : 'border-t border-gray-300 dark:border-gray-700'} p-3 md:p-4 flex gap-2 md:gap-3 items-end flex-shrink-0 z-20 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}>
//         <textarea
//           ref={textareaRef}
//           className={`flex-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 md:px-4 py-2 md:py-3 rounded-2xl resize-none min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-cyan-400 transition-all duration-200 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//           placeholder="Ask anything about AI..."
//           rows="1"
//           value={input}
//           onChange={handleTextareaChange}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               sendMessage();
//             }
//           }}
//         />

//         <button
//           onClick={toggleListening}
//           disabled={loading}
//           className={`rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
//             listening
//               ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//               : "bg-gray-500 hover:bg-gray-600 hover:scale-105"
//           }`}
//           title={listening ? "Listening..." : "Tap to Speak"}
//         >
//           {listening ? (
//             <MicOff className="w-5 h-5 text-white" />
//           ) : (
//             <Mic className="w-5 h-5 text-white" />
//           )}
//         </button>

//         <button
//           onClick={() => setShowSettings(true)}
//           className="rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md bg-gray-500 hover:bg-gray-600 transition-all cursor-pointer hover:scale-105"
//         >
//           <Settings className="w-5 h-5 text-white" />
//         </button>

//         <button
//           onClick={sendMessage}
//           disabled={loading || !input.trim()}
//           className="relative rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:from-pink-500 hover:via-purple-600 hover:to-cyan-600 group overflow-hidden"
//           title="Send message"
//         >
//           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
//           <Send className="w-5 h-5 text-white relative z-10" />
//         </button>
//       </div>
//     </main>
//   );
// }












































// this one had doodles, based on the one above it.
// "use client";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Header from "../../components/Header";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Settings, 
//   Sun, 
//   Moon, 
//   Monitor,
//   Palette,
//   Type,
//   Send,
//   Mic,
//   MicOff,
//   Sparkles
// } from "lucide-react";
// import confetti from 'canvas-confetti';

// export default function Home() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isFirstMessage, setIsFirstMessage] = useState(true);
//   const [listening, setListening] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [sessionDate, setSessionDate] = useState("");
//   const [gradientIndex, setGradientIndex] = useState(0);
//   const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  
//   // Settings state
//   const [theme, setTheme] = useState("system");
//   const [fontSize, setFontSize] = useState("M");
//   const [fontFamily, setFontFamily] = useState("standard");
//   const [background, setBackground] = useState("doodles");
//   const [fontWeight, setFontWeight] = useState("regular");
  
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Welcome message gradients - randomized on load
//   const welcomeGradients = [
//     "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600",
//     "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600",
//     "bg-gradient-to-r from-orange-500 via-pink-600 to-red-600",
//     "bg-gradient-to-r from-green-500 via-teal-600 to-cyan-600",
//     "bg-gradient-to-r from-violet-500 via-fuchsia-600 to-pink-600",
//     "bg-gradient-to-r from-amber-500 via-orange-600 to-red-600",
//   ];

//   // Set session date and random gradient on mount
//   useEffect(() => {
//     const today = new Date();
//     const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
//     setSessionDate(formattedDate);
//     setGradientIndex(Math.floor(Math.random() * welcomeGradients.length));
//   }, []);

//   // Trigger confetti celebration
//   const triggerCelebration = () => {
//     const duration = 2000;
//     const animationEnd = Date.now() + duration;
//     const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

//     function randomInRange(min, max) {
//       return Math.random() * (max - min) + min;
//     }

//     const interval = setInterval(function() {
//       const timeLeft = animationEnd - Date.now();

//       if (timeLeft <= 0) {
//         return clearInterval(interval);
//       }

//       const particleCount = 50 * (timeLeft / duration);
      
//       confetti({
//         ...defaults,
//         particleCount,
//         origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
//       });
//       confetti({
//         ...defaults,
//         particleCount,
//         origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
//       });
//     }, 250);
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return "Good morning";
//     if (hour < 18) return "Good afternoon";
//     return "Good evening";
//   };

//   const fontSizeMap = {
//     XS: "text-xs",
//     S: "text-sm",
//     M: "text-base",
//     L: "text-lg",
//     XL: "text-xl"
//   };

//   const fontFamilyMap = {
//     standard: "font-sans",
//     lexend: "font-['Lexend',sans-serif]",
//     times: "font-serif"
//   };

//   const backgroundMap = {
//     doodles: "bg-[url('/assets/bg_doodles.png')] bg-cover bg-center",
//     gradient1: "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
//     gradient2: "bg-gradient-to-br from-green-400 via-teal-500 to-blue-500",
//     gradient3: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600",
//     gradient4: "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500"
//   };

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
    
//     const root = document.documentElement;
//     const applyTheme = () => {
//       const shouldBeDark = theme === "dark" || 
//         (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
//       setIsDarkMode(shouldBeDark);
      
//       if (shouldBeDark) {
//         root.classList.add("dark");
//       } else {
//         root.classList.remove("dark");
//       }
//     };

//     applyTheme();

//     if (theme === "system") {
//       const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//       mediaQuery.addEventListener('change', applyTheme);
//       return () => mediaQuery.removeEventListener('change', applyTheme);
//     }
//   }, [theme]);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = false;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.lang = "en-IN";

//         recognitionRef.current.onresult = (event) => {
//           const transcript = event.results[0][0].transcript;
//           setInput((prev) => (prev ? prev + " " + transcript : transcript));
//           setListening(false);
//         };
//         recognitionRef.current.onend = () => setListening(false);
//       }
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition not supported in this browser.");
//       return;
//     }
//     if (listening) {
//       recognitionRef.current.stop();
//     } else {
//       recognitionRef.current.start();
//     }
//     setListening(!listening);
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     if (textareaRef.current && isFirstMessage) {
//       textareaRef.current.focus();
//     }
//   }, [isFirstMessage]);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     if (isFirstMessage) {
//       setIsFirstMessage(false);
//     }

//     const timestamp = new Date().toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit"
//     });

//     const userMessage = {
//       role: "human",
//       type: "text",
//       content: input,
//       timestamp
//     };

//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
    
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }

//     await sendToAI(newMessages);
//   };

//   async function sendToAI(newMessages) {
//     setLoading(true);
//     try {
//       const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/chat";

//       const formattedMessages = newMessages.map((msg) => ({
//         role: msg.role,
//         content: typeof msg.content === "string" ? msg.content : msg.content.answer || JSON.stringify(msg.content),
//         type: msg.type || "text",
//       }));

//       const res = await fetch(backendUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ chat_history: formattedMessages }),
//       });

//       if (!res.ok) {
//         throw new Error(`Backend returned ${res.status}`);
//       }

//       const data = await res.json();
//       const rawAnswer = data.answer || "🤖 I'm here to help!";
//       const responseType = data.type || "text";

//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit"
//       });

//       let messageBlock;

//       if (responseType === "greeting") {
//         messageBlock = {
//           role: "ai",
//           type: "greeting",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "decline") {
//         messageBlock = {
//           role: "ai",
//           type: "decline",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "structured") {
//         const parsed = parseStructuredAnswer(rawAnswer);
//         messageBlock = {
//           role: "ai",
//           type: "structured",
//           content: parsed,
//           timestamp
//         };
//       } else {
//         messageBlock = {
//           role: "ai",
//           type: "text",
//           content: rawAnswer,
//           timestamp
//         };
//       }

//       setMessages((prev) => [...prev, messageBlock]);
//     } catch (error) {
//       console.error("[ERROR]", error);
//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit"
//       });
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           type: "error",
//           content: "⚠️ Oops! Couldn't connect to AI Shine's server.",
//           timestamp
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function parseStructuredAnswer(rawAnswer) {
//     const parts = rawAnswer.split(/\*\*Key Points:\*\*|<strong>Key Points:<\/strong>/i);

//     if (parts.length === 2) {
//       const answerPart = parts[0].replace(/\*\*Answer:\*\*|<strong>Answer:<\/strong>/gi, "").trim();
//       const keyPointsPart = parts[1].trim();

//       const keyPoints = keyPointsPart
//         .split(/\n|<li>/)
//         .map((line) => line.replace(/<\/?[^>]+(>|$)/g, "").replace(/^[•\-\*]\s*/, "").trim())
//         .filter(Boolean);

//       return {
//         answer: answerPart,
//         keyPoints: keyPoints,
//       };
//     }

//     return {
//       answer: rawAnswer,
//       keyPoints: [],
//     };
//   }

//   const handleTextareaChange = (e) => {
//     setInput(e.target.value);
//     const maxHeight = 200;
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
//     e.target.style.overflowY = e.target.scrollHeight > maxHeight ? "auto" : "hidden";
//   };

//   const handleClearChat = () => {
//     setMessages([]);
//     setInput("");
//     setIsFirstMessage(true);
//     setGradientIndex(Math.floor(Math.random() * welcomeGradients.length));
//   };

//   const suggestions = [
//     "What is the CRAFT prompting framework?",
//     "How does AI help in creativity?",
//     "Explain machine learning to a beginner",
//     "What are the golden rules for using AI?"
//   ];

//   return (
//     <main className={`fixed inset-0 flex flex-col ${backgroundMap[background]} transition-all duration-300`}>
//       {isDarkMode && (
//         <div className="fixed inset-0 bg-black/80 z-0" />
//       )}

//       <AnimatePresence>
//         {showSettings && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
//             onClick={() => setShowSettings(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               onClick={(e) => e.stopPropagation()}
//               className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                   <Settings className="w-6 h-6" />
//                   Settings
//                 </h2>
//                 <button
//                   onClick={() => setShowSettings(false)}
//                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Theme
//                 </label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {[
//                     { value: "light", icon: Sun, label: "Light" },
//                     { value: "dark", icon: Moon, label: "Dark" },
//                     { value: "system", icon: Monitor, label: "System" }
//                   ].map((t) => (
//                     <button
//                       key={t.value}
//                       onClick={() => setTheme(t.value)}
//                       className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
//                         theme === t.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
//                       }`}
//                     >
//                       <t.icon className="w-5 h-5" />
//                       <span className="text-xs">{t.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Font Size
//                 </label>
//                 <div className="flex gap-2">
//                   {["XS", "S", "M", "L", "XL"].map((size) => (
//                     <button
//                       key={size}
//                       onClick={() => setFontSize(size)}
//                       className={`flex-1 py-2 rounded-lg border-2 transition-all ${
//                         fontSize === size
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Font Family
//                 </label>
//                 <select
//                   value={fontFamily}
//                   onChange={(e) => setFontFamily(e.target.value)}
//                   className="w-full p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
//                 >
//                   <option value="standard">Standard (Sans-serif)</option>
//                   <option value="lexend">Lexend (for dyslexia)</option>
//                   <option value="times">Times New Roman</option>
//                 </select>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                   <Palette className="w-4 h-4" />
//                   Background
//                 </label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {[
//                     { value: "doodles", label: "Doodles" },
//                     { value: "gradient1", label: "Gradient 1" },
//                     { value: "gradient2", label: "Gradient 2" },
//                     { value: "gradient3", label: "Gradient 3" },
//                     { value: "gradient4", label: "Gradient 4" }
//                   ].map((bg) => (
//                     <button
//                       key={bg.value}
//                       onClick={() => setBackground(bg.value)}
//                       className={`p-3 rounded-lg border-2 transition-all ${
//                         background === bg.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {bg.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                   <Type className="w-4 h-4" />
//                   Font Weight
//                 </label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {[
//                     { value: "regular", label: "Regular" },
//                     { value: "bold", label: "Bold" },
//                     { value: "italic", label: "Italic" }
//                   ].map((fw) => (
//                     <button
//                       key={fw.value}
//                       onClick={() => setFontWeight(fw.value)}
//                       className={`p-2 rounded-lg border-2 transition-all ${
//                         fontWeight === fw.value
//                           ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                           : "border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       {fw.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {isFirstMessage && (
//         <motion.div
//           initial={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-10 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
//         >
//           <motion.div
//             initial={{ y: -20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.2 }}
//             className="text-center mb-8"
//           >
//             <motion.h1 
//               className={`text-4xl md:text-5xl font-bold mb-3 ${welcomeGradients[gradientIndex]} bg-clip-text text-transparent animate-gradientFloat`}
//               animate={{
//                 backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
//               }}
//               transition={{
//                 duration: 5,
//                 repeat: Infinity,
//                 ease: "easeInOut"
//               }}
//               style={{
//                 backgroundSize: '200% 200%',
//               }}
//             >
//               {getGreeting()}
//             </motion.h1>
//             <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
//               What would you like to ask <strong>AI-SHINE</strong> today?
//             </p>
//           </motion.div>

//           <motion.div
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.4 }}
//             className="w-full max-w-2xl"
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
//               {suggestions.map((suggestion, idx) => (
//                 <motion.button
//                   key={idx}
//                   initial={{ y: 20, opacity: 0 }}
//                   animate={{ y: 0, opacity: 1 }}
//                   transition={{ delay: 0.5 + idx * 0.1 }}
//                   onMouseEnter={() => setHoveredSuggestion(idx)}
//                   onMouseLeave={() => setHoveredSuggestion(null)}
//                   onClick={() => {
//                     triggerCelebration();
//                     setInput(suggestion);
//                     setTimeout(() => {
//                       const syntheticInput = suggestion;
//                       if (!syntheticInput.trim()) return;
//                       setIsFirstMessage(false);
//                       const timestamp = new Date().toLocaleTimeString("en-US", {
//                         hour: "2-digit",
//                         minute: "2-digit"
//                       });
//                       const userMessage = {
//                         role: "human",
//                         type: "text",
//                         content: syntheticInput,
//                         timestamp
//                       };
//                       const newMessages = [...messages, userMessage];
//                       setMessages(newMessages);
//                       setInput("");
//                       sendToAI(newMessages);
//                     }, 300);
//                   }}
//                   className="relative p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg text-left group overflow-hidden"
//                 >
//                   {/* Doodle decorations on hover */}
//                   {hoveredSuggestion === idx && (
//                     <>
//                       <motion.svg
//                         initial={{ opacity: 0, pathLength: 0 }}
//                         animate={{ opacity: 1, pathLength: 1 }}
//                         transition={{ duration: 0.5 }}
//                         className="absolute top-2 right-2 w-8 h-8 text-blue-400"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                       >
//                         <motion.path
//                           d="M12 2L15.5 8.5L22 9.5L17 14.5L18 21L12 17.5L6 21L7 14.5L2 9.5L8.5 8.5L12 2Z"
//                           initial={{ pathLength: 0 }}
//                           animate={{ pathLength: 1 }}
//                           transition={{ duration: 0.8, ease: "easeInOut" }}
//                         />
//                       </motion.svg>
                      
//                       <motion.svg
//                         initial={{ opacity: 0, rotate: -180 }}
//                         animate={{ opacity: 1, rotate: 0 }}
//                         transition={{ duration: 0.6 }}
//                         className="absolute bottom-2 left-2 w-6 h-6 text-purple-400"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                       >
//                         <motion.path
//                           d="M3 12 Q12 3, 21 12"
//                           initial={{ pathLength: 0 }}
//                           animate={{ pathLength: 1 }}
//                           transition={{ duration: 0.7 }}
//                         />
//                       </motion.svg>

//                       <motion.div
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         transition={{ duration: 0.4 }}
//                         className="absolute top-1/2 right-4 w-3 h-3 rounded-full bg-pink-400"
//                       />
//                     </>
//                   )}

//                   <div className="flex items-start gap-3 relative z-10">
//                     <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
//                     <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
//                   </div>
//                 </motion.button>
//               ))}
//             </div>
//           </motion.div>
//         </motion.div>
//       )}

//       {!isFirstMessage && (
//         <div className="relative z-20 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white shadow-md flex-shrink-0">
//           <Header onClearChat={handleClearChat} />
//         </div>
//       )}

//       {!isFirstMessage && (
//         <div className={`relative flex-grow overflow-y-auto px-4 md:px-5 py-6 space-y-5 scrollbar-hide ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]} ${fontWeight === 'bold' ? 'font-bold' : fontWeight === 'italic' ? 'italic' : ''}`}>
//           {/* Session Date */}
//           <div className="flex justify-center mb-4">
//             <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
//               {sessionDate}
//             </div>
//           </div>

//           <AnimatePresence>
//             {messages.map((msg, idx) => {
//               const isUser = msg.role === "human";
//               return (
//                 <motion.div
//                   key={idx}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.3 }}
//                   className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//                 >
//                   <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-2 max-w-[85%] md:max-w-[80%]`}>
//                     <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"}`}>
//                       <span className="text-white text-lg">
//                         {isUser ? "👤" : "🤖"}
//                       </span>
//                     </div>

//                     <div className="flex flex-col gap-1">
//                       {msg.type === "decline" || msg.type === "error" ? (
//                         <motion.div
//                           initial={{ opacity: 0, scale: 0.9 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-800 dark:text-red-200 px-4 md:px-5 py-3 rounded-lg shadow-sm relative"
//                         >
//                           <div className="font-semibold mb-1">⚠️ System Notice</div>
//                           <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
//                           <div className="text-[10px] text-red-600 dark:text-red-300 mt-2 text-right">
//                             {msg.timestamp}
//                           </div>
//                         </motion.div>
//                       ) : msg.type === "structured" ? (
//                         <motion.div
//                           initial={{ opacity: 0, y: 10 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 md:px-5 py-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.01] relative"
//                         >
//                           <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Answer</h4>
//                           <div className="text-sm mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.answer }} />
//                           {msg.content.keyPoints && msg.content.keyPoints.length > 0 && (
//                             <>
//                               <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Key Points</h4>
//                               <ul className="list-disc list-inside text-sm space-y-1">
//                                 {msg.content.keyPoints.map((kp, i) => (
//                                   <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: kp }} />
//                                 ))}
//                               </ul>
//                             </>
//                           )}
//                           <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 text-right">
//                             {msg.timestamp}
//                           </div>
//                         </motion.div>
//                       ) : (
//                         <div className={`px-4 md:px-5 py-3 rounded-2xl text-sm shadow-md relative ${
//                           isUser
//                             ? "bg-[#334155] dark:bg-gray-700 text-white rounded-br-none"
//                             : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none"
//                         }`}>
//                           <div dangerouslySetInnerHTML={{ __html: msg.content }} />
//                           <div className={`text-[10px] mt-2 text-right ${isUser ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
//                             {msg.timestamp}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>

//           {loading && (
//             <div className="flex justify-start animate-pulse">
//               <div className="px-4 md:px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white font-semibold shadow-md flex items-center gap-3">
//                 <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                 </svg>
//                 <span>🤔 AI Shine is thinking...</span>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>
//       )}

//       <div className={`${isFirstMessage ? 'fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4' : 'relative'} bg-white dark:bg-gray-800 backdrop-blur-md ${isFirstMessage ? 'border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl' : 'border-t border-gray-300 dark:border-gray-700'} p-3 md:p-4 flex gap-2 md:gap-3 items-end flex-shrink-0 z-20 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}>
//         <textarea
//           ref={textareaRef}
//           className={`flex-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 md:px-4 py-2 md:py-3 rounded-2xl resize-none min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-cyan-400 transition-all duration-200 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//           placeholder="Ask anything about AI..."
//           rows="1"
//           value={input}
//           onChange={handleTextareaChange}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               sendMessage();
//             }
//           }}
//         />

//         <button
//           onClick={toggleListening}
//           disabled={loading}
//           className={`rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
//             listening
//               ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//               : "bg-gray-500 hover:bg-gray-600 hover:scale-105"
//           }`}
//           title={listening ? "Listening..." : "Tap to Speak"}
//         >
//           {listening ? (
//             <MicOff className="w-5 h-5 text-white" />
//           ) : (
//             <Mic className="w-5 h-5 text-white" />
//           )}
//         </button>

//         <button
//           onClick={() => setShowSettings(true)}
//           className="rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md bg-gray-500 hover:bg-gray-600 transition-all cursor-pointer hover:scale-105"
//         >
//           <Settings className="w-5 h-5 text-white" />
//         </button>

//         <button
//           onClick={sendMessage}
//           disabled={loading || !input.trim()}
//           className="relative rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:from-pink-500 hover:via-purple-600 hover:to-cyan-600 group overflow-hidden"
//           title="Send message"
//         >
//           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
//           <Send className="w-5 h-5 text-white relative z-10" />
//         </button>
//       </div>
//     </main>
//   );
// }



















// sounds and all
// "use client";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Header from "../../components/Header";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Settings, 
//   Sun, 
//   Moon, 
//   Monitor,
//   Palette,
//   Type,
//   Send,
//   Mic,
//   MicOff,
//   Sparkles,
//   ThumbsUp,
//   ThumbsDown,
//   Copy,
//   Share2,
//   Volume2,
//   Download,
//   FileText,
//   Focus,
//   Zap,
//   Check
// } from "lucide-react";
// import confetti from 'canvas-confetti';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import toast, { Toaster } from 'react-hot-toast';

// export default function Home() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isFirstMessage, setIsFirstMessage] = useState(true);
//   const [listening, setListening] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [sessionDate, setSessionDate] = useState("");
//   const [gradientIndex, setGradientIndex] = useState(0);
//   const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
//   const [feedback, setFeedback] = useState({});
//   const [copiedIndex, setCopiedIndex] = useState(null);
  
//   // Settings state
//   const [theme, setTheme] = useState("system");
//   const [fontSize, setFontSize] = useState("M");
//   const [fontFamily, setFontFamily] = useState("standard");
//   const [background, setBackground] = useState("doodles");
//   const [fontWeight, setFontWeight] = useState("regular");
//   const [soundEffects, setSoundEffects] = useState(true);
//   const [focusMode, setFocusMode] = useState(false);
//   const [bedtimeMode, setBedtimeMode] = useState(false);
  
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const textareaRef = useRef(null);
//   const chatContainerRef = useRef(null);

// // Native TTS implementation (no external library needed)
// const [speaking, setSpeaking] = useState(false);
// const [currentUtterance, setCurrentUtterance] = useState(null);
//   const [ttsSettings, setTtsSettings] = useState({
//     rate: 1.0,
//     pitch: 1.0,
//     volume: 1.0
//   });
// const [selectedVoice, setSelectedVoice] = useState(null);
// const [availableVoices, setAvailableVoices] = useState([]);
// useEffect(() => {
//   if (typeof window === 'undefined') return;
  
//   const loadVoices = () => {
//     const voices = window.speechSynthesis.getVoices();
//     setAvailableVoices(voices.filter(voice => voice.lang.startsWith('en-')));
//   };
  
//   loadVoices();
  
//   // Chrome loads voices asynchronously
//   if (window.speechSynthesis.onvoiceschanged !== undefined) {
//     window.speechSynthesis.onvoiceschanged = loadVoices;
//   }
// }, []);

// const speak = (text) => {
//   if (typeof window === 'undefined' || !window.speechSynthesis) {
//     toast.error('Text-to-speech not supported in this browser');
//     return;
//   }
  
//   window.speechSynthesis.cancel();
  
//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.rate = 1.0;
//   utterance.pitch = 1.0;
//   utterance.volume = 1.0;
  
//   // Use selected voice if available
//   if (selectedVoice) {
//     utterance.voice = selectedVoice;
//   } else {
//     const voices = window.speechSynthesis.getVoices();
//     const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
//     if (englishVoice) utterance.voice = englishVoice;
//   }
  
//   utterance.onstart = () => setSpeaking(true);
//   utterance.onend = () => {
//     setSpeaking(false);
//     setCurrentUtterance(null);
//   };
//   utterance.onerror = (error) => {
//     console.error('Speech synthesis error:', error);
//     setSpeaking(false);
//     toast.error('Speech synthesis failed');
//   };
  
//   setCurrentUtterance(utterance);
//   window.speechSynthesis.speak(utterance);
// };

// const cancel = () => {
//   if (typeof window === 'undefined') return;
//   window.speechSynthesis.cancel();
//   setSpeaking(false);
//   setCurrentUtterance(null);
// };

//   // Comic book styles for clicked suggestions
//   const comicStyles = [
//     "shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] border-4 border-black bg-red-400",
//     "shadow-[4px_4px_0px_0px_rgba(0,255,0,1)] border-4 border-black bg-green-400",
//     "shadow-[4px_4px_0px_0px_rgba(0,100,255,1)] border-4 border-black bg-blue-400",
//     "shadow-[4px_4px_0px_0px_rgba(255,200,0,1)] border-4 border-black bg-yellow-400",
//   ];

//   // Welcome message gradients
//   const welcomeGradients = [
//     "from-pink-500 via-purple-600 to-indigo-600",
//     "from-cyan-500 via-blue-600 to-purple-600",
//     "from-orange-500 via-pink-600 to-red-600",
//     "from-green-500 via-teal-600 to-cyan-600",
//     "from-violet-500 via-fuchsia-600 to-pink-600",
//     "from-amber-500 via-orange-600 to-red-600",
//   ];

//   // Celebration animations
//   const celebrationTypes = [
//     () => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }),
//     () => {
//       const duration = 2000;
//       const end = Date.now() + duration;
//       (function frame() {
//         confetti({
//           particleCount: 2,
//           angle: 60,
//           spread: 55,
//           origin: { x: 0 },
//           colors: ['#ff0000', '#00ff00', '#0000ff']
//         });
//         confetti({
//           particleCount: 2,
//           angle: 120,
//           spread: 55,
//           origin: { x: 1 },
//           colors: ['#ff0000', '#00ff00', '#0000ff']
//         });
//         if (Date.now() < end) requestAnimationFrame(frame);
//       }());
//     },
//     () => {
//       const count = 200;
//       const defaults = { origin: { y: 0.7 } };
//       function fire(particleRatio, opts) {
//         confetti({
//           ...defaults,
//           ...opts,
//           particleCount: Math.floor(count * particleRatio)
//         });
//       }
//       fire(0.25, { spread: 26, startVelocity: 55 });
//       fire(0.2, { spread: 60 });
//       fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
//       fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
//       fire(0.1, { spread: 120, startVelocity: 45 });
//     },
//     () => {
//       const scalar = 2;
//       const emoji = confetti.shapeFromText({ text: '🎉', scalar });
//       confetti({
//         shapes: [emoji],
//         particleCount: 40,
//         spread: 100,
//         scalar
//       });
//     }
//   ];

//   // Sound effects
//   const playSound = (type) => {
//     if (!soundEffects) return;
    
//     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//     const oscillator = audioContext.createOscillator();
//     const gainNode = audioContext.createGain();
    
//     oscillator.connect(gainNode);
//     gainNode.connect(audioContext.destination);
    
//     switch(type) {
//       case 'click':
//         oscillator.frequency.value = 800;
//         gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
//         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
//         oscillator.start(audioContext.currentTime);
//         oscillator.stop(audioContext.currentTime + 0.1);
//         break;
//       case 'success':
//         oscillator.frequency.value = 523.25;
//         gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
//         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
//         oscillator.start(audioContext.currentTime);
//         oscillator.stop(audioContext.currentTime + 0.3);
//         break;
//       case 'send':
//         oscillator.frequency.value = 1000;
//         gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
//         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
//         oscillator.start(audioContext.currentTime);
//         oscillator.stop(audioContext.currentTime + 0.15);
//         break;
//     }
//   };

//   // Set session date and random gradient on mount
//   useEffect(() => {
//     const today = new Date();
//     const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
//     setSessionDate(formattedDate);
//     setGradientIndex(Math.floor(Math.random() * welcomeGradients.length));
    
//     // Load settings from localStorage
//     const savedSettings = localStorage.getItem('aiShineSettings');
//     if (savedSettings) {
//       const settings = JSON.parse(savedSettings);
//       setTheme(settings.theme || 'system');
//       setFontSize(settings.fontSize || 'M');
//       setFontFamily(settings.fontFamily || 'standard');
//       setBackground(settings.background || 'doodles');
//       setFontWeight(settings.fontWeight || 'regular');
//       setSoundEffects(settings.soundEffects !== undefined ? settings.soundEffects : true);
//       setBedtimeMode(settings.bedtimeMode || false);
//     }

//     // Check for bedtime mode (10 PM - 6 AM)
//     const hour = new Date().getHours();
//     if (hour >= 22 || hour < 6) {
//       setBedtimeMode(true);
//     }
//   }, []);

//   // Save settings to localStorage
//   useEffect(() => {
//     const settings = {
//       theme,
//       fontSize,
//       fontFamily,
//       background,
//       fontWeight,
//       soundEffects,
//       bedtimeMode
//     };
//     localStorage.setItem('aiShineSettings', JSON.stringify(settings));
//   }, [theme, fontSize, fontFamily, background, fontWeight, soundEffects, bedtimeMode]);

//   // Trigger random celebration
//   const triggerCelebration = () => {
//     const randomCelebration = celebrationTypes[Math.floor(Math.random() * celebrationTypes.length)];
//     randomCelebration();
//     playSound('success');
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (bedtimeMode) return "Good evening";
//     if (hour < 12) return "Good morning";
//     if (hour < 18) return "Good afternoon";
//     return "Good evening";
//   };

//   const fontSizeMap = {
//     XS: "text-xs",
//     S: "text-sm",
//     M: "text-base",
//     L: "text-lg",
//     XL: "text-xl"
//   };

//   const fontFamilyMap = {
//     standard: "font-sans",
//     lexend: "font-['Lexend',sans-serif]",
//     times: "font-serif"
//   };

//   const backgroundMap = {
//     doodles: "bg-[url('/assets/bg_doodles.png')] bg-cover bg-center",
//     gradient1: "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
//     gradient2: "bg-gradient-to-br from-green-400 via-teal-500 to-blue-500",
//     gradient3: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600",
//     gradient4: "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500"
//   };

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
    
//     const root = document.documentElement;
//     const applyTheme = () => {
//       const shouldBeDark = theme === "dark" || 
//         (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
//         bedtimeMode;
      
//       setIsDarkMode(shouldBeDark);
      
//       if (shouldBeDark) {
//         root.classList.add("dark");
//       } else {
//         root.classList.remove("dark");
//       }
//     };

//     applyTheme();

//     if (theme === "system") {
//       const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//       mediaQuery.addEventListener('change', applyTheme);
//       return () => mediaQuery.removeEventListener('change', applyTheme);
//     }
//   }, [theme, bedtimeMode]);

//   // Enhanced speech recognition with better browser support
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         try {
//           recognitionRef.current = new SpeechRecognition();
//           recognitionRef.current.continuous = false;
//           recognitionRef.current.interimResults = false;
//           recognitionRef.current.lang = "en-US";
//           recognitionRef.current.maxAlternatives = 1;

//           recognitionRef.current.onresult = (event) => {
//             const transcript = event.results[0][0].transcript;
//             setInput((prev) => (prev ? prev + " " + transcript : transcript));
//             setListening(false);
//             playSound('success');
//           };
          
//           recognitionRef.current.onerror = (event) => {
//             console.error('Speech recognition error:', event.error);
//             setListening(false);
//             if (event.error === 'not-allowed') {
//               toast.error('Microphone access denied. Please enable it in browser settings.');
//             }
//           };
          
//           recognitionRef.current.onend = () => setListening(false);
//         } catch (error) {
//           console.error('Speech recognition initialization error:', error);
//         }
//       }
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       toast.error("Speech recognition not supported in this browser. Try Chrome or Edge.");
//       return;
//     }
    
//     if (listening) {
//       recognitionRef.current.stop();
//       setListening(false);
//     } else {
//       try {
//         recognitionRef.current.start();
//         setListening(true);
//         playSound('click');
//       } catch (error) {
//         console.error('Error starting speech recognition:', error);
//         toast.error('Could not start speech recognition. Please try again.');
//       }
//     }
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     if (textareaRef.current && isFirstMessage) {
//       textareaRef.current.focus();
//     }
//   }, [isFirstMessage]);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     playSound('send');

//     if (isFirstMessage) {
//       setIsFirstMessage(false);
//     }

//     const timestamp = new Date().toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit"
//     });

//     const userMessage = {
//       role: "human",
//       type: "text",
//       content: input,
//       timestamp
//     };

//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
    
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }

//     await sendToAI(newMessages);
//   };

//   async function sendToAI(newMessages) {
//     setLoading(true);
//     try {
//       const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/chat";

//       const formattedMessages = newMessages.map((msg) => ({
//         role: msg.role,
//         content: typeof msg.content === "string" ? msg.content : msg.content.answer || JSON.stringify(msg.content),
//         type: msg.type || "text",
//       }));

//       const res = await fetch(backendUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ chat_history: formattedMessages }),
//       });

//       if (!res.ok) {
//         throw new Error(`Backend returned ${res.status}`);
//       }

//       const data = await res.json();
//       const rawAnswer = data.answer || "🤖 I'm here to help!";
//       const responseType = data.type || "text";

//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit"
//       });

//       let messageBlock;

//       if (responseType === "greeting") {
//         messageBlock = {
//           role: "ai",
//           type: "greeting",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "decline") {
//         messageBlock = {
//           role: "ai",
//           type: "decline",
//           content: rawAnswer,
//           timestamp
//         };
//       } else if (responseType === "structured") {
//         const parsed = parseStructuredAnswer(rawAnswer);
//         messageBlock = {
//           role: "ai",
//           type: "structured",
//           content: parsed,
//           timestamp
//         };
//       } else {
//         messageBlock = {
//           role: "ai",
//           type: "text",
//           content: rawAnswer,
//           timestamp
//         };
//       }

//       setMessages((prev) => [...prev, messageBlock]);
//       playSound('success');
//     } catch (error) {
//       console.error("[ERROR]", error);
//       const timestamp = new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-minute"
//       });
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           type: "error",
//           content: "⚠️ Oops! Couldn't connect to AI Shine's server.",
//           timestamp
//         },
//       ]);
//       toast.error("Failed to connect to server");
//     } finally {
//       setLoading(false);
//     }
//   }

//   function parseStructuredAnswer(rawAnswer) {
//     const parts = rawAnswer.split(/\*\*Key Points:\*\*|<strong>Key Points:<\/strong>/i);

//     if (parts.length === 2) {
//       const answerPart = parts[0].replace(/\*\*Answer:\*\*|<strong>Answer:<\/strong>/gi, "").trim();
//       const keyPointsPart = parts[1].trim();

//       const keyPoints = keyPointsPart
//         .split(/\n|<li>/)
//         .map((line) => line.replace(/<\/?[^>]+(>|$)/g, "").replace(/^[•\-\*]\s*/, "").trim())
//         .filter(Boolean);

//       return {
//         answer: answerPart,
//         keyPoints: keyPoints,
//       };
//     }

//     return {
//       answer: rawAnswer,
//       keyPoints: [],
//     };
//   }

//   const handleTextareaChange = (e) => {
//     setInput(e.target.value);
//     const maxHeight = 200;
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
//     e.target.style.overflowY = e.target.scrollHeight > maxHeight ? "auto" : "hidden";
//   };

//   const handleClearChat = () => {
//     setMessages([]);
//     setInput("");
//     setIsFirstMessage(true);
//     setFeedback({});
//     setGradientIndex(Math.floor(Math.random() * welcomeGradients.length));
//     playSound('click');
//     toast.success('Chat cleared!');
//   };

//   const handleFeedback = (messageIndex, type) => {
//     setFeedback(prev => ({
//       ...prev,
//       [messageIndex]: type
//     }));
//     playSound('click');
//     toast.success(`Thanks for your feedback!`);
    
//     // Store feedback in localStorage for analytics
//     const storedFeedback = JSON.parse(localStorage.getItem('aiFeedback') || '[]');
//     storedFeedback.push({
//       messageIndex,
//       type,
//       timestamp: new Date().toISOString(),
//       message: messages[messageIndex]?.content
//     });
//     localStorage.setItem('aiFeedback', JSON.stringify(storedFeedback));
//   };

//   const handleCopy = (content, index) => {
//     const textToCopy = typeof content === 'string' ? content : content.answer + '\n\nKey Points:\n' + content.keyPoints?.join('\n');
//     navigator.clipboard.writeText(textToCopy.replace(/<[^>]*>/g, ''));
//     setCopiedIndex(index);
//     playSound('success');
//     toast.success('Copied to clipboard!');
//     setTimeout(() => setCopiedIndex(null), 2000);
//   };

// const handleSpeak = (content) => {
//   if (speaking) {
//     cancel();
//   } else {
//     const textToSpeak = typeof content === 'string' 
//       ? content.replace(/<[^>]*>/g, '') 
//       : content.answer.replace(/<[^>]*>/g, '') + '. Key Points: ' + content.keyPoints?.join('. ');
//     speak(textToSpeak);
//   }
// };

//   const handleShare = async (content, index) => {
//     playSound('click');
    
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: 'AI Shine Response',
//           text: typeof content === 'string' ? content.replace(/<[^>]*>/g, '') : content.answer.replace(/<[^>]*>/g, ''),
//         });
//         toast.success('Shared successfully!');
//       } catch (error) {
//         console.error('Error sharing:', error);
//       }
//     } else {
//       toast.error('Sharing not supported on this browser');
//     }
//   };

//   const exportToPDF = async () => {
//     playSound('click');
//     toast.loading('Generating PDF...');
    
//     try {
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       let yPosition = 20;

//       pdf.setFontSize(18);
//       pdf.text('AI Shine Chat Export', pageWidth / 2, yPosition, { align: 'center' });
//       yPosition += 10;
      
//       pdf.setFontSize(10);
//       pdf.text(`Date: ${sessionDate}`, pageWidth / 2, yPosition, { align: 'center' });
//       yPosition += 15;

//       messages.forEach((msg, idx) => {
//         if (yPosition > pageHeight - 30) {
//           pdf.addPage();
//           yPosition = 20;
//         }

//         pdf.setFontSize(12);
//         pdf.setFont(undefined, 'bold');
//         pdf.text(msg.role === 'human' ? 'You:' : 'AI Shine:', 15, yPosition);
//         yPosition += 7;

//         pdf.setFont(undefined, 'normal');
//         pdf.setFontSize(10);
        
//         const content = typeof msg.content === 'string' 
//           ? msg.content.replace(/<[^>]*>/g, '') 
//           : msg.content.answer.replace(/<[^>]*>/g, '');
        
//         const lines = pdf.splitTextToSize(content, pageWidth - 30);
//         lines.forEach(line => {
//           if (yPosition > pageHeight - 20) {
//             pdf.addPage();
//             yPosition = 20;
//           }
//           pdf.text(line, 15, yPosition);
//           yPosition += 5;
//         });

//         yPosition += 10;
//       });

//       pdf.save(`AI-Shine-Chat-${sessionDate}.pdf`);
//       toast.dismiss();
//       toast.success('PDF downloaded!');
//     } catch (error) {
//       toast.dismiss();
//       toast.error('Failed to generate PDF');
//       console.error('PDF error:', error);
//     }
//   };

//   const suggestions = [
//     "What is the CRAFT prompting framework?",
//     "How does AI help in creativity?",
//     "Explain machine learning to a beginner",
//     "What are the golden rules for using AI?"
//   ];

//   return (
//     <>
//       <Toaster position="top-center" />
//       <main className={`fixed inset-0 flex flex-col ${backgroundMap[background]} transition-all duration-300 ${bedtimeMode ? 'brightness-75' : ''}`}>
//         {isDarkMode && (
//           <div className="fixed inset-0 bg-black/80 z-0" />
//         )}

//         {/* Settings Modal */}
//         <AnimatePresence>
//           {showSettings && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
//               onClick={() => setShowSettings(false)}
//             >
//               <motion.div
//                 initial={{ scale: 0.9, y: 20 }}
//                 animate={{ scale: 1, y: 0 }}
//                 exit={{ scale: 0.9, y: 20 }}
//                 onClick={(e) => e.stopPropagation()}
//                 className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//               >
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                     <Settings className="w-6 h-6" />
//                     Settings
//                   </h2>
//                   <button
//                     onClick={() => setShowSettings(false)}
//                     className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                   >
//                     ✕
//                   </button>
//                 </div>

//                 {/* Theme */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                     Theme
//                   </label>
//                   <div className="grid grid-cols-3 gap-2">
//                     {[
//                       { value: "light", icon: Sun, label: "Light" },
//                       { value: "dark", icon: Moon, label: "Dark" },
//                       { value: "system", icon: Monitor, label: "System" }
//                     ].map((t) => (
//                       <button
//                         key={t.value}
//                         onClick={() => {
//                           setTheme(t.value);
//                           playSound('click');
//                         }}
//                         className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
//                           theme === t.value
//                             ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
//                             : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
//                         }`}
//                       >
//                         <t.icon className="w-5 h-5" />
//                         <span className="text-xs">{t.label}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Font Size */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                     Font Size
//                   </label>
//                   <div className="flex gap-2">
//                     {["XS", "S", "M", "L", "XL"].map((size) => (
//                       <button
//                         key={size}
//                         onClick={() => {
//                           setFontSize(size);
//                           playSound('click');
//                         }}
//                         className={`flex-1 py-2 rounded-lg border-2 transition-all ${
//                           fontSize === size
//                             ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
//                             : "border-gray-200 dark:border-gray-700"
//                         }`}
//                       >
//                         {size}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Font Family */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                     Font Family
//                   </label>
//                   <select
//                     value={fontFamily}
//                     onChange={(e) => {
//                       setFontFamily(e.target.value);
//                       playSound('click');
//                     }}
//                     className="w-full p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
//                   >
//                     <option value="standard">Standard (Sans-serif)</option>
//                     <option value="lexend">Lexend (for dyslexia)</option>
//                     <option value="times">Times New Roman</option>
//                   </select>
//                 </div>

//                 {/* Background */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                     <Palette className="w-4 h-4" />
//                     Background
//                   </label>
//                   <div className="grid grid-cols-2 gap-2">
//                     {[
//                       { value: "doodles", label: "Doodles" },
//                       { value: "gradient1", label: "Gradient 1" },
//                       { value: "gradient2", label: "Gradient 2" },
//                       { value: "gradient3", label: "Gradient 3" },
//                       { value: "gradient4", label: "Gradient 4" }
//                     ].map((bg) => (
//                       <button
//                         key={bg.value}
//                         onClick={() => {
//                           setBackground(bg.value);
//                           playSound('click');
//                         }}
//                         className={`p-3 rounded-lg border-2 transition-all ${
//                           background === bg.value
//                             ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
//                             : "border-gray-200 dark:border-gray-700"
//                         }`}
//                       >
//                         {bg.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Font Weight */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                     <Type className="w-4 h-4" />
//                     Font Weight
//                   </label>
//                   <div className="grid grid-cols-3 gap-2">
//                     {[
//                       { value: "regular", label: "Regular" },
//                       { value: "bold", label: "Bold" },
//                       { value: "italic", label: "Italic" }
//                     ].map((fw) => (
//                       <button
//                         key={fw.value}
//                         onClick={() => {
//                           setFontWeight(fw.value);
//                           playSound('click');
//                         }}
//                         className={`p-2 rounded-lg border-2 transition-all ${
//                           fontWeight === fw.value
//                             ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
//                             : "border-gray-200 dark:border-gray-700"
//                         }`}
//                       >
//                         {fw.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* voice selector in settings */}
//                 <div className="mb-6">
//   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//     <Volume2 className="w-4 h-4" />
//     TTS Voice
//   </label>
//   <select
//     value={selectedVoice?.name || ''}
//     onChange={(e) => {
//       const voice = availableVoices.find(v => v.name === e.target.value);
//       setSelectedVoice(voice);
//       playSound('click');
//     }}
//     className="w-full p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
//   >
//     <option value="">Default Voice</option>
//     {availableVoices.map((voice, idx) => (
//       <option key={idx} value={voice.name}>
//         {voice.name} ({voice.lang})
//       </option>
//     ))}
//   </select>
// </div>

//                 {/* Sound Effects */}
//                 <div className="mb-6 flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Zap className="w-4 h-4 text-gray-700 dark:text-gray-300" />
//                     <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sound Effects</span>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setSoundEffects(!soundEffects);
//                       if (!soundEffects) playSound('click');
//                     }}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                       soundEffects ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
//                     }`}
//                   >
//                     <span
//                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                         soundEffects ? 'translate-x-6' : 'translate-x-1'
//                       }`}
//                     />
//                   </button>
//                 </div>

//                 {/* Bedtime Mode */}
//                 <div className="mb-6 flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
//                     <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bedtime Mode</span>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setBedtimeMode(!bedtimeMode);
//                       playSound('click');
//                     }}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                       bedtimeMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
//                     }`}
//                   >
//                     <span
//                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                         bedtimeMode ? 'translate-x-6' : 'translate-x-1'
//                       }`}
//                     />
//                   </button>
//                 </div>

//                 {/* Focus Mode */}
//                 <div className="mb-6 flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Focus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
//                     <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Focus Mode</span>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setFocusMode(!focusMode);
//                       playSound('click');
//                       toast.success(focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
//                     }}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                       focusMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
//                     }`}
//                   >
//                     <span
//                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                         focusMode ? 'translate-x-6' : 'translate-x-1'
//                       }`}
//                     />
//                   </button>
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Landing Screen */}
//         {isFirstMessage && (
//           <motion.div
//             initial={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-10 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
//           >
//             <motion.div
//               initial={{ y: -20, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               transition={{ delay: 0.2 }}
//               className="text-center mb-8"
//             >
//               <motion.h1 
//                 className={`text-4xl md:text-5xl font-bold mb-3 bg-gradient-radial ${welcomeGradients[gradientIndex]} bg-clip-text text-transparent`}
//                 animate={{
//                   backgroundSize: ['100% 100%', '150% 150%', '100% 100%'],
//                 }}
//                 transition={{
//                   duration: 4,
//                   repeat: Infinity,
//                   ease: "easeInOut"
//                 }}
//               >
//                 {getGreeting()}
//               </motion.h1>
//               <motion.p 
//                 className={`text-xl md:text-2xl bg-gradient-radial ${welcomeGradients[gradientIndex]} bg-clip-text text-transparent font-semibold`}
//                 animate={{
//                   backgroundSize: ['100% 100%', '150% 150%', '100% 100%'],
//                 }}
//                 transition={{
//                   duration: 4,
//                   repeat: Infinity,
//                   ease: "easeInOut",
//                   delay: 0.2
//                 }}
//               >
//                 What would you like to ask <strong>AI-SHINE</strong> today?
//               </motion.p>
//             </motion.div>

//             <motion.div
//               initial={{ y: 20, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               transition={{ delay: 0.4 }}
//               className="w-full max-w-2xl"
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
//                 {suggestions.map((suggestion, idx) => (
//                   <motion.button
//                     key={idx}
//                     initial={{ y: 20, opacity: 0 }}
//                     animate={{ y: 0, opacity: 1 }}
//                     transition={{ delay: 0.5 + idx * 0.1 }}
//                     whileHover={{ scale: 1.02, rotate: idx % 2 === 0 ? 1 : -1 }}
//                     whileTap={{ scale: 0.95 }}
//                     onMouseEnter={() => setHoveredSuggestion(idx)}
//                     onMouseLeave={() => setHoveredSuggestion(null)}
//                     onClick={() => {
//                       triggerCelebration();
//                       setInput(suggestion);
//                       setTimeout(() => {
//                         const syntheticInput = suggestion;
//                         if (!syntheticInput.trim()) return;
//                         setIsFirstMessage(false);
//                         const timestamp = new Date().toLocaleTimeString("en-US", {
//                           hour: "2-digit",
//                           minute: "2-digit"
//                         });
//                         const userMessage = {
//                           role: "human",
//                           type: "text",
//                           content: syntheticInput,
//                           timestamp
//                         };
//                         const newMessages = [...messages, userMessage];
//                         setMessages(newMessages);
//                         setInput("");
//                         sendToAI(newMessages);
//                       }, 300);
//                     }}
//                     className={`relative p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-2 ${hoveredSuggestion === idx ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'} transition-all hover:shadow-lg text-left group overflow-hidden`}
//                   >
//                     {/* Hover Doodles */}
//                     {hoveredSuggestion === idx && (
//                       <>
//                         <motion.svg
//                           initial={{ opacity: 0, pathLength: 0 }}
//                           animate={{ opacity: 1, pathLength: 1 }}
//                           transition={{ duration: 0.5 }}
//                           className="absolute top-2 right-2 w-8 h-8 text-purple-400"
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2"
//                         >
//                           <motion.path
//                             d="M12 2L15.5 8.5L22 9.5L17 14.5L18 21L12 17.5L6 21L7 14.5L2 9.5L8.5 8.5L12 2Z"
//                             initial={{ pathLength: 0 }}
//                             animate={{ pathLength: 1 }}
//                             transition={{ duration: 0.8, ease: "easeInOut" }}
//                           />
//                         </motion.svg>
                        
//                         <motion.svg
//                           initial={{ opacity: 0, rotate: -180 }}
//                           animate={{ opacity: 1, rotate: 0 }}
//                           transition={{ duration: 0.6 }}
//                           className="absolute bottom-2 left-2 w-6 h-6 text-pink-400"
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2"
//                         >
//                           <motion.path
//                             d="M3 12 Q12 3, 21 12"
//                             initial={{ pathLength: 0 }}
//                             animate={{ pathLength: 1 }}
//                             transition={{ duration: 0.7 }}
//                           />
//                         </motion.svg>

//                         <motion.div
//                           initial={{ scale: 0 }}
//                           animate={{ scale: 1 }}
//                           transition={{ duration: 0.4 }}
//                           className="absolute top-1/2 right-4 w-3 h-3 rounded-full bg-cyan-400"
//                         />

//                         <motion.svg
//                           initial={{ opacity: 0, scale: 0 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ duration: 0.5 }}
//                           className="absolute top-1/2 left-4 w-4 h-4 text-orange-400"
//                           viewBox="0 0 24 24"
//                           fill="currentColor"
//                         >
//                           <circle cx="12" cy="12" r="10" />
//                         </motion.svg>
//                       </>
//                     )}

//                     <div className="flex items-start gap-3 relative z-10">
//                       <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
//                       <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
//                     </div>
//                   </motion.button>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}

//         {/* Header */}
//         {!isFirstMessage && !focusMode && (
//           <div className="relative z-20 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white shadow-md flex-shrink-0">
//             <Header onClearChat={handleClearChat} />
//             <div className="absolute top-3 right-16 md:right-20 flex gap-2">
//               <button
//                 onClick={exportToPDF}
//                 className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
//                 title="Export to PDF"
//               >
//                 <Download className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => {
//                   setFocusMode(true);
//                   playSound('click');
//                   toast.success('Focus mode enabled');
//                 }}
//                 className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
//                 title="Focus Mode"
//               >
//                 <Focus className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Focus Mode Header */}
//         {!isFirstMessage && focusMode && (
//           <div className="relative z-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md flex-shrink-0 p-3">
//             <div className="flex items-center justify-between max-w-4xl mx-auto">
//               <div className="flex items-center gap-2">
//                 <Focus className="w-5 h-5" />
//                 <span className="text-sm font-medium">Focus Mode</span>
//               </div>
//               <button
//                 onClick={() => {
//                   setFocusMode(false);
//                   playSound('click');
//                   toast.success('Focus mode disabled');
//                 }}
//                 className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs"
//               >
//                 Exit
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Chat Section */}
//         {!isFirstMessage && (
//           <div 
//             ref={chatContainerRef}
//             className={`relative flex-grow overflow-y-auto px-4 md:px-5 py-6 space-y-5 scrollbar-hide ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]} ${fontWeight === 'bold' ? 'font-bold' : fontWeight === 'italic' ? 'italic' : ''} ${focusMode ? 'max-w-4xl mx-auto' : ''}`}
//           >
//             {/* Session Date */}
//             <div className="flex justify-center mb-4">
//               <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
//                 {sessionDate}
//               </div>
//             </div>

//             <AnimatePresence>
//               {messages.map((msg, idx) => {
//                 const isUser = msg.role === "human";
//                 return (
//                   <motion.div
//                     key={idx}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ duration: 0.3 }}
//                     className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//                   >
//                     <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} gap-2 max-w-[85%] md:max-w-[80%]`}>
//                       <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"}`}>
//                         <span className="text-white text-lg">
//                           {isUser ? "👤" : "🤖"}
//                         </span>
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         {msg.type === "decline" || msg.type === "error" ? (
//                           <motion.div
//                             initial={{ opacity: 0, scale: 0.9 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-800 dark:text-red-200 px-4 md:px-5 py-3 rounded-lg shadow-sm relative"
//                           >
//                             <div className="font-semibold mb-1">⚠️ System Notice</div>
//                             <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
//                             <div className="text-[10px] text-red-600 dark:text-red-300 mt-2 text-right">
//                               {msg.timestamp}
//                             </div>
//                           </motion.div>
//                         ) : msg.type === "structured" ? (
//                           <motion.div
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 md:px-5 py-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.01] relative"
//                           >
//                             <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Answer</h4>
//                             <div className="text-sm mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.answer }} />
//                             {msg.content.keyPoints && msg.content.keyPoints.length > 0 && (
//                               <>
//                                 <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Key Points</h4>
//                                 <ul className="list-disc list-inside text-sm space-y-1">
//                                   {msg.content.keyPoints.map((kp, i) => (
//                                     <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: kp }} />
//                                   ))}
//                                 </ul>
//                               </>
//                             )}
//                             <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 text-right">
//                               {msg.timestamp}
//                             </div>

//                             {/* Action Buttons for AI Messages */}
//                             {!isUser && (
//                               <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
//                                 <button
//                                   onClick={() => handleFeedback(idx, 'up')}
//                                   className={`p-1.5 rounded-lg transition-all ${feedback[idx] === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
//                                   title="Helpful"
//                                 >
//                                   <ThumbsUp className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleFeedback(idx, 'down')}
//                                   className={`p-1.5 rounded-lg transition-all ${feedback[idx] === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
//                                   title="Not helpful"
//                                 >
//                                   <ThumbsDown className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleCopy(msg.content, idx)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Copy"
//                                 >
//                                   {copiedIndex === idx ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
//                                 </button>
//                                 <button
//                                   onClick={() => handleSpeak(msg.content)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Read aloud"
//                                 >
//                                   <Volume2 className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleShare(msg.content, idx)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Share"
//                                 >
//                                   <Share2 className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             )}
//                           </motion.div>
//                         ) : (
//                           <div className={`px-4 md:px-5 py-3 rounded-2xl text-sm shadow-md relative ${
//                             isUser
//                               ? "bg-[#334155] dark:bg-gray-700 text-white rounded-br-none"
//                               : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none"
//                           }`}>
//                             <div dangerouslySetInnerHTML={{ __html: msg.content }} />
//                             <div className={`text-[10px] mt-2 text-right ${isUser ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
//                               {msg.timestamp}
//                             </div>

//                             {/* Action Buttons for simple AI messages */}
//                             {!isUser && (
//                               <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
//                                 <button
//                                   onClick={() => handleFeedback(idx, 'up')}
//                                   className={`p-1.5 rounded-lg transition-all ${feedback[idx] === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
//                                   title="Helpful"
//                                 >
//                                   <ThumbsUp className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleFeedback(idx, 'down')}
//                                   className={`p-1.5 rounded-lg transition-all ${feedback[idx] === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
//                                   title="Not helpful"
//                                 >
//                                   <ThumbsDown className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleCopy(msg.content, idx)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Copy"
//                                 >
//                                   {copiedIndex === idx ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
//                                 </button>
//                                 <button
//                                   onClick={() => handleSpeak(msg.content)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Read aloud"
//                                 >
//                                   <Volume2 className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleShare(msg.content, idx)}
//                                   className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
//                                   title="Share"
//                                 >
//                                   <Share2 className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </AnimatePresence>

//             {loading && (
//               <div className="flex justify-start animate-pulse">
//                 <div className="px-4 md:px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white font-semibold shadow-md flex items-center gap-3">
//                   <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                   </svg>
//                   <span>🤔 AI Shine is thinking...</span>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
//         )}

//         {/* Input Area */}
//         <div className={`${isFirstMessage ? 'fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4' : 'relative'} ${focusMode ? 'max-w-4xl mx-auto w-full' : ''} bg-white dark:bg-gray-800 backdrop-blur-md ${isFirstMessage ? 'border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl' : 'border-t border-gray-300 dark:border-gray-700'} p-3 md:p-4 flex gap-2 md:gap-3 items-end flex-shrink-0 z-20 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}>
//           <textarea
//             ref={textareaRef}
//             className={`flex-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 md:px-4 py-2 md:py-3 rounded-2xl resize-none min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-cyan-400 transition-all duration-200 ${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]}`}
//             placeholder="Ask anything about AI..."
//             rows="1"
//             value={input}
//             onChange={handleTextareaChange}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 sendMessage();
//               }
//             }}
//           />

//           <button
//             onClick={toggleListening}
//             disabled={loading}
//             className={`rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
//               listening
//                 ? "bg-gradient-to-r from-red-500 to-pink-500 scale-110"
//                 : "bg-gray-500 hover:bg-gray-600 hover:scale-105"
//             }`}
//             title={listening ? "Listening..." : "Tap to Speak"}
//           >
//             {listening ? (
//               <MicOff className="w-5 h-5 text-white" />
//             ) : (
//               <Mic className="w-5 h-5 text-white" />
//             )}
//           </button>

//           <button
//             onClick={() => {
//               setShowSettings(true);
//               playSound('click');
//             }}
//             className="rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md bg-gray-500 hover:bg-gray-600 transition-all cursor-pointer hover:scale-105"
//           >
//             <Settings className="w-5 h-5 text-white" />
//           </button>

//           <button
//             onClick={sendMessage}
//             disabled={loading || !input.trim()}
//             className="relative rounded-full p-2.5 md:p-3 flex-shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 hover:from-pink-500 hover:via-purple-600 hover:to-cyan-600 group overflow-hidden"
//             title="Send message"
//           >
//             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
//             <Send className="w-5 h-5 text-white relative z-10" />
//           </button>
//         </div>
//       </main>
//     </>
//   );
// }
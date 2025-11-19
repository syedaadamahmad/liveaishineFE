"use client";

import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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

// Utils
import { playSound } from "./utils/soundEffects";
import { exportToPDF } from "./utils/exportHelpers";
import {
  FONT_SIZE_MAP,
  FONT_FAMILY_MAP,
  BACKGROUND_MAP,
  WELCOME_GRADIENTS,
} from "./utils/constants";

export default function Home() {
  // state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [gradientIndex, setGradientIndex] = useState(0);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [previewBackground, setPreviewBackground] = useState(null);

  // refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // hooks
  const settings = useSettings();
  const { speak, cancel, speaking, availableVoices } = useTTS(
    settings.ttsSettings,
    settings.selectedVoice
  );
  const speechRecognition = useSpeechRecognition();
  const { triggerCelebration } = useConfetti();

  // initialize
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;
    setSessionDate(formattedDate);
    setGradientIndex(Math.floor(Math.random() * WELCOME_GRADIENTS.length));
  }, []);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // focus textarea on first message
  useEffect(() => {
    if (textareaRef.current && isFirstMessage) textareaRef.current.focus();
  }, [isFirstMessage]);

  // speech transcript append
  useEffect(() => {
    if (speechRecognition.transcript) {
      setInput((prev) => (prev ? `${prev} ${speechRecognition.transcript}` : speechRecognition.transcript));
      speechRecognition.resetTranscript();
    }
  }, [speechRecognition.transcript]);

  // helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (settings.bedtimeMode) return "Good evening";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handlePreviewBackground = (bg) => setPreviewBackground(bg);

  // suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (settings.animationsEnabled) triggerCelebration();
    playSound("success", settings.soundEffects);
    setInput(suggestion);

    setTimeout(() => {
      if (!suggestion.trim()) return;
      setIsFirstMessage(false);
      const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const userMessage = { role: "human", type: "text", content: suggestion, timestamp };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      sendToAI(newMessages);
    }, 300);
  };

  // send message
  const sendMessage = async () => {
    if (!input.trim()) return;
    playSound("send", settings.soundEffects);
    if (isFirstMessage) setIsFirstMessage(false);

    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const userMessage = { role: "human", type: "text", content: input, timestamp };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendToAI(newMessages);
  };

  // main AI call
  async function sendToAI(newMessages) {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/chat";

      const formattedMessages = newMessages.map((msg) => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : msg.content.answer || JSON.stringify(msg.content),
        type: msg.type || "text",
      }));

      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_history: formattedMessages }),
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const data = await res.json();
      const rawAnswer = data.answer || "🤖 I'm here to help!";
      const responseType = data.type || "text";

      const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      let messageBlock;
      if (responseType === "greeting") {
        messageBlock = { role: "ai", type: "greeting", content: rawAnswer, timestamp };
      } else if (responseType === "decline") {
        messageBlock = { role: "ai", type: "decline", content: rawAnswer, timestamp };
      } else if (responseType === "structured") {
        const parsed = parseStructuredAnswer(rawAnswer);
        messageBlock = { role: "ai", type: "structured", content: parsed, timestamp };
      } else {
        messageBlock = { role: "ai", type: "text", content: rawAnswer, timestamp };
      }

      setMessages((prev) => [...prev, messageBlock]);
      playSound("success", settings.soundEffects);
    } catch (error) {
      console.error("[ERROR]", error);
      const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { role: "ai", type: "error", content: "⚠️ Oops! Couldn't connect to AI Shine's server.", timestamp },
      ]);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  // structured answer helper
  function parseStructuredAnswer(rawAnswer) {
    const parts = rawAnswer.split(/\*\*Key Points:\*\*|<strong>Key Points:<\/strong>/i);
    if (parts.length === 2) {
      const answerPart = parts[0].replace(/\*\*Answer:\*\*|<strong>Answer:<\/strong>/gi, "").trim();
      const keyPointsPart = parts[1].trim();
      const keyPoints = keyPointsPart
        .split(/\n|<li>/)
        .map((line) => line.replace(/<\/?[^>]+(>|$)/g, "").replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
      return { answer: answerPart, keyPoints };
    }
    return { answer: rawAnswer, keyPoints: [] };
  }

  // textarea autosize
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const maxHeight = 120;
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
    e.target.style.overflowY = e.target.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  // clear chat
  const handleClearChat = () => {
    setMessages([]);
    setInput("");
    setIsFirstMessage(true);
    setFeedback({});
    setGradientIndex(Math.floor(Math.random() * WELCOME_GRADIENTS.length));
    playSound("click", settings.soundEffects);
    toast.success("Chat cleared!");
  };

  // feedback
  const handleFeedback = (messageIndex, type) => {
    setFeedback((prev) => {
      const newFeedback = { ...prev };
      if (newFeedback[messageIndex] === type) delete newFeedback[messageIndex];
      else newFeedback[messageIndex] = type;
      return newFeedback;
    });
    playSound("click", settings.soundEffects);
    if (type !== null) {
      toast.success("Thanks for your feedback!");
      const storedFeedback = JSON.parse(localStorage.getItem("aiFeedback") || "[]");
      storedFeedback.push({ messageIndex, type, timestamp: new Date().toISOString(), message: messages[messageIndex]?.content });
      localStorage.setItem("aiFeedback", JSON.stringify(storedFeedback));
    }
  };

  // copy
  const handleCopy = (content, index) => {
    const textToCopy = typeof content === "string" ? content : content.answer + "\n\nKey Points:\n" + (content.keyPoints?.join("\n") || "");
    navigator.clipboard.writeText(textToCopy.replace(/<[^>]*>/g, ""));
    setCopiedIndex(index);
    playSound("success", settings.soundEffects);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // speak
  const handleSpeak = (content) => {
    if (speaking) cancel();
    else {
      const textToSpeak = typeof content === "string" ? content.replace(/<[^>]*>/g, "") : content.answer.replace(/<[^>]*>/g, "") + ". Key Points: " + (content.keyPoints?.join(". ") || "");
      speak(textToSpeak);
    }
  };

  // share
  const handleShare = async (content) => {
    playSound("click", settings.soundEffects);
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Shine Response", text: typeof content === "string" ? content.replace(/<[^>]*>/g, "") : content.answer.replace(/<[^>]*>/g, "") });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      toast.error("Sharing not supported on this browser");
    }
  };

  // export pdf
  const handleExportPDF = async () => {
    playSound("click", settings.soundEffects);
    toast.loading("Generating PDF...");
    try {
      await exportToPDF(messages, sessionDate);
      toast.dismiss();
      toast.success("PDF downloaded!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate PDF");
      console.error("PDF error:", error);
    }
  };

  // toggle listening
  const toggleListening = () => {
    if (speechRecognition.listening) speechRecognition.stopListening();
    else {
      const started = speechRecognition.startListening();
      if (started) playSound("click", settings.soundEffects);
      else toast.error("Speech recognition not supported in this browser. Try Chrome or Edge.");
    }
  };

  // UI layout helpers
  const containerBg = settings.focusMode
    ? "bg-gray-900"
    : settings.bedtimeMode
    ? `${BACKGROUND_MAP[previewBackground || settings.background]} brightness-75 saturate-50`
    : BACKGROUND_MAP[previewBackground || settings.background];

  return (
    <>
      <Toaster position="top-center" />
<main className="fixed inset-0 flex flex-col overflow-hidden">
      
        {/* Background layers */}
        <div className={`absolute inset-0 ${containerBg} bg-cover bg-center bg-fixed transition-all duration-500 -z-20`} />
        
        {/* focus mode layered background */}
        {settings.focusMode && (
          <>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md sm:backdrop-blur-2xl -z-10" />
            <div
              className="absolute inset-0 opacity-[0.02] -z-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
              }}
            />
          </>
        )}

        {/* dark overlay for bedtime/dark but not focus */}
        {settings.isDarkMode && !settings.focusMode && <div className="absolute inset-0 bg-black/80 -z-10" />}

        {/* Settings modal */}
        <SettingsModal
          show={showSettings}
          onClose={() => {
            setShowSettings(false);
            setPreviewBackground(null);
          }}
          settings={settings}
          availableVoices={availableVoices}
          playSound={(type) => playSound(type, settings.soundEffects)}
          onPreviewBackground={handlePreviewBackground}
        />

        {/* Header - Fixed at top (only shown when chat started) */}
        {!isFirstMessage && (
          <div className="w-full flex-shrink-0 z-40 px-3 sm:px-6 py-2 backdrop-blur-sm bg-white/5">
            <Header
              onClearChat={handleClearChat}
              onExportPDF={handleExportPDF}
              focusMode={settings.focusMode}
              bedtimeMode={settings.bedtimeMode}
              setFocusMode={settings.setFocusMode}
              playSound={(type) => playSound(type, settings.soundEffects)}
              currentBackground={previewBackground || settings.background}
              onResetToLanding={() => {
                setMessages([]);
                setInput("");
                setIsFirstMessage(true);
                setFeedback({});
                playSound("click", settings.soundEffects);
              }}
            />
          </div>
        )}

        {/* Main content area - Fixed height, no scroll on landing */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Landing screen (fixed, no scroll) */}
          {isFirstMessage && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <LandingScreen
                greeting={getGreeting()}
                gradientIndex={gradientIndex}
                hoveredSuggestion={hoveredSuggestion}
                setHoveredSuggestion={setHoveredSuggestion}
                onSuggestionClick={handleSuggestionClick}
                animationsEnabled={settings.animationsEnabled}
              />
            </div>
          )}

          {/* Chat messages container (with scroll) */}
          {!isFirstMessage && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <motion.div
                initial={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 ${FONT_FAMILY_MAP[settings.fontFamily]} ${FONT_SIZE_MAP[settings.fontSize]} ${settings.fontWeight === 'bold' ? 'font-bold' : settings.fontWeight === 'italic' ? 'italic' : ''}`}
              >
                {/* session date */}
                <div className="flex justify-center mb-4">
                  <div className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium ${settings.focusMode ? 'bg-white/10 text-white backdrop-blur-md' : settings.bedtimeMode ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-gray-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {sessionDate}
                  </div>
                </div>

                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <ChatMessage
                      key={idx}
                      message={msg}
                      index={idx}
                      isUser={msg.role === "human"}
                      feedback={feedback}
                      copiedIndex={copiedIndex}
                      speaking={speaking}
                      onFeedback={handleFeedback}
                      onCopy={handleCopy}
                      onSpeak={settings.ttsEnabled ? handleSpeak : () => toast.error("TTS is disabled")}
                      onShare={handleShare}
                      fontSizeMap={FONT_SIZE_MAP}
                      fontSize={settings.fontSize}
                      focusMode={settings.focusMode}
                      bedtimeMode={settings.bedtimeMode}
                      currentBackground={settings.background}
                    />
                  ))}
                </AnimatePresence>

                {loading && (
                  <div className="flex justify-start animate-pulse">
                    <div className={`px-3 sm:px-4 md:px-5 py-2 sm:py-3 rounded-2xl font-semibold shadow-md flex items-center gap-2 sm:gap-3 ${settings.focusMode ? 'bg-white/10 text-white backdrop-blur-md' : settings.bedtimeMode ? 'bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff] text-gray-700' : 'bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500 text-white'}`}>
                      <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full animate-spin border-white/50 border-t-transparent"></span>
                      <span className="text-xs sm:text-sm md:text-base">🤔 AI Shine is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </motion.div>
            </div>
          )}
        </div>

        {/* Input area - Fixed at bottom */}
        <div className="w-full flex-shrink-0 z-50">
          <div className={`w-full ${isFirstMessage ? 'px-3 sm:px-4 md:px-6 py-3 sm:py-4' : ''}`}>
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
                playSound("click", settings.soundEffects);
              }}
              onTextareaChange={handleTextareaChange}
              animationsEnabled={settings.animationsEnabled}
            />
          </div>
        </div>
      </main>
    </>
  );
}
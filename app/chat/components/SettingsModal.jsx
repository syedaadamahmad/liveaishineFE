import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Type, 
  Volume2, 
  Zap, 
  Focus,
  HelpCircle,
  Film
} from 'lucide-react';
import { useState } from 'react';
import { BACKGROUND_MAP } from '../utils/constants';

const SETTINGS_CATEGORIES = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'accessibility', label: 'Accessibility', icon: Type },
  { id: 'audio', label: 'Audio & Voice', icon: Volume2 },
  { id: 'modes', label: 'Modes', icon: Focus }
];

const TOOLTIPS = {
  theme: "Choose between light, dark, or system-based theme",
  fontSize: "Adjust text size for better readability",
  fontFamily: "Select font family (Lexend is dyslexia-friendly)",
  background: "Choose background style for the chat interface. Hover to preview, click to apply.",
  fontWeight: "Change text appearance (regular, bold, or italic)",
  soundEffects: "Enable or disable click and notification sounds",
  bedtimeMode: "Reduces blue light with warm colors for nighttime use",
  ttsVoice: "Select the voice for text-to-speech",
  speechRate: "Adjust how fast the AI speaks",
  speechPitch: "Change the pitch (tone) of the AI voice",
  speechVolume: "Control the volume of text-to-speech",
  focusMode: "Minimalist interface with no distractions",
  animations: "Enable or disable animations throughout the app",
  ttsToggle: "Turn text-to-speech on or off completely"
};

function Tooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        type="button"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-6 top-0 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl z-50 pointer-events-none"
          >
            {text}
            <div className="absolute left-0 top-2 w-2 h-2 bg-gray-900 transform -translate-x-1 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsModal({ 
  show, 
  onClose, 
  settings, 
  availableVoices, 
  playSound,
  onPreviewBackground
}) {
  const [activeCategory, setActiveCategory] = useState('appearance');

  if (!show) return null;

  const {
    theme, setTheme,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    background, setBackground,
    fontWeight, setFontWeight,
    soundEffects, setSoundEffects,
    bedtimeMode, setBedtimeMode,
    focusMode, setFocusMode,
    animationsEnabled, setAnimationsEnabled,
    ttsEnabled, setTtsEnabled,
    ttsSettings, setTtsSettings,
    selectedVoice, setSelectedVoice,
    isDarkMode
  } = settings;

  const glassStyle = !bedtimeMode
    ? "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl"
    : "bg-[#e0e5ec] shadow-[8px_8px_16px_#b8bdc4,-8px_-8px_16px_#ffffff]";

  const textColor = bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-900 dark:text-white';
  const labelColor = bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-700 dark:text-gray-300';

  const buttonGlassStyle = !bedtimeMode
    ? "bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/30 dark:border-gray-700/30"
    : "bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bdc4,-4px_-4px_8px_#ffffff]";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`${glassStyle} rounded-3xl max-w-4xl w-full h-[80vh] flex overflow-hidden`}
          >
            {/* Sidebar */}
            <div className={`w-64 ${bedtimeMode ? 'bg-[#e0e5ec]' : 'bg-white/30 dark:bg-gray-800/30'} border-r ${bedtimeMode ? '' : 'border-white/20 dark:border-gray-700/30'} p-4`}>
              <div className="flex items-center gap-2 mb-6 px-2">
                <Settings className={`w-6 h-6 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-purple-600'}`} />
                <h2 className={`text-xl font-bold ${textColor}`}>Settings</h2>
              </div>

              <nav className="space-y-2">
                {SETTINGS_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      playSound('click');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      activeCategory === category.id
                        ? bedtimeMode
                          ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : bedtimeMode
                          ? 'hover:bg-[#d1d6dc] text-[#1a0f08]'
                          : 'hover:bg-white/20 dark:hover:bg-gray-700/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <category.icon className={`w-5 h-5 ${bedtimeMode && activeCategory !== category.id ? 'text-[#1a0f08]' : ''}`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>  
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {SETTINGS_CATEGORIES.find(c => c.id === activeCategory)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className={`${bedtimeMode ? 'text-[#1a0f08] hover:text-[#000]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'} text-2xl cursor-pointer`}
                >
                  ✕
                </button>
              </div>

              {/* Appearance Settings */}
              {activeCategory === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Theme</label>
                      <Tooltip text={TOOLTIPS.theme} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', icon: Sun, label: 'Light' },
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'system', icon: Monitor, label: 'System' }
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => {
                            setTheme(t.value);
                            playSound('click');
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer ${
                            theme === t.value
                              ? bedtimeMode
                                ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
                                : 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : `${buttonGlassStyle} ${bedtimeMode ? 'text-[#1a0f08]' : ''}`
                          }`}
                        >
                          <t.icon className={`w-6 h-6 ${bedtimeMode ? 'text-[#1a0f08]' : ''}`} />
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Background</label>
                      <Tooltip text={TOOLTIPS.background} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'moon', label: 'Moon' },
                        { value: 'ocean', label: 'Ocean' },
                        { value: 'beach', label: 'Beach' },
                        { value: 'forest', label: 'Forest' },
                        { value: 'sunset', label: 'Sunset' },
                        { value: 'twilight', label: 'Twilight' }
                      ].map((bg) => (
                        <button
                          key={bg.value}
                          onClick={() => {
                            setBackground(bg.value);
                            playSound('click');
                          }}
                          onMouseEnter={() => onPreviewBackground(bg.value)}
                          onMouseLeave={() => onPreviewBackground(background)}
                          className={`p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                            background === bg.value
                              ? bedtimeMode
                                ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
                                : 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : `${buttonGlassStyle} ${bedtimeMode ? 'text-[#1a0f08]' : ''}`
                          }`}
                        >
                          <div className={`absolute inset-0 opacity-20 ${BACKGROUND_MAP[bg.value]}`} />
                          <span className="text-sm font-medium relative z-10">{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Accessibility Settings */}
              {activeCategory === 'accessibility' && (
                <div className="space-y-6">
                  {/* Font Size */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Font Size</label>
                      <Tooltip text={TOOLTIPS.fontSize} />
                    </div>
                    <div className="flex gap-2">
                      {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setFontSize(size);
                            playSound('click');
                          }}
                          className={`flex-1 py-3 rounded-xl transition-all cursor-pointer ${
                            fontSize === size
                              ? bedtimeMode
                                ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
                                : 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : `${buttonGlassStyle} ${bedtimeMode ? 'text-[#1a0f08]' : ''}`
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Font Family</label>
                      <Tooltip text={TOOLTIPS.fontFamily} />
                    </div>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        playSound('click');
                      }}
                      className={`w-full p-3 rounded-xl ${buttonGlassStyle} ${textColor} cursor-pointer`}
                    >
                      <option value="standard">Standard (Sans-serif)</option>
                      <option value="lexend">Lexend (Dyslexia-friendly)</option>
                      <option value="times">Times New Roman</option>
                    </select>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Font Weight</label>
                      <Tooltip text={TOOLTIPS.fontWeight} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'regular', label: 'Regular' },
                        { value: 'bold', label: 'Bold' },
                        { value: 'italic', label: 'Italic' }
                      ].map((fw) => (
                        <button
                          key={fw.value}
                          onClick={() => {
                            setFontWeight(fw.value);
                            playSound('click');
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer ${
                            fontWeight === fw.value
                              ? bedtimeMode
                                ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bdc4,inset_-4px_-4px_8px_#ffffff] text-[#1a0f08]'
                                : 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : `${buttonGlassStyle} ${bedtimeMode ? 'text-[#1a0f08]' : ''}`
                          }`}
                        >
                          {fw.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Audio & Voice Settings */}
              {activeCategory === 'audio' && (
                <div className="space-y-6">
                  {/* TTS Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${buttonGlassStyle}`}>
                    <div className="flex items-center">
                      <span className={`text-sm font-semibold ${labelColor}`}>Text-to-Speech</span>
                      <Tooltip text={TOOLTIPS.ttsToggle} />
                    </div>
                    <button
                      onClick={() => {
                        setTtsEnabled(!ttsEnabled);
                        playSound('click');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        ttsEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ttsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* TTS Voice */}
                  <div>
                    <div className="flex items-center mb-3">
                      <label className={`text-sm font-semibold ${labelColor}`}>Voice Selection</label>
                      <Tooltip text={TOOLTIPS.ttsVoice} />
                    </div>
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const voice = availableVoices.find(v => v.name === e.target.value);
                        setSelectedVoice(voice);
                        playSound('click');
                      }}
                      disabled={!ttsEnabled}
                      className={`w-full p-3 rounded-xl ${buttonGlassStyle} ${textColor} disabled:opacity-50 cursor-pointer`}
                    >
                      <option value="">Default Voice</option>
                      {availableVoices.map((voice, idx) => (
                        <option key={idx} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <label className={`text-sm font-semibold ${labelColor}`}>Speech Rate</label>
                        <Tooltip text={TOOLTIPS.speechRate} />
                      </div>
                      <span className={`text-xs ${bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-600 dark:text-gray-400'}`}>{ttsSettings.rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={ttsSettings.rate}
                      onChange={(e) => {
                        setTtsSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }));
                        playSound('click');
                      }}
                      disabled={!ttsEnabled}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
                    />
                  </div>

                  {/* Speech Pitch */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <label className={`text-sm font-semibold ${labelColor}`}>Speech Pitch</label>
                        <Tooltip text={TOOLTIPS.speechPitch} />
                      </div>
                      <span className={`text-xs ${bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-600 dark:text-gray-400'}`}>{ttsSettings.pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={ttsSettings.pitch}
                      onChange={(e) => {
                        setTtsSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }));
                        playSound('click');
                      }}
                      disabled={!ttsEnabled}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
                    />
                  </div>

                  {/* Speech Volume */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <label className={`text-sm font-semibold ${labelColor}`}>Speech Volume</label>
                        <Tooltip text={TOOLTIPS.speechVolume} />
                      </div>
                      <span className={`text-xs ${bedtimeMode ? 'text-[#1a0f08]' : 'text-gray-600 dark:text-gray-400'}`}>{Math.round(ttsSettings.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={ttsSettings.volume}
                      onChange={(e) => {
                        setTtsSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }));
                        playSound('click');
                      }}
                      disabled={!ttsEnabled}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
                    />
                  </div>

                  {/* Sound Effects */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${buttonGlassStyle}`}>
                    <div className="flex items-center">
                      <Zap className={`w-5 h-5 mr-2 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-yellow-500'}`} />
                      <span className={`text-sm font-semibold ${labelColor}`}>Sound Effects</span>
                      <Tooltip text={TOOLTIPS.soundEffects} />
                    </div>
                    <button
                      onClick={() => {
                        setSoundEffects(!soundEffects);
                        if (!soundEffects) playSound('click');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        soundEffects ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEffects ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Modes Settings */}
              {activeCategory === 'modes' && (
                <div className="space-y-6">
                  {/* Bedtime Mode */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${buttonGlassStyle}`}>
                    <div className="flex items-center">
                      <Moon className={`w-5 h-5 mr-2 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-indigo-500'}`} />
                      <span className={`text-sm font-semibold ${labelColor}`}>Bedtime Mode</span>
                      <Tooltip text={TOOLTIPS.bedtimeMode} />
                    </div>
                    <button
                      onClick={() => {
                        setBedtimeMode(!bedtimeMode);
                        playSound('click');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        bedtimeMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          bedtimeMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Focus Mode */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${buttonGlassStyle}`}>
                    <div className="flex items-center">
                      <Focus className={`w-5 h-5 mr-2 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-blue-500'}`} />
                      <span className={`text-sm font-semibold ${labelColor}`}>Focus Mode</span>
                      <Tooltip text={TOOLTIPS.focusMode} />
                    </div>
                    <button
                      onClick={() => {
                        setFocusMode(!focusMode);
                        playSound('click');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        focusMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          focusMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Animations Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${buttonGlassStyle}`}>
                    <div className="flex items-center">
                      <Film className={`w-5 h-5 mr-2 ${bedtimeMode ? 'text-[#1a0f08]' : 'text-pink-500'}`} />
                      <span className={`text-sm font-semibold ${labelColor}`}>Animations</span>
                      <Tooltip text={TOOLTIPS.animations} />
                    </div>
                    <button
                      onClick={() => {
                        setAnimationsEnabled(!animationsEnabled);
                        playSound('click');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        animationsEnabled ? 'bg-pink-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



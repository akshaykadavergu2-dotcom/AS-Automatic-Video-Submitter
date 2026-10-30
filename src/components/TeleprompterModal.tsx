import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, FlipHorizontal, ZoomIn, ZoomOut } from 'lucide-react';

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  title: string;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  scriptText,
  title,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // 1 to 5
  const [fontSize, setFontSize] = useState(42);
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const step = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += speed * 0.7;
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speed]);

  if (!isOpen) return null;

  const handleReset = () => {
    setIsPlaying(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Teleprompter Top Control Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
          <h2 className="text-lg font-bold font-telugu truncate max-w-md">
            స్టూడియో ప్రాంప్టర్: {title || 'యాంకర్ స్క్రిప్ట్'}
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'పాజ్ (Pause)' : 'స్టార్ట్ (Start)'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Reset to top"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed slider */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 font-semibold">స్పీడ్:</span>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 accent-red-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-amber-400">{speed}x</span>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setFontSize((f) => Math.max(24, f - 4))}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(80, f + 4))}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Mirror Flip */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isMirrored
                ? 'bg-red-600/30 border-red-500 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Mirror Mode for Glass Teleprompters"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 cursor-pointer"
            title="Exit Prompter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prompter Scrolling Area */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-8 lg:px-32 py-20 text-center select-none transition-transform ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      >
        {/* Anchor Eye-level Guide Marker */}
        <div className="fixed top-1/2 left-0 right-0 h-0.5 bg-red-600/30 pointer-events-none flex items-center justify-between px-6">
          <span className="text-[11px] font-bold text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
            EYE LEVEL
          </span>
          <span className="text-[11px] font-bold text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
            EYE LEVEL
          </span>
        </div>

        <div
          className="font-telugu leading-relaxed text-slate-100 font-semibold tracking-wide max-w-4xl mx-auto space-y-8"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className="text-amber-400 text-2xl font-bold tracking-widest uppercase mb-6">
            🔴 PRAJA SANKETAM NEWSROOM • ON AIR
          </div>

          {scriptText ? (
            scriptText.split('\n').map((line, idx) => (
              <p
                key={idx}
                className={
                  line.startsWith('[') || line.startsWith('•')
                    ? 'text-amber-300/90 text-2xl italic font-normal py-2'
                    : 'py-2 drop-shadow'
                }
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-slate-500">యాంకర్ స్క్రిప్ట్ ఇంకా లోడ్ కాలేదు...</p>
          )}

          <div className="pt-40 text-slate-600 text-xl font-bold">
            — అంతం (END OF BULLETIN) —
          </div>
        </div>
      </div>
    </div>
  );
};

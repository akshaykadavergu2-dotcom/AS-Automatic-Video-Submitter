import React, { useState, useEffect } from 'react';
import { Play, Sparkles, ArrowRight, Zap, CheckCircle2, ShieldCheck, Video, Share2, RefreshCw } from 'lucide-react';

interface ASWelcomeScreenProps {
  onEnter: () => void;
  onSkip: () => void;
}

export const ASWelcomeScreen: React.FC<ASWelcomeScreenProps> = ({ onEnter, onSkip }) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimationStep(1), 300); // Ring reveal
    const t2 = setTimeout(() => setAnimationStep(2), 1100); // Logo text pop
    const t3 = setTimeout(() => setAnimationStep(3), 1900); // Title & Tagline fade in
    const t4 = setTimeout(() => setAnimationStep(4), 2600); // Action buttons & features
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a12] text-white overflow-hidden select-none">
      {/* Background ambient colorful glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Bar Skip Intro Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
        >
          Skip Intro
        </button>
      </div>

      {/* Center Animated Presentation */}
      <div className="relative z-10 max-w-2xl w-full px-6 flex flex-col items-center text-center">
        {/* 1. Colorful Circular Animated Logo Reveal */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer Rotating Conic Gradient Ring */}
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[3px] transition-all duration-1000 ${
              animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
            style={{
              background: 'conic-gradient(from 0deg, #8b5cf6, #06b6d4, #ec4899, #3b82f6, #8b5cf6)',
              animation: 'spin 8s linear infinite',
            }}
          >
            <div className="w-full h-full rounded-full bg-[#070a12] p-1.5 flex items-center justify-center">
              {/* Secondary pulsating inner ring */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900/90 to-[#0b1020] border border-cyan-500/30 flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_25px_rgba(6,182,212,0.25)]">
                {/* Subtle sheen highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Central "AS" Monogram */}
                <div
                  className={`flex items-baseline justify-center font-black tracking-tight transition-all duration-700 ${
                    animationStep >= 2
                      ? 'scale-100 opacity-100 translate-y-0'
                      : 'scale-75 opacity-0 translate-y-2'
                  }`}
                >
                  <span className="text-4xl sm:text-5xl font-sans bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(6,182,212,0.5)]">
                    A
                  </span>
                  <span className="text-4xl sm:text-5xl font-sans bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(236,72,153,0.5)]">
                    S
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exterior Glow Aura */}
          <div
            className={`absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-cyan-500/20 blur-xl pointer-events-none transition-opacity duration-1000 ${
              animationStep >= 1 ? 'opacity-80' : 'opacity-0'
            }`}
          />
        </div>

        {/* 2. Welcome Title & Tagline */}
        <div
          className={`space-y-3 transition-all duration-700 ${
            animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-700/50 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>AI News & Video Automation Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            WELCOME TO <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">AS</span>
          </h1>

          <h2 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-200">
            AUTOMATIC VIDEO SUBMITTER
          </h2>

          <p className="text-sm sm:text-base font-medium text-slate-400 max-w-lg mx-auto">
            Connect <span className="text-cyan-400">·</span> Automate <span className="text-pink-400">·</span> Edit <span className="text-purple-400">·</span> Publish
          </p>

          <p className="text-xs text-slate-500 max-w-md mx-auto pt-1 font-telugu">
            X వార్తా సేకరణ, జెమిని AI విశ్లేషణ, 16:9 &amp; 9:16 బ్రాండింగ్ వీడియోలు మరియు ఫేస్‌బుక్ ఆటో-పబ్లిషింగ్
          </p>
        </div>

        {/* 3. 4-Pillar Feature Showcase */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full my-7 transition-all duration-700 ${
            animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-2">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">X News Collection</p>
            <p className="text-[11px] text-slate-400">Selected + Following</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">Gemini AI Writer</p>
            <p className="text-[11px] text-slate-400">Crisp Telugu scripts</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-pink-950/80 border border-pink-800/60 flex items-center justify-center text-pink-400 mb-2">
              <Video className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">FFmpeg Studio</p>
            <p className="text-[11px] text-slate-400">16:9 &amp; 9:16 Overlays</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-2">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">24/7 Cloud Worker</p>
            <p className="text-[11px] text-slate-400">FB Auto-Publish</p>
          </div>
        </div>

        {/* 4. Action CTA */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-3 transition-all duration-700 ${
            animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-600 hover:from-cyan-400 hover:via-pink-400 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40 hover:shadow-cyan-900/40 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Enter AS Studio Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSkip}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            Don't show this intro next time
          </button>
        </div>
      </div>
    </div>
  );
};

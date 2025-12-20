import React, { useState, useEffect } from 'react';
import { TreeCanvas } from './components/TreeCanvas';
import { Controls } from './components/Controls';
import { TreeSettings } from './types';
import { audioManager } from './utils/audio';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<TreeSettings>({
    rotationSpeed: 0.003,
    lightColor: 'warm',
    snowDensity: 100,
    musicEnabled: false,
    isAutoRotating: true
  });

  const [hasStarted, setHasStarted] = useState(false);

  // Audio effect hook
  useEffect(() => {
    if (hasStarted) {
      if (settings.musicEnabled) {
        audioManager.start();
      } else {
        audioManager.stop();
      }
    }
  }, [settings.musicEnabled, hasStarted]);

  const handleStart = () => {
    setHasStarted(true);
    setSettings(prev => ({ ...prev, musicEnabled: true }));
  };

  if (!hasStarted) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white relative overflow-hidden">
        {/* Simple ambient background for loading screen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"></div>
        
        <div className="z-10 text-center px-4">
          <h1 className="font-['Mountains_of_Christmas'] text-6xl md:text-8xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 animate-pulse">
            LuminaTree
          </h1>
          <p className="font-['Zen_Maru_Gothic'] text-blue-200/80 mb-12 text-lg">
            A Virtual Christmas Experience
          </p>
          
          <button 
            onClick={handleStart}
            className="group relative px-8 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-3 font-bold tracking-widest uppercase text-sm">
              <Sparkles className="w-5 h-5 text-yellow-400 group-hover:animate-spin" />
              Enter the Magic
            </span>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <TreeCanvas settings={settings} />
      
      {/* Overlay Title */}
      <div className="absolute top-8 left-0 w-full text-center pointer-events-none">
        <h1 className="font-['Mountains_of_Christmas'] text-4xl text-white/50 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Merry Christmas
        </h1>
      </div>

      <Controls settings={settings} setSettings={setSettings} />
    </div>
  );
}

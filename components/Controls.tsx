import React from 'react';
import { TreeSettings } from '../types';
import { Settings2, Music, PauseCircle, PlayCircle, RefreshCw, Palette } from 'lucide-react';

interface ControlsProps {
  settings: TreeSettings;
  setSettings: React.Dispatch<React.SetStateAction<TreeSettings>>;
}

export const Controls: React.FC<ControlsProps> = ({ settings, setSettings }) => {
  
  const toggleMusic = () => {
    setSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  };

  const toggleRotation = () => {
    setSettings(prev => ({ ...prev, isAutoRotating: !prev.isAutoRotating }));
  };

  const cycleColor = () => {
    const modes: TreeSettings['lightColor'][] = ['warm', 'cool', 'multicolor'];
    const currentIdx = modes.indexOf(settings.lightColor);
    const nextIdx = (currentIdx + 1) % modes.length;
    setSettings(prev => ({ ...prev, lightColor: modes[nextIdx] }));
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 shadow-2xl flex items-center gap-6 text-white/90">
        
        {/* Rotation Control */}
        <button 
          onClick={toggleRotation}
          className={`flex flex-col items-center gap-1 transition-all hover:text-yellow-300 ${settings.isAutoRotating ? 'text-yellow-400' : 'text-gray-400'}`}
          title="Toggle Rotation"
        >
          <RefreshCw size={20} className={settings.isAutoRotating ? 'animate-spin-slow' : ''} />
          <span className="text-[10px] uppercase tracking-wider font-bold">Spin</span>
        </button>

        <div className="w-px h-8 bg-white/10" />

        {/* Color Control */}
        <button 
          onClick={cycleColor}
          className="flex flex-col items-center gap-1 transition-all hover:text-pink-300"
          title="Change Lights"
        >
          <Palette size={20} className="text-pink-400" />
          <span className="text-[10px] uppercase tracking-wider font-bold">{settings.lightColor}</span>
        </button>

        <div className="w-px h-8 bg-white/10" />

        {/* Music Control */}
        <button 
          onClick={toggleMusic}
          className={`flex flex-col items-center gap-1 transition-all hover:text-cyan-300 ${settings.musicEnabled ? 'text-cyan-400' : 'text-gray-400'}`}
          title="Toggle Ambience"
        >
          {settings.musicEnabled ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
          <span className="text-[10px] uppercase tracking-wider font-bold">Audio</span>
        </button>

      </div>
    </div>
  );
};

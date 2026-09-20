import React from 'react';

export default function PlanetHorizon() {
  return (
    <div className="absolute inset-x-0 top-0 h-[650px] overflow-hidden pointer-events-none z-0 flex justify-center items-start">
      {/* Background vignette & ambient emerald radial glow */}
      <div className="absolute top-[-100px] w-[900px] h-[500px] bg-emerald-accent/15 rounded-full blur-[140px] opacity-70" />
      
      {/* Abstract planet arc horizon curve */}
      <div className="relative w-[1400px] h-[700px] mt-[120px] rounded-[100%] border-t border-emerald-accent/30 dark:bg-gradient-to-b dark:from-[#0F1D17]/40 dark:via-[#0A0D0B]/80 dark:to-[#080808] bg-gradient-to-b from-emerald-500/10 via-white/80 to-[#F5F5F7] shadow-[0_-25px_60px_-10px_rgba(46,230,166,0.12)]">
        {/* Subtle horizon atmospheric glow edge */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-accent/60 to-transparent blur-[1px]" />
      </div>

      {/* Grid overlay blend */}
      <div className="absolute inset-0 bg-grid opacity-30" />
    </div>
  );
}

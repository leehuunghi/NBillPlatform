import React from 'react';

// Nền chung: gradient nhẹ + vài hình tròn nổi lơ lửng cho vui mắt.
export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas font-sans text-ink">
      <div aria-hidden="true" className="blob-float pointer-events-none absolute -right-14 -top-20 h-60 w-60 rounded-full bg-sun/70 md:h-80 md:w-80" />
      <div
        aria-hidden="true"
        className="blob-float pointer-events-none absolute -left-20 bottom-24 h-52 w-52 rounded-full bg-mint/70 md:h-72 md:w-72"
        style={{ animationDelay: '-1.4s' }}
      />
      <div
        aria-hidden="true"
        className="blob-float pointer-events-none absolute left-[6%] top-[38%] hidden h-20 w-20 rounded-[30%] bg-[#FFD6E0]/80 md:block"
        style={{ animationDelay: '-2.2s' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

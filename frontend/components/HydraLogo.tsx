export function HydraLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central body */}
      <circle cx="50" cy="60" r="18" fill="#00ff41" opacity="0.15" stroke="#00ff41" strokeWidth="1.5" />
      {/* Three heads */}
      {/* Left head */}
      <circle cx="22" cy="28" r="10" fill="#00ff41" opacity="0.2" stroke="#00ff41" strokeWidth="1.5" />
      <line x1="32" y1="33" x2="42" y2="48" stroke="#00ff41" strokeWidth="1.5" opacity="0.6" />
      {/* Center head */}
      <circle cx="50" cy="18" r="10" fill="#00ff41" opacity="0.2" stroke="#00ff41" strokeWidth="1.5" />
      <line x1="50" y1="28" x2="50" y2="42" stroke="#00ff41" strokeWidth="1.5" opacity="0.6" />
      {/* Right head */}
      <circle cx="78" cy="28" r="10" fill="#00ff41" opacity="0.2" stroke="#00ff41" strokeWidth="1.5" />
      <line x1="68" y1="33" x2="58" y2="48" stroke="#00ff41" strokeWidth="1.5" opacity="0.6" />
      {/* Eyes on left head */}
      <circle cx="19" cy="26" r="2" fill="#00ff41" />
      <circle cx="25" cy="26" r="2" fill="#00ff41" />
      {/* Eyes on center head */}
      <circle cx="47" cy="16" r="2" fill="#00ff41" />
      <circle cx="53" cy="16" r="2" fill="#00ff41" />
      {/* Eyes on right head */}
      <circle cx="75" cy="26" r="2" fill="#00ff41" />
      <circle cx="81" cy="26" r="2" fill="#00ff41" />
      {/* Tail */}
      <path d="M38 72 Q50 85 62 72" stroke="#00ff41" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

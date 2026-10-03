import React, { useState } from 'react';

interface OldAlexCrestProps {
  className?: string;
  size?: number;
}

export const OldAlexCrest: React.FC<OldAlexCrestProps> = ({ className = '', size = 42 }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/crest.jpg"
        alt="Old Alex Hockey Club Crest"
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`rounded-xl object-cover shrink-0 shadow-sm border border-red-700/50 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // Exact vector fallback matching the authentic crest
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 rounded-xl overflow-hidden shadow-sm ${className}`}
      aria-label="Old Alex Hockey Club Crest"
    >
      {/* Scarlet Red Background */}
      <rect width="200" height="200" fill="#d9252c" />

      {/* Crossed Yellow Hockey Sticks */}
      <g stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Stick 1 (Top-Right to Bottom-Left) */}
        <path
          d="M142,32 L68,106 C62,112 52,110 46,104 C40,98 42,88 48,82 L122,12"
          fill="#ffd200"
          transform="rotate(90, 95, 59)"
        />
        {/* Stick 2 (Top-Left to Bottom-Right) */}
        <path
          d="M58,32 L132,106 C138,112 148,110 154,104 C160,98 158,88 152,82 L78,12"
          fill="#ffd200"
          transform="rotate(-90, 105, 59)"
        />
      </g>

      {/* Left Ball with Seam */}
      <circle cx="44" cy="65" r="9" fill="#ffd200" stroke="#1a1a1a" strokeWidth="1.8" />
      <line x1="35" y1="65" x2="53" y2="65" stroke="#1a1a1a" strokeWidth="1.8" />

      {/* Right Ball with Seam */}
      <circle cx="156" cy="65" r="9" fill="#ffd200" stroke="#1a1a1a" strokeWidth="1.8" />
      <line x1="147" y1="65" x2="165" y2="65" stroke="#1a1a1a" strokeWidth="1.8" />

      {/* Center White OA HC Letters */}
      <text
        x="100"
        y="65"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="#ffffff"
        letterSpacing="2"
      >
        OA
      </text>
      <text
        x="100"
        y="96"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="#ffffff"
        letterSpacing="2"
      >
        HC
      </text>

      {/* Yellow 1893 */}
      <text
        x="100"
        y="132"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="21"
        fontWeight="900"
        fill="#ffd200"
        letterSpacing="1"
      >
        1893
      </text>

      {/* Yellow OLD ALEX H.C. */}
      <text
        x="100"
        y="155"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#ffd200"
        letterSpacing="1.2"
      >
        OLD ALEX H.C.
      </text>
    </svg>
  );
};

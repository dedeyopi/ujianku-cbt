export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      className="w-full h-auto animate-float-slow"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="laptopGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Lingkaran latar */}
      <circle cx="200" cy="160" r="150" fill="url(#circleGrad)" />
      <circle
        cx="200"
        cy="160"
        r="120"
        stroke="#3b82f6"
        strokeOpacity="0.1"
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx="200"
        cy="160"
        r="90"
        stroke="#3b82f6"
        strokeOpacity="0.12"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 6"
      />

      {/* Laptop base */}
      <path d="M 100 230 L 300 230 L 312 248 L 88 248 Z" fill="url(#baseGrad)" />
      <rect x="100" y="230" width="200" height="2" fill="#0f172a" opacity="0.6" />
      <rect x="178" y="238" width="44" height="5" rx="2.5" fill="#0f172a" />

      {/* Laptop screen frame */}
      <rect
        x="110"
        y="86"
        width="180"
        height="146"
        rx="10"
        fill="url(#laptopGrad)"
      />

      {/* Screen */}
      <rect
        x="120"
        y="96"
        width="160"
        height="126"
        rx="6"
        fill="url(#screenGrad)"
      />

      {/* Top bar */}
      <rect x="130" y="106" width="55" height="7" rx="3.5" fill="#3b82f6" />
      <circle cx="258" cy="109.5" r="3" fill="#94a3b8" />
      <circle cx="268" cy="109.5" r="3" fill="#cbd5e1" />

      {/* Question lines */}
      <rect x="130" y="124" width="115" height="6" rx="3" fill="#475569" />
      <rect x="130" y="136" width="85" height="6" rx="3" fill="#94a3b8" />

      {/* Option 1 (unselected) */}
      <rect
        x="130"
        y="154"
        width="140"
        height="15"
        rx="7.5"
        fill="white"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <circle cx="140" cy="161.5" r="4" fill="#e2e8f0" />
      <rect x="149" y="159.5" width="60" height="4" rx="2" fill="#94a3b8" />

      {/* Option 2 (selected - blue) */}
      <rect x="130" y="173" width="140" height="15" rx="7.5" fill="#3b82f6" />
      <circle cx="140" cy="180.5" r="4" fill="white" />
      <circle cx="140" cy="180.5" r="2" fill="#3b82f6" />
      <rect x="149" y="178.5" width="55" height="4" rx="2" fill="white" />

      {/* Option 3 (unselected) */}
      <rect
        x="130"
        y="192"
        width="140"
        height="15"
        rx="7.5"
        fill="white"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <circle cx="140" cy="199.5" r="4" fill="#e2e8f0" />
      <rect x="149" y="197.5" width="70" height="4" rx="2" fill="#94a3b8" />

      {/* Timer badge */}
      <rect x="225" y="106" width="42" height="7" rx="3.5" fill="#fef3c7" />

      {/* Floating book */}
      <g transform="translate(38, 135) rotate(-12)">
        <rect width="52" height="64" rx="5" fill="url(#bookGrad)" />
        <rect
          x="4"
          y="4"
          width="44"
          height="56"
          rx="3"
          fill="white"
          opacity="0.15"
        />
        <rect x="10" y="16" width="32" height="3" rx="1.5" fill="white" opacity="0.8" />
        <rect x="10" y="24" width="24" height="3" rx="1.5" fill="white" opacity="0.5" />
        <rect x="10" y="32" width="28" height="3" rx="1.5" fill="white" opacity="0.5" />
        <rect x="10" y="40" width="20" height="3" rx="1.5" fill="white" opacity="0.4" />
      </g>

      {/* Floating graduation cap */}
      <g transform="translate(310, 82) rotate(14)">
        <path d="M 0 22 L 32 6 L 64 22 L 32 38 Z" fill="url(#capGrad)" />
        <path
          d="M 0 22 L 32 6 L 64 22 L 32 38 Z"
          fill="white"
          opacity="0.1"
          transform="translate(0, 3)"
        />
        <rect x="27" y="22" width="10" height="26" rx="2" fill="#6d28d9" />
        <circle cx="32" cy="52" r="4.5" fill="#fbbf24" />
        <circle cx="32" cy="52" r="2" fill="#f59e0b" />
      </g>

      {/* Sparkles */}
      <g fill="#3b82f6" opacity="0.7">
        <path d="M 345 175 L 348.5 185 L 358.5 188.5 L 348.5 192 L 345 202 L 341.5 192 L 331.5 188.5 L 341.5 185 Z" />
      </g>
      <g fill="#10b981" opacity="0.7">
        <path d="M 58 215 L 60.5 222.5 L 68 225 L 60.5 227.5 L 58 235 L 55.5 227.5 L 48 225 L 55.5 222.5 Z" />
      </g>

      {/* Floating dots */}
      <circle cx="70" cy="90" r="3.5" fill="#8b5cf6" opacity="0.6" />
      <circle cx="335" cy="255" r="4.5" fill="#3b82f6" opacity="0.5" />
      <circle cx="318" cy="220" r="2.5" fill="#6366f1" opacity="0.7" />
      <circle cx="82" cy="252" r="3" fill="#60a5fa" opacity="0.6" />

      {/* Dot grid */}
      <g fill="#94a3b8" opacity="0.35">
        <circle cx="30" cy="60" r="1.5" />
        <circle cx="45" cy="60" r="1.5" />
        <circle cx="60" cy="60" r="1.5" />
        <circle cx="30" cy="75" r="1.5" />
        <circle cx="45" cy="75" r="1.5" />
        <circle cx="60" cy="75" r="1.5" />
      </g>
    </svg>
  );
}
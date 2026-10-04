/**
 * Fuel & Lift mark: a flame (fuel — the energy from your food) with an up-arrow inside
 * (lift — getting stronger every week), resting on a barbell. Volt flame on a black tile, like the app.
 * Mirrors public/logo.svg.
 */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Fuel & Lift">
      <rect width="64" height="64" rx="15" fill="#0a0b0d" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#2a2e35" strokeWidth="1.5" />
      <path
        fill="#d4ff3a"
        fillRule="evenodd"
        d="M32 8.5C37.8 15.3 45 21.6 45 30.6 45 37.9 39.2 43 32 43S19 37.9 19 30.6c0-5.2 3.1-8.9 5.8-11.4.5 4.1 2.3 6.7 4.6 7.8C28.4 20.2 29.4 14.4 32 8.5ZM32 21.5l-6.6 8h4.3V38h4.6v-8.5h4.3Z"
      />
      <path fill="#0a0b0d" d="M32 21.5l-6.6 8h4.3V38h4.6v-8.5h4.3Z" />
      <g fill="#fff">
        <rect x="12" y="47.5" width="40" height="3" rx="1.5" />
        <rect x="15" y="43" width="4.5" height="12" rx="2" />
        <rect x="44.5" y="43" width="4.5" height="12" rx="2" />
        <rect x="20.5" y="44.8" width="3" height="8.4" rx="1.5" />
        <rect x="40.5" y="44.8" width="3" height="8.4" rx="1.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`headline text-ink ${className}`}>
      Fuel <span className="text-fit-blue">&amp;</span> Lift
    </span>
  );
}

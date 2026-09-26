/**
 * Fuel & Lift mark: a Fit-style progress ring (blue = training, green = nutrition)
 * around a dumbbell with a sprouting leaf. Mirrors public/logo.svg.
 */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Fuel & Lift">
      <circle cx="32" cy="32" r="24" fill="none" stroke="#34a853" strokeWidth="6.5" strokeLinecap="round" strokeDasharray="150.8" transform="rotate(-90 32 32)" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="var(--fit-blue)" strokeWidth="6.5" strokeLinecap="round" strokeDasharray="95 200" transform="rotate(-90 32 32)" />
      <g transform="rotate(-20 32 35)" fill="var(--fit-blue)">
        <rect x="19" y="33.5" width="26" height="3.5" rx="1.75" />
        <rect x="21.5" y="27" width="5" height="16.5" rx="2.2" />
        <rect x="37.5" y="27" width="5" height="16.5" rx="2.2" />
        <rect x="16.5" y="30" width="4" height="10.5" rx="1.8" />
        <rect x="43.5" y="30" width="4" height="10.5" rx="1.8" />
      </g>
      <path d="M31.2 25.5c-3.1-.3-5.2-2.4-5.3-5.6 3.1.2 5.2 2.4 5.3 5.6Z" fill="#34a853" />
      <path d="M31.2 25.5c.3-3.9 2.4-6.5 6.1-6.9-.2 3.8-2.4 6.4-6.1 6.9Z" fill="#34a853" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-medium tracking-tight text-ink ${className}`}>
      Fuel <span className="text-fit-green">&amp;</span> Lift
    </span>
  );
}

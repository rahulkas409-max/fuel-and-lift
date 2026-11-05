export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Forma"><rect width="64" height="64" rx="20" fill="#224f40" /><path d="M23 48V29c0-9 5-15 15-15h7v8h-6c-5 0-7 2-7 7v2h12v8H32v9Z" fill="#f4f2e9" /><circle cx="45" cy="46" r="5" fill="#c9dcab" /></svg>;
}
export function Wordmark({ className = "" }: { className?: string }) { return <span className={`font-semibold tracking-[-0.055em] text-ink ${className}`}>forma<span className="text-fit-blue">.</span></span>; }

import { EMOJI_SLUGS } from "@/lib/emoji-map";

/**
 * Renders an emoji as Microsoft Fluent Emoji artwork (consistent on every device),
 * falling back to the system glyph when there's no artwork for it.
 */
export function Emoji({ e, size = 24, className = "", label }: { e: string; size?: number; className?: string; label?: string }) {
  const slug = EMOJI_SLUGS[e.replace(/️/g, "")];
  if (!slug) {
    return (
      <span className={className} style={{ fontSize: size * 0.9, lineHeight: 1 }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        {e}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here
    <img src={`/emoji/${slug}.svg`} width={size} height={size} alt={label ?? ""} aria-hidden={label ? undefined : true} draggable={false} className={`inline-block select-none ${className}`} />
  );
}

/** A string of emoji (e.g. a 3-emoji riddle) as a row of artwork. */
export function EmojiRow({ text, size = 24, className = "" }: { text: string; size?: number; className?: string }) {
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((s) => s.segment) : Array.from(text);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {seg.filter((s) => s.trim()).map((s, i) => (
        <Emoji key={i} e={s} size={size} />
      ))}
    </span>
  );
}

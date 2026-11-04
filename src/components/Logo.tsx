/* UF monogram + orbit mark. Inline so `currentColor` follows the theme; the
 * node dot stays signal-green. Works down to 16px. Also saved as /logo.svg. */
export default function Logo({ className = "h-7 w-7", title = "Umar Fahm" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" role="img" aria-label={title} className={className}>
      <ellipse cx="16" cy="16" rx="13.5" ry="7" transform="rotate(-28 16 16)" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <circle cx="26.2" cy="9.6" r="2.3" fill="#34d399" />
      <g fill="currentColor">
        <path d="M8.3 10.5v6.1c0 1.7 1.2 2.8 3 2.8s3-1.1 3-2.8v-6.1h-1.8v6c0 .9-.5 1.4-1.2 1.4s-1.2-.5-1.2-1.4v-6H8.3z" />
        <path d="M17.6 10.5v8.7h1.8v-3.4h3v-1.6h-3v-2.1h3.4v-1.6h-5.2z" />
      </g>
    </svg>
  );
}

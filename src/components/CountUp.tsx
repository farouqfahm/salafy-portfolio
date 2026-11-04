"use client";
import { useEffect, useRef, useState } from "react";

/* Counts from 0 to `value`. The hero stats are near the top, so we animate
 * shortly after mount; below-the-fold uses are brought forward by an observer.
 * Shows the final number immediately under prefers-reduced-motion, and a safety
 * timer guarantees the real value is never left at 0. */
export default function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const [n, setN] = useState(value); // SSR + first paint show the real value
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    let hardStop = 0;
    const animate = () => {
      if (done.current) return;
      done.current = true;
      const start = performance.now();
      const dur = 900;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // If rAF never ticks (e.g. a background/offscreen tab), force the final
      // value so the number is never stuck mid-animation.
      hardStop = window.setTimeout(() => setN(value), dur + 400);
    };

    // Reset to 0 then animate up (client only), so the count-up is visible.
    setN(0);
    const el = ref.current;
    const r = el?.getBoundingClientRect();
    const inView = r ? r.top < (window.innerHeight || 0) * 1.1 && r.bottom > -50 : true;
    let io: IntersectionObserver | undefined;
    let t = 0;
    if (inView) {
      t = window.setTimeout(animate, 120);
    } else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            animate();
            io?.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      if (el) io.observe(el);
      // If it never scrolls into view, still show the real value.
      t = window.setTimeout(() => setN(value), 2000);
    }
    return () => {
      io?.disconnect();
      clearTimeout(t);
      clearTimeout(hardStop);
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}

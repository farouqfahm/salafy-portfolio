"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Load the chat assistant lazily (client only, after first idle) so it never
// blocks first paint. Until then nothing renders.
const Assistant = dynamic(() => import("./Assistant"), { ssr: false });

export default function LazyAssistant() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const run = () => setShow(true);
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(run);
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <Assistant />;
}

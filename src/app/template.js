"use client";

import { useEffect, useRef } from "react";

export default function Template({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Démarre invisible, quasiment immobile
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 1.4s très doux — comme une respiration
        el.style.transition =
          "opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), " +
          "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.opacity = "1";
        el.style.transform = "translateY(0px)";
      });
    });

    const timer = setTimeout(() => {
      if (el) { el.style.transition = ""; el.style.willChange = ""; }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(6px)", willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}

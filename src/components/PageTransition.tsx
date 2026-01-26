"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const initial = reduce ? { opacity: 1 } : { opacity: 0, y: 6 };
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };
  const exit = reduce ? { opacity: 1 } : { opacity: 0, y: -4 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ScrollFadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const ScrollFadeIn = ({ children, className = "", delay = 0 }: ScrollFadeInProps) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollFadeIn;

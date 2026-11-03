"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import type { MouseEventHandler, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DepthButtonProps {
  depth?: "subtle" | "raised";
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  glowColor?: string;
}

export function DepthButton({ className, children, depth = "raised", glowColor = "rgba(255,255,255,.72)", ...props }: DepthButtonProps) {
  const reduceMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}px ${glowY}px, ${glowColor}, rgba(0,110,255,0) 58%)`;

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!reduceMotion && event.pointerType === "mouse") {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      rotateX.set((0.5 - y / rect.height) * 7);
      rotateY.set((x / rect.width - 0.5) * 7);
      glowX.set(x);
      glowY.set(y);
    }
  };
  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.button
      {...props}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
      whileHover={reduceMotion ? undefined : { scale: 1.025 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
      className={cn("depth-button", depth === "subtle" && "depth-button-subtle", className)}
    >
      <motion.span aria-hidden="true" className="depth-glow" style={{ backgroundImage: glow }} />
      <span className="depth-content">{children}</span>
    </motion.button>
  );
}

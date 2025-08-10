"use client";

import { motion, type MotionProps } from "framer-motion";
import { ReactNode } from "react";

type ScaleInProps = MotionProps & {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function ScaleIn({ children, delay = 0, className, ...props }: ScaleInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      whileHover={{ scale: 1.02 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
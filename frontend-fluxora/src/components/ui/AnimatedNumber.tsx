"use client";
import { useEffect, useState } from "react";
import { useSpring, useTransform, motion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 0.8,
  delay = 0,
  decimals = 0,
  suffix = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const motionValue = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(motionValue, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      motionValue.set(value);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, delay, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [rounded]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
    >
      {displayValue}
      {suffix}
    </motion.span>
  );
}

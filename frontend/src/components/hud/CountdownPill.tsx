"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2 } from "lucide-react";

export interface CountdownPillProps {
  targetDate: string | Date;
  status?: "DRAFT" | "OPEN" | "JUDGING" | "SHORTLISTED" | "RESULTS_PUBLISHED" | "ARCHIVED";
  className?: string;
}

export function CountdownPill({
  targetDate,
  status = "OPEN",
  className = "",
}: CountdownPillProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    setIsMounted(true);
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (status === "RESULTS_PUBLISHED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-podium-gold/15 text-podium-gold border border-podium-gold/30 font-mono text-[10px] uppercase font-bold tracking-wider ${className}`}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>RESULTS PUBLISHED</span>
      </span>
    );
  }

  if (status === "JUDGING" || status === "SHORTLISTED" || timeLeft.isExpired) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-ai-indigo/15 text-[#818cf8] border border-ai-indigo/30 font-mono text-[10px] uppercase font-bold tracking-wider ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-ping" />
        <span>AI JUDGING IN PROGRESS</span>
      </span>
    );
  }

  if (!isMounted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider font-semibold border bg-surface-container-high/80 text-white border-white/10 ${className}`}
      >
        <Clock className="w-3 h-3 text-primary-container" />
        <span>CALCULATING...</span>
      </span>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider font-semibold border ${
        isUrgent
          ? "bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse"
          : "bg-surface-container-high/80 text-white border-white/10"
      } ${className}`}
    >
      <Clock className={`w-3 h-3 ${isUrgent ? "text-amber-400" : "text-primary-container"}`} />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}D `}
        {`${timeLeft.hours}H ${timeLeft.minutes}M `}
        <span className="opacity-80 font-normal">REMAINING</span>
      </span>
    </span>
  );
}

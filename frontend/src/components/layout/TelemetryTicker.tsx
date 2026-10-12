"use client";

import React from "react";

export interface TelemetryTickerProps {
  photosAppraised?: number;
  countriesCount?: number;
  openContestsCount?: number;
  jurySpeed?: string;
  latency?: string;
}

export function TelemetryTicker({
  photosAppraised = 48920,
  countriesCount = 114,
  openContestsCount = 14,
  jurySpeed = "0.82S",
  latency = "14MS",
}: TelemetryTickerProps) {
  return (
    <div className="w-full bg-surface-container-low border-b border-white/[0.04] px-4 md:px-10 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase text-on-surface-variant font-bold">
        <span className="inline-flex items-center gap-1.5 text-primary-container">
          <span className="w-2 h-2 rounded-full bg-primary-container inline-block animate-ping" />
          <span>SYS::STREAMING</span>
        </span>
        <span className="text-surface-container-highest">/</span>
        <span>{photosAppraised.toLocaleString()} PHOTOS APPRAISED</span>
        <span className="text-surface-container-highest">/</span>
        <span>{countriesCount} COUNTRIES</span>
        <span className="text-surface-container-highest">/</span>
        <span className="text-white font-semibold">{openContestsCount} OPEN COMPETITIONS</span>
        <span className="text-surface-container-highest">/</span>
        <span>JURY SPEED: {jurySpeed}</span>
        <span className="text-surface-container-highest">/</span>
        <span className="text-primary-container font-mono">LATENCY: {latency}</span>
      </div>
      <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-on-surface-variant uppercase">
        <span>ENGINE CLK: 3.4GHZ</span>
        <span className="text-primary-container font-bold">[STABLE]</span>
      </div>
    </div>
  );
}

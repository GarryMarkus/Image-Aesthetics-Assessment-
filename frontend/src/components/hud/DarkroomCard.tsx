"use client";

import React from "react";

export interface DarkroomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  reticleCorners?: boolean;
  glowOnHover?: boolean;
  variant?: "surface" | "dim" | "glass";
  headerTitle?: string;
  telemetryTag?: string;
}

export function DarkroomCard({
  children,
  reticleCorners = true,
  glowOnHover = true,
  variant = "surface",
  headerTitle,
  telemetryTag,
  className = "",
  ...props
}: DarkroomCardProps) {
  const variantClasses = {
    surface: "bg-surface-container border-white/[0.08]",
    dim: "bg-surface-container-lowest border-white/[0.05]",
    glass: "bg-black/60 backdrop-blur-md border-white/10",
  }[variant];

  return (
    <div
      className={`relative group p-5 rounded-sm border transition-all duration-200 ${variantClasses} ${
        glowOnHover ? "hover:border-primary-container/40 hover:shadow-lg hover:shadow-primary-container/5" : ""
      } ${className}`}
      {...props}
    >
      {/* Cybernetic Reticle Viewfinder Corner Ticks */}
      {reticleCorners && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/20 group-hover:border-primary-container transition-colors" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/20 group-hover:border-primary-container transition-colors" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/20 group-hover:border-primary-container transition-colors" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/20 group-hover:border-primary-container transition-colors" />
        </>
      )}

      {/* Optional Card Top Header */}
      {(headerTitle || telemetryTag) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
          {headerTitle && <span className="font-semibold text-white">{headerTitle}</span>}
          {telemetryTag && (
            <span className="text-primary-container font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              {telemetryTag}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

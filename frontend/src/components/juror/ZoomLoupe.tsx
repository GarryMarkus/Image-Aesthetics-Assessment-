"use client";

import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export interface ZoomLoupeProps {
  imageSrc: string;
  alt: string;
  zoomLevel?: number;
  loupeSize?: number;
  className?: string;
}

export function ZoomLoupe({
  imageSrc,
  alt,
  zoomLevel = 2.5,
  loupeSize = 180,
  className = "",
}: ZoomLoupeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [isZoomActive, setIsZoomActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
      setIsHovered(false);
      return;
    }

    setIsHovered(true);
    setLoupePos({
      x: mouseX - loupeSize / 2,
      y: mouseY - loupeSize / 2,
    });

    const bgX = (mouseX / rect.width) * 100;
    const bgY = (mouseY / rect.height) * 100;
    setBgPos({ x: bgX, y: bgY });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsZoomActive(!isZoomActive)}
      className={`relative overflow-hidden cursor-crosshair select-none flex items-center justify-center max-h-[80vh] max-w-full ${className}`}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="max-h-[75vh] max-w-full object-contain pointer-events-none rounded-xs"
      />

      {/* Floating Loupe Magnifier */}
      {isHovered && (
        <div
          style={{
            top: `${loupePos.y}px`,
            left: `${loupePos.x}px`,
            width: `${loupeSize}px`,
            height: `${loupeSize}px`,
            backgroundImage: `url(${imageSrc})`,
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            backgroundSize: `${zoomLevel * 100}%`,
          }}
          className="absolute pointer-events-none rounded-full border-2 border-primary-container shadow-2xl shadow-black z-30 overflow-hidden"
        >
          {/* Central Crosshair inside Loupe */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-4 h-[1px] bg-primary-container" />
            <div className="h-4 w-[1px] bg-primary-container absolute" />
          </div>

          <div className="absolute bottom-2 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-widest text-primary-container font-bold bg-black/70 py-0.5">
            {zoomLevel}X CRITICAL FOCUS
          </div>
        </div>
      )}

      {/* Viewfinder Corner Reticles */}
      <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary-container pointer-events-none" />
      <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary-container pointer-events-none" />
      <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary-container pointer-events-none" />
      <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary-container pointer-events-none" />
    </div>
  );
}

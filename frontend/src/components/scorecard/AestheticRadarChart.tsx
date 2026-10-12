"use client";

import React, { useState } from "react";
import { AestheticScore } from "@/types";

export interface RadarDimension {
  label: string;
  key: keyof AestheticScore;
  score: number;
  weight?: number;
}

export interface AestheticRadarChartProps {
  score: AestheticScore;
  size?: number;
  className?: string;
}

export function AestheticRadarChart({
  score,
  size = 360,
  className = "",
}: AestheticRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dimensions: RadarDimension[] = [
    { label: "COMPOSITION", key: "scoreComposition", score: score.scoreComposition },
    { label: "LIGHTING", key: "scoreLighting", score: score.scoreLighting },
    { label: "COLOR", key: "scoreColor", score: score.scoreColor },
    { label: "TECHNICAL", key: "scoreTechnical", score: score.scoreTechnical },
    { label: "STORY", key: "scoreStory", score: score.scoreStory },
    { label: "ORIGINALITY", key: "scoreOriginality", score: score.scoreOriginality },
    { label: "MOOD", key: "scoreMood", score: score.scoreMood },
    { label: "STYLE", key: "scoreStyle", score: score.scoreStyle },
  ];

  const totalAxes = dimensions.length;
  const center = size / 2;
  const radius = (size / 2) - 48; // padding for labels

  // Compute coordinate on radar given value (0-100) and index (0-7)
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate SVG polygon points
  const polygonPoints = dimensions
    .map((dim, i) => {
      const { x, y } = getCoordinates(dim.score, i);
      return `${x},${y}`;
    })
    .join(" ");

  // Background concentric guide rings (20, 40, 60, 80, 100)
  const guideLevels = [20, 40, 60, 80, 100];

  return (
    <div className={`relative flex flex-col items-center select-none font-mono ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {/* Glowing gradient for the radar fill */}
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#aff755" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Background Concentric Web Rings */}
        {guideLevels.map((level) => {
          const ringPoints = Array.from({ length: totalAxes })
            .map((_, i) => {
              const { x, y } = getCoordinates(level, i);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={level}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray={level === 100 ? "none" : "2,2"}
            />
          );
        })}

        {/* 2. Radial Axis Spokes */}
        {dimensions.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. The Aesthetic Score Polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="#aff755"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-300"
        />

        {/* 4. Interactive Vertex Dots & Tooltip Markers */}
        {dimensions.map((dim, i) => {
          const { x, y } = getCoordinates(dim.score, i);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={dim.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? "#ffffff" : "#aff755"}
                stroke="#131413"
                strokeWidth="2"
                className="transition-all duration-200"
              />
            </g>
          );
        })}

        {/* 5. Axis Perimeter Labels */}
        {dimensions.map((dim, i) => {
          const labelDist = radius + 24;
          const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          const isHovered = hoveredIndex === i;

          return (
            <text
              key={dim.label}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-[9px] uppercase tracking-wider transition-colors duration-200 ${
                isHovered
                  ? "fill-primary-container font-bold"
                  : "fill-on-surface-variant font-medium"
              }`}
            >
              {dim.label} ({dim.score.toFixed(0)})
            </text>
          );
        })}
      </svg>

      {/* Center Tooltip on Hover */}
      <div className="h-6 mt-2 text-center text-xs">
        {hoveredIndex !== null ? (
          <span className="text-primary-container font-bold tracking-wider">
            {dimensions[hoveredIndex].label}: {dimensions[hoveredIndex].score.toFixed(1)} / 100.0
          </span>
        ) : (
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
            HOVER VERTICES TO AUDIT SUB-SCORES
          </span>
        )}
      </div>
    </div>
  );
}

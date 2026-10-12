"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type BracketButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

export type BracketStyle = "bracket" | "brace" | "angle" | "none";

export interface BracketButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BracketButtonVariant;
  bracketStyle?: BracketStyle;
  href?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function BracketButton({
  children,
  variant = "primary",
  bracketStyle = "bracket",
  href,
  isLoading = false,
  leftIcon,
  rightIcon,
  size = "md",
  className = "",
  disabled,
  ...props
}: BracketButtonProps) {
  const getBrackets = () => {
    switch (bracketStyle) {
      case "bracket":
        return { open: "[", close: "]" };
      case "brace":
        return { open: "{", close: "}" };
      case "angle":
        return { open: "<", close: ">" };
      case "none":
      default:
        return { open: "", close: "" };
    }
  };

  const { open, close } = getBrackets();

  const sizeClasses = {
    sm: "px-3 py-1.5 text-[10px] gap-1.5",
    md: "px-4 py-2 text-xs gap-2",
    lg: "px-6 py-3 text-sm gap-2.5",
  }[size];

  const variantClasses = {
    primary:
      "bg-primary-container text-on-primary-fixed hover:bg-white hover:text-black font-bold border border-primary-container shadow-sm shadow-primary-container/20",
    secondary:
      "bg-surface-container hover:bg-surface-container-high text-white border border-white/10 hover:border-white/20 font-semibold",
    outline:
      "bg-transparent text-primary-container hover:bg-primary-container/10 border border-primary-container/40 hover:border-primary-container font-semibold",
    danger:
      "bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/30 font-semibold",
    ghost:
      "bg-transparent hover:bg-white/5 text-on-surface-variant hover:text-white border border-transparent font-medium",
  }[variant];

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        leftIcon
      )}
      <span className="flex items-center gap-1">
        {open && <span className="opacity-70 font-mono font-bold">{open}</span>}
        <span className="tracking-wider">{children}</span>
        {close && <span className="opacity-70 font-mono font-bold">{close}</span>}
      </span>
      {!isLoading && rightIcon}
    </>
  );

  const baseClasses = `inline-flex items-center justify-center font-mono uppercase transition-all rounded-sm select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={baseClasses}
      {...props}
    >
      {content}
    </button>
  );
}

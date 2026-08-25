import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export default function GlassCard({ children, className = "", as: Tag = "div" }: GlassCardProps) {
  return (
    <Tag className={`glass-card ${className}`.trim()}>
      {children}
    </Tag>
  );
}

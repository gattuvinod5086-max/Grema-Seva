import type { ReactNode, CSSProperties } from "react";
import { UI } from "@web/constants/design";

export function GsCard({
  children,
  className = "",
  onClick,
  style,
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
  padding?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`${UI.card} ${onClick ? UI.cardHover + " cursor-pointer" : ""} ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

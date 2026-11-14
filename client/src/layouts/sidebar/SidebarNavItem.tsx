import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SidebarNavItemProps {
  title: string;
  href: string;
  icon: LucideIcon;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  exact?: boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  title,
  href,
  icon: Icon,
  isCollapsed = false,
  onNavigate,
  exact = false,
}) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = exact
    ? location.pathname === href
    : location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NavLink
        to={href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative flex items-center rounded-lg text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isCollapsed
            ? "h-10 w-10 justify-center mx-auto"
            : "h-10 w-full gap-3 px-3",
          isActive
            ? "bg-accent text-accent-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
            isActive
              ? "text-accent-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <span className="truncate tracking-tight">{title}</span>
        )}
        {isActive && !isCollapsed && (
          <span
            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </NavLink>

      {/* Hover tooltip in collapsed mode */}
      {isCollapsed && isHovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {title}
          <div
            className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-border"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default SidebarNavItem;

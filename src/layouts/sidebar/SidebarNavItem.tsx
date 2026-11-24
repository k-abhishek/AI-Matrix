import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";

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

  const isActive = exact
    ? location.pathname === href
    : location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right">{title}</TooltipContent>
      )}
    </Tooltip>
  );
};

export default SidebarNavItem;

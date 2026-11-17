import React from "react";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { cn } from "../utils/cn";
import { useThemeContext } from "../context/ThemeContext";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  className,
}) => {
  const { isDark, toggleTheme } = useThemeContext();

  // Derive dynamic page title / breadcrumb
  // const getBreadcrumb = () => {
  //   const path = location.pathname;
  //   if (path === '/' || path === '/about') return { title: 'About', parent: 'App' };
  //   if (path === '/knowledge-base') return { title: 'Knowledge Base', parent: 'Resources' };

  //   const segment = path.replace(/^\//, '').replace(/-/g, ' ');
  //   const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
  //   return { title: formatted, parent: 'Dashboard' };
  // };

  // const breadcrumb = getBreadcrumb();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-background/80 px-4 backdrop-blur-md transition-colors sm:px-6",
        className,
      )}
    >
      {/* Left: Mobile Menu Trigger + Dynamic Page Title/Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger trigger (Visible only below md) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Dynamic Breadcrumb / Page Title */}
        {/* <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Link
            to="/about"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline-block font-normal text-xs"
          >
            {breadcrumb.parent}
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:inline-block" />
          <h1 className="font-semibold text-foreground tracking-tight text-sm">
            {breadcrumb.title}
          </h1>
        </nav> */}
      </div>

      {/* Right: Quick Utility Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          {isDark ? (
            <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 hover:rotate-45 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-200 rotate-0 hover:-rotate-12 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;

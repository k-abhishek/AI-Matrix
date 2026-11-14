import React, { useState, Suspense } from "react";
import { Outlet, Link } from "react-router-dom";
import { LayoutGroup } from "motion/react";
import { PanelLeft, Grip } from "lucide-react";
import { cn } from "../utils/cn";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SidebarNav from "./SidebarNav";
import UserProfile from "./UserProfile";
import Header from "./Header";
import MobileNav from "./MobileNav";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans antialiased">
      {/* Mobile Sheet Drawer (< md) */}
      <MobileNav isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Desktop Collapsible Sidebar (hidden < md) */}
      <aside
        aria-label="Desktop Sidebar"
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar/50 backdrop-blur-sm transition-[width] duration-300 ease-in-out select-none",
          isCollapsed ? "w-16" : "w-[260px]",
        )}
      >
        {/* Top Brand Header (h-14 / 56px) */}
        <div className="flex h-14 items-center border-b border-border px-3.5">
          <div
            className={cn(
              "flex items-center gap-2.5 overflow-hidden transition-all duration-300",
              isCollapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "flex-1 opacity-100",
            )}
          >
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary shadow-sm">
                <Grip className="h-8 w-8" />
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-semibold text-sm tracking-tight text-foreground truncate">
                  Matrix
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none",
              isCollapsed ? "mx-auto" : "ml-auto",
            )}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>

        {/* Sidebar Footer: Compact User Profile Block */}
        <div className="border-t border-border p-2">
          <UserProfile isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Layout Area: Header + Content Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar (h-14 / 56px) */}
        <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Main Content Canvas: pure wrapper/outlet with full-height support */}
        <main
          className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] overflow-y-auto bg-background"
          role="main"
        >
          <LayoutGroup id="chat-transition">
            {children || (
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center justify-center min-h-[50vh]">
                    <LoadingSpinner size="md" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            )}
          </LayoutGroup>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

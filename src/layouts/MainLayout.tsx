import React, { useState, Suspense } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutGroup } from "motion/react";
import { PanelLeft, Grip } from "lucide-react";
import { cn } from "../utils/cn";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SidebarNav from "./SidebarNav";
import UserProfile from "./UserProfile";
import Header from "./Header";
import MobileNav from "./MobileNav";
import BackgroundOverlay from "../components/BackgroundOverlay";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-sidebar font-sans antialiased">
      {/* Mobile Sheet Drawer (< md) */}
      <MobileNav isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Desktop Collapsible Sidebar (hidden < md) */}
      <aside
        aria-label="Desktop Sidebar"
        className={cn(
          "hidden md:flex flex-col bg-sidebar transition-[width] duration-300 ease-in-out select-none my-4",
          isCollapsed ? "w-16" : "w-[260px]",
        )}
      >
        {/* Top Brand Header (h-14 / 56px) */}
        <div className="flex h-14 items-center px-3.5">
          {/* Collapsed: Grip icon centred as the brand mark */}
          {isCollapsed ? (
            <div className="flex w-full items-center justify-center">
              <Link
                to="/"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-primary outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label="Home"
              >
                <Grip className="h-8 w-8" />
              </Link>
            </div>
          ) : (
            <>
              {/* Expanded: full brand logo */}
              <Link
                to="/"
                className="flex items-center gap-2.5 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring flex-1 min-w-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary shadow-sm">
                  <Grip className="h-8 w-8" />
                </div>
                <div className="flex flex-col text-left leading-none min-w-0">
                  <span className="font-semibold text-sm tracking-tight text-foreground truncate">
                    Matrix
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Workspace
                  </span>
                </div>
              </Link>

              {/* Collapse button — only when expanded */}
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
          <SidebarNav
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* Sidebar Footer: Compact User Profile Block */}
        <div className="p-2">
          <UserProfile isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Layout Area: Header + Content Canvas */}
      <div className="relative flex flex-1 flex-col overflow-hidden py-6 pr-4">
        {location.pathname === "/" && <BackgroundOverlay />}

        {/* Top Header Bar (h-14 / 56px) */}
        <Header
          className={location.pathname === "/" ? "" : "bg-background"}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
        />

        {/* Main Content Canvas: pure wrapper/outlet with full-height support */}
        <main
          className={`flex-1 flex flex-col overflow-y-auto ${location.pathname === "/" ? "" : "bg-background"} rounded-b-2xl`}
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

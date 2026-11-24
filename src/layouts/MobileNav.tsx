import React, { useEffect } from 'react';
import { X, Bot } from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarNav from './SidebarNav';
import UserProfile from './UserProfile';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0"
      />

      {/* Sheet Content Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar shadow-2xl transition-transform duration-300 ease-in-out',
          'animate-in slide-in-from-left duration-300'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                AI Platform
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Workspace
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNav isCollapsed={false} onNavigate={onClose} />
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="border-t border-border p-2">
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default MobileNav;


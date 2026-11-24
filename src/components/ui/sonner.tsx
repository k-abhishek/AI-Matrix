import * as React from "react";
import { Toaster as Sonner, toast } from "sonner";
import { useThemeContext } from "../../context/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: "light" | "dark" | "system" = "system";

  try {
    const themeContext = useThemeContext();
    theme = themeContext.theme;
  } catch {
    // Graceful fallback if rendered outside ThemeProvider
    if (typeof window !== "undefined" && document.documentElement.classList.contains("dark")) {
      theme = "dark";
    }
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:text-foreground",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

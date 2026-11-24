import React from "react";
import { cn } from "../utils/cn";
import { useThemeContext } from "../context/ThemeContext";
import darkBg from "../assets/background-dark.jpg";
import lightBg from "../assets/background-light.jpg";

export interface BackgroundOverlayProps {
  /**
   * Path or URL to the background image (overrides theme-based selection)
   */
  src?: string;
  /**
   * Alias for `src`
   */
  imageUrl?: string;
  /**
   * Background image for dark theme (defaults to bundled dark asset)
   */
  darkSrc?: string;
  /**
   * Background image for light theme (defaults to bundled light asset)
   */
  lightSrc?: string;
  /**
   * Accessibility alt label
   */
  alt?: string;
  /**
   * Opacity of the background image (0 to 1, default: 0.15)
   */
  opacity?: number;
  /**
   * Whether to apply blur effect to the background image
   */
  blur?: boolean | string;
  /**
   * Additional class names for the outer container
   */
  className?: string;
  /**
   * Additional class names for the <img> tag
   */
  imageClassName?: string;
  /**
   * Additional class names for the gradient overlay
   */
  overlayClassName?: string;
  /**
   * Whether to display a subtle gradient overlay to ensure text contrast
   */
  showGradient?: boolean;
  /**
   * Object fit style for the image (default: "cover")
   */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /**
   * z-index override (default: "z-0")
   */
  zIndex?: string;
  /**
   * Optional children to render within the overlay container
   */
  children?: React.ReactNode;
}

export const BackgroundOverlay: React.FC<BackgroundOverlayProps> = ({
  src,
  imageUrl,
  darkSrc,
  lightSrc,
  alt = "Background overlay",
  opacity = 0.4,
  blur = false,
  className,
  imageClassName,
  overlayClassName,
  showGradient = false,
  objectFit = "cover",
  zIndex = "z-0",
  children,
}) => {
  const { isDark } = useThemeContext();

  // Priority: explicit src/imageUrl → theme-specific prop → bundled asset
  const activeImage =
    src || imageUrl || (isDark ? darkSrc || darkBg : lightSrc || lightBg);

  if (!activeImage) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-6 right-4 left-0 overflow-hidden rounded-2xl select-none",
        zIndex,
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={activeImage}
        alt={alt}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          objectFit === "fill" && "object-fill",
          blur === true && "blur-xs",
          typeof blur === "string" && blur,
          imageClassName,
        )}
        style={{ opacity }}
      />
      {showGradient && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80",
            overlayClassName,
          )}
        />
      )}
      {children}
    </div>
  );
};

export default BackgroundOverlay;

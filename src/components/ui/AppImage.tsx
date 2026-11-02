// src/components/ui/AppImage.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  shouldBypassOptimization,
  resolveImageSizes,
  normalizeImageSrc,
  isConfiguredRemoteHost,
  type ImageSizePreset,
} from "./appImageHelpers";

export interface AppImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: ImageSizePreset | string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  unoptimized?: boolean;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function AppImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "100vw",
  className,
  containerClassName,
  priority = false,
  unoptimized,
  fallbackIcon,
  onError,
  onClick,
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const normalizedSrc = normalizeImageSrc(src);
  const isBypassed = unoptimized ?? shouldBypassOptimization(normalizedSrc);
  const isConfigured = isConfiguredRemoteHost(normalizedSrc);

  if (!normalizedSrc || hasError) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
          fill ? "w-full h-full" : "",
          containerClassName,
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        {fallbackIcon ?? <ImageOff className="w-5 h-5 opacity-40" />}
      </div>
    );
  }

  const resolvedSizes = resolveImageSizes(sizes);

  // If the host is not configured in next.config.ts, fall back to native <img>
  // to prevent unhandled Next.js runtime exceptions while preserving error handling.
  if (!isConfigured) {
    return (
      <div
        onClick={onClick}
        className={cn("relative overflow-hidden", fill ? "w-full h-full" : "", containerClassName)}
        style={!fill && width && height ? { width, height } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedSrc}
          alt={alt}
          onError={handleError}
          className={cn(fill ? "w-full h-full object-cover" : "", className)}
          style={!fill && width && height ? { width, height } : undefined}
        />
      </div>
    );
  }

  if (fill) {
    return (
      <div
        onClick={onClick}
        className={cn("relative w-full h-full overflow-hidden", containerClassName)}
      >
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={resolvedSizes}
          priority={priority}
          unoptimized={isBypassed}
          onError={handleError}
          className={cn("object-cover", className)}
        />
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      width={width ?? 300}
      height={height ?? 200}
      sizes={resolvedSizes}
      priority={priority}
      unoptimized={isBypassed}
      onError={handleError}
      className={className}
    />
  );
}

/**
 * Mobile Device Detection Utilities
 * Provides reliable detection for touch capabilities, iOS WebKit, and mobile viewport conditions
 */

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isTouchCapable = Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  return mobileRegex.test(userAgent) || (isTouchCapable && window.innerWidth < 1024);
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isIpadOs = navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/.test(userAgent);
  return Boolean(isIos || isIpadOs);
}

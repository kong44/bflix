/**
 * Ad Shield Singleton Manager
 * Intercepts unwanted popups and redirect windows opened by third-party embed servers
 * using reference counting to ensure leak-free restoration.
 */

let originalWindowOpen: ((url?: string | URL, target?: string, features?: string) => WindowProxy | null) | null = null;
let activeShieldConsumers = 0;

export function acquireAdShield(mode: "strict" | "compat" | "off"): void {
  if (mode === "off") return;

  activeShieldConsumers++;
  if (activeShieldConsumers === 1 && typeof window !== "undefined") {
    originalWindowOpen = window.open;

    (window as any).open = function (url?: string | URL, target?: string, features?: string) {
      console.warn("[BFlix Ad Shield] Intercepted unauthorized popup/tab to:", url);
      return {
        closed: false,
        close: () => {},
        focus: () => {},
        blur: () => {},
        postMessage: () => {},
        document: {},
        location: { href: "" }
      } as any;
    };
  }
}

export function releaseAdShield(mode: "strict" | "compat" | "off"): void {
  if (mode === "off") return;

  activeShieldConsumers = Math.max(0, activeShieldConsumers - 1);
  if (activeShieldConsumers === 0 && originalWindowOpen && typeof window !== "undefined") {
    window.open = originalWindowOpen;
    originalWindowOpen = null;
  }
}

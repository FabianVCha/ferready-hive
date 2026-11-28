"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const CatalogReadyContext = createContext<(element: HTMLDivElement) => void>(() => {});

/** Signal the actual catalog commit, not an earlier router pathname update. */
export function useCatalogRouteReady() {
  const ready = useContext(CatalogReadyContext);
  const element = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (element.current) ready(element.current);
  }, [ready]);
  return element;
}

/** Animate committed content without remounting it or taking over navigation. */
export function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const surface = useRef<HTMLDivElement>(null);
  const keyboard = useRef(false);
  const animation = useRef<Animation | null>(null);
  const catalog = useRef<HTMLDivElement | null>(null);
  const pendingCatalog = useRef(false);
  const enter = useCallback((element: HTMLElement, isCatalog = false) => {
    animation.current?.cancel();
    if (keyboard.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easing = getComputedStyle(element).getPropertyValue("--selection-ease-out").trim();
    animation.current = element.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 280,
        // The catalog is a view swap: spread its reveal over the whole interval.
        easing: isCatalog ? "cubic-bezier(0.77, 0, 0.175, 1)" : easing || "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    );
  }, []);
  const catalogReady = useCallback((element: HTMLDivElement) => {
    catalog.current = element;
    if (!pendingCatalog.current) return;
    pendingCatalog.current = false;
    enter(element, true);
  }, [enter]);

  useLayoutEffect(() => {
    const onPointer = () => { keyboard.current = false; };
    const onKeyboard = () => {
      keyboard.current = true;
      animation.current?.cancel();
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKeyboard, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKeyboard, true);
      animation.current?.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    animation.current?.cancel();
    pendingCatalog.current = pathname === "/catalogo";
    if (pendingCatalog.current) {
      if (catalog.current?.isConnected && catalog.current.getClientRects().length) catalogReady(catalog.current);
    } else if (surface.current) enter(surface.current);
    return () => animation.current?.cancel();
  }, [pathname, catalogReady, enter]);

  return <CatalogReadyContext.Provider value={catalogReady}><div ref={surface} className="route-surface">{children}</div></CatalogReadyContext.Provider>;
}

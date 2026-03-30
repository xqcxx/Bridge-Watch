import { useEffect } from "react";
import { useUIStore, type UIActions, type UIState } from "../stores";

/**
 * Hook to detect and handle mobile view changes
 */
export function useMobileDetect() {
  const setIsMobileView = useUIStore(
    (state: UIState & UIActions) => state.setIsMobileView
  );
  const setSidebarOpen = useUIStore(
    (state: UIState & UIActions) => state.setSidebarOpen
  );

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);

      // Auto-close sidebar on mobile
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobileView, setSidebarOpen]);
}

/**
 * Hook to detect touch device capability
 */
export function useTouchDetect() {
  const setIsTouchDevice = useUIStore(
    (state: UIState & UIActions) => state.setIsTouchDevice
  );

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, [setIsTouchDevice]);
}

/**
 * Combined hook for device capability detection
 */
export function useDeviceDetect() {
  useMobileDetect();
  useTouchDetect();
}

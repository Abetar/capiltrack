"use client";

import { useEffect, useState } from "react";

type MobileViewShellProps = {
  children: React.ReactNode;
};

export default function MobileViewShell({ children }: MobileViewShellProps) {
  const [mobileViewEnabled, setMobileViewEnabled] = useState(false);

  useEffect(() => {
    function applyMobileViewClass(enabled: boolean) {
      document.body.classList.toggle("capiltrack-mobile-view-enabled", enabled);
    }

    const savedValue = window.localStorage.getItem("capiltrack-mobile-view");
    const enabled = savedValue === "enabled";

    setMobileViewEnabled(enabled);
    applyMobileViewClass(enabled);

    function handleMobileViewChange(event: Event) {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      const nextValue = customEvent.detail.enabled;

      setMobileViewEnabled(nextValue);
      applyMobileViewClass(nextValue);
    }

    window.addEventListener(
      "capiltrack-mobile-view-change",
      handleMobileViewChange,
    );

    return () => {
      window.removeEventListener(
        "capiltrack-mobile-view-change",
        handleMobileViewChange,
      );

      document.body.classList.remove("capiltrack-mobile-view-enabled");
    };
  }, []);

  return (
    <div
      className={
        mobileViewEnabled
          ? "capiltrack-app-shell capiltrack-mobile-view-enabled"
          : "capiltrack-app-shell"
      }
    >
      {children}
    </div>
  );
}
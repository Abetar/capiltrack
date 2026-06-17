"use client";

import { useEffect, useState } from "react";

export default function MobileViewToggleButton() {
  const [mobileViewEnabled, setMobileViewEnabled] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem("capiltrack-mobile-view");

    setMobileViewEnabled(savedValue === "enabled");
  }, []);

  function toggleMobileView() {
    const nextValue = !mobileViewEnabled;

    setMobileViewEnabled(nextValue);

    window.localStorage.setItem(
      "capiltrack-mobile-view",
      nextValue ? "enabled" : "disabled",
    );

    window.dispatchEvent(
      new CustomEvent("capiltrack-mobile-view-change", {
        detail: {
          enabled: nextValue,
        },
      }),
    );
  }

  return (
    <div className="capiltrack-view-switcher">
      {/* <span className="capiltrack-view-status mr-2">
        Modo actual:{" "}
        <strong>{mobileViewEnabled ? "mobile" : "escritorio"}</strong>
      </span> */}

      <button
        type="button"
        className="capiltrack-header-view-toggle"
        onClick={toggleMobileView}
      >
        {mobileViewEnabled ? "Vista escritorio" : "Vista mobile"}
      </button>
    </div>
  );
}
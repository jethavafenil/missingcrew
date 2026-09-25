"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

interface SegmentedRoleToggleProps {
  className?: string;
  initialActive?: "crew" | "employer";
}

export default function SegmentedRoleToggle({
  className,
  initialActive = "crew",
}: SegmentedRoleToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState<"crew" | "employer">(initialActive);

  const isCrew = active === "crew";

  const handleClick = (role: "crew" | "employer") => {
    setActive(role);
    // Navigate to role-specific landing pages
    const path = role === "crew" ? "/crew-home" : "/employer-home";
    router.push(path);
  };

  return (
    <div
      className={clsx(
        "relative mx-auto flex rounded-full p-1 border backdrop-blur-md shadow-lg transition-all ease-in-out duration-500 gap-1 md:gap-2",
        "bg-[#0000002e] border-white/30",
        className
      )}
      role="tablist"
      aria-label="Select role"
    >
      {/* Sliding background pill */}
      <span
        className={clsx(
          "absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-full py-0.5 pr-[1px] ease-in-out duration-500 transition-transform",
          "w-1/2",
          isCrew ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden="true"
      >
        <span className="h-full w-full rounded-full transition-all bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md" />
      </span>

      {/* Crew */}
      <button
        type="button"
        role="tab"
        aria-selected={isCrew}
        aria-controls="crew-panel"
        id="crew-tab"
        onClick={() => handleClick("crew")}
        onFocus={() => setActive("crew")}
        className={clsx(
          "my-auto cursor-pointer select-none rounded-full px-5 py-2 text-center font-semibold text-sm md:text-base transition-colors ease-in-out duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
          isCrew ? "text-white" : "text-white hover:text-gray-900"
        )}
      >
       <span className="mr-2" aria-hidden>🎬</span>
       I&apos;m Crew
     </button>

      {/* Employer */}
      <button
        type="button"
        role="tab"
        aria-selected={!isCrew}
        aria-controls="employer-panel"
        id="employer-tab"
        onClick={() => handleClick("employer")}
        onFocus={() => setActive("employer")}
        className={clsx(
          "my-auto cursor-pointer select-none rounded-full px-5 py-2 text-center font-semibold text-sm md:text-base transition-colors ease-in-out duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 pr-[1px]",
          !isCrew ? "text-white" : "text-white hover:text-gray-900"
        )}
      >
       <span className="mr-2" aria-hidden>💼</span>
       I&apos;m Hiring Crew
     </button>
    </div>
  );
}

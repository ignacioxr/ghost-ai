"use client";

import { useViewport } from "@xyflow/react";
import { useOthers } from "@liveblocks/react/suspense";

import { getCursorColor } from "@/lib/cursor-color";

// Rendered inside React Flow's ViewportPortal, so positions are in flow coordinates.
export function LiveCursors() {
  const others = useOthers();
  const { zoom } = useViewport();

  return (
    <>
      {others.map(({ connectionId, id, info, presence }) => {
        if (!presence.cursor) return null;
        const color = info?.color ?? getCursorColor(id ?? String(connectionId));
        return (
          <div
            key={connectionId}
            className="pointer-events-none absolute left-0 top-0 z-50"
            style={{
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px) scale(${1 / zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={color} stroke="#080809" strokeWidth="1.5">
              <path d="M4 3l16 7-7 2.5L10.5 20z" />
            </svg>
            <span
              className="ml-4 -mt-1 block w-max max-w-40 truncate rounded-full px-2 py-0.5 text-xs font-medium text-[#080809]"
              style={{ backgroundColor: color }}
            >
              {info?.name ?? "Anonymous"}
            </span>
          </div>
        );
      })}
    </>
  );
}

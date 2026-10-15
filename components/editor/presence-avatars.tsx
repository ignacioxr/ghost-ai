"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

import { getCursorColor } from "@/lib/cursor-color";

const MAX_AVATARS = 5;
const AVATAR_CLASS = "h-8 w-8 rounded-full ring-2 ring-surface-border-subtle";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  const collaborators = others.filter((other) => other.id !== user?.id);
  const visible = collaborators.slice(0, MAX_AVATARS);
  const overflow = collaborators.length - visible.length;

  if (!user) return null;

  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        {visible.map((other) => {
          const name = other.info?.name ?? "Anonymous";
          const color = other.info?.color ?? getCursorColor(other.id ?? name);
          return other.info?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={other.connectionId}
              src={other.info.avatar}
              alt={name}
              title={name}
              className={`${AVATAR_CLASS} object-cover`}
            />
          ) : (
            <span
              key={other.connectionId}
              title={name}
              className={`${AVATAR_CLASS} flex items-center justify-center text-xs font-semibold text-[#080809]`}
              style={{ backgroundColor: color }}
            >
              {initials(name)}
            </span>
          );
        })}
        {overflow > 0 && (
          <span
            className={`${AVATAR_CLASS} flex items-center justify-center bg-subtle text-xs font-medium text-copy-secondary`}
          >
            +{overflow}
          </span>
        )}
      </div>
      {collaborators.length > 0 && (
        <div className="h-6 w-px bg-surface-border" aria-hidden="true" />
      )}
      <UserButton />
    </div>
  );
}

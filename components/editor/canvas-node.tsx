"use client";

import type { NodeProps } from "@xyflow/react";

import type { CanvasNode, CanvasNodeShape } from "@/types/canvas";

const SHAPE_PATHS: Record<CanvasNodeShape, string> = {
  rectangle: "M4 0H96Q100 0 100 4V96Q100 100 96 100H4Q0 100 0 96V4Q0 0 4 0Z",
  diamond: "M50 0L100 50L50 100L0 50Z",
  circle: "M50 0A50 50 0 1 1 49.99 0Z",
  pill: "M50 0H50A50 50 0 0 1 50 100H50A50 50 0 0 1 50 0Z",
  cylinder:
    "M0 12Q0 0 50 0T100 12V88Q100 100 50 100T0 88Z",
  hexagon: "M25 0H75L100 50L75 100H25L0 50Z",
};

export function CanvasNodeView({ data, width, height }: NodeProps<CanvasNode>) {
  const isPill = data.shape === "pill";
  const isCircle = data.shape === "circle";
  return (
    <div
      className="relative flex items-center justify-center px-3 text-center text-sm text-copy-primary"
      style={{ width: width ?? "100%", height: height ?? "100%" }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {isCircle ? (
          <ellipse cx="50" cy="50" rx="50" ry="50" fill={data.color} stroke="var(--border-default)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ) : isPill ? null : (
          <path d={SHAPE_PATHS[data.shape]} fill={data.color} stroke="var(--border-default)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        )}
      </svg>
      {isPill && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-surface-border"
          style={{ background: data.color }}
        />
      )}
      <span className="relative">{data.label}</span>
    </div>
  );
}

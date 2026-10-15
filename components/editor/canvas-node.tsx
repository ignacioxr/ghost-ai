"use client";

import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow, type NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type CanvasEdge, type CanvasNode, type CanvasNodeShape } from "@/types/canvas";

type SvgShape = Extract<CanvasNodeShape, "diamond" | "hexagon" | "cylinder">;

const SVG_PATHS: Record<SvgShape, string> = {
  diamond: "M50 0L100 50L50 100L0 50Z",
  hexagon: "M25 0H75L100 50L75 100H25L0 50Z",
  cylinder: "M0 12A50 12 0 0 1 100 12V88A50 12 0 0 1 0 88Z",
};

const CSS_SHAPE_CLASS: Record<"rectangle" | "pill" | "circle", string> = {
  rectangle: "rounded-md",
  pill: "rounded-full",
  circle: "rounded-full",
};

type ShapeGraphicProps = {
  shape: CanvasNodeShape;
  color: string;
  selected?: boolean;
  className?: string;
};

// Fills its parent; used by both canvas nodes and the drag preview.
export function ShapeGraphic({ shape, color, selected, className }: ShapeGraphicProps) {
  const stroke = selected ? "rgba(255, 255, 255, 0.7)" : "var(--border-default)";

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    return (
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 border transition-colors",
          CSS_SHAPE_CLASS[shape],
          selected ? "border-white/70" : "border-surface-border",
          className,
        )}
        style={{ background: color }}
      />
    );
  }

  return (
    <svg
      aria-hidden
      className={cn("absolute inset-0 size-full overflow-visible", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d={SVG_PATHS[shape]}
        fill={color}
        stroke={stroke}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      {shape === "cylinder" && (
        <path
          d="M0 12A50 12 0 0 0 100 12"
          fill="none"
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

const MIN_WIDTH = 80;
const MIN_HEIGHT = 56;
const HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

const LABEL_TEXT_CLASS =
  "col-start-1 row-start-1 min-w-0 m-0 whitespace-pre-wrap break-words text-center text-sm leading-5";

export function CanvasNodeView({ id, data, width, height, selected }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [editing, setEditing] = useState(false);
  const textColor =
    data.textColor ?? NODE_COLORS.find((pair) => pair.color === data.color)?.textColor ?? NODE_COLORS[0].textColor;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  return (
    <div
      className="group relative flex items-center justify-center px-3 py-2 text-center text-sm"
      style={{ width: width ?? "100%", height: height ?? "100%", color: textColor }}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
        <div
          className="nodrag nopan nowheel flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg"
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {NODE_COLORS.map((pair) => {
            const active = pair.color === data.color;
            return (
              <button
                key={pair.color}
                type="button"
                aria-label={`${pair.name} color`}
                aria-pressed={active}
                title={pair.name}
                onClick={() => updateNodeData(id, { color: pair.color, textColor: pair.textColor })}
                className={cn(
                  "size-5 rounded-full border transition-shadow",
                  active ? "border-2" : "border-white/10 hover:shadow-[0_0_0_1px_var(--swatch-text),0_0_6px_var(--swatch-text)]",
                )}
                style={
                  {
                    background: pair.color,
                    "--swatch-text": pair.textColor,
                    ...(active
                      ? { borderColor: pair.textColor, boxShadow: `0 0 0 2px var(--bg-surface), 0 0 0 3px ${pair.textColor}` }
                      : { borderColor: `${pair.textColor}66` }),
                  } as unknown as React.CSSProperties
                }
              />
            );
          })}
        </div>
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        keepAspectRatio={data.shape === "circle"}
        lineClassName="!pointer-events-none !border-white/20"
        handleClassName="!size-2 !rounded-sm !border !border-white/60 !bg-surface"
      />
      <ShapeGraphic shape={data.shape} color={data.color} selected={selected} />
      {HANDLES.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={handle.position}
          className={cn(
            "!size-2 !border !border-neutral-800 !bg-white opacity-0 transition-opacity group-hover:opacity-100",
          )}
        />
      ))}
      <div
        className="relative grid max-h-full w-full cursor-text place-items-center overflow-hidden"
        onDoubleClick={() => setEditing(true)}
      >
        <span
          className={cn(
            LABEL_TEXT_CLASS,
            "w-full",
            !data.label && "opacity-50",
            editing && "invisible",
          )}
        >
          {data.label ? (data.label.endsWith("\n") ? `${data.label}\u200b` : data.label) : editing ? "\u200b" : "Label"}
        </span>
        {editing && (
          <textarea
            ref={textareaRef}
            value={data.label}
            placeholder="Label"
            rows={1}
            onChange={(event) => updateNodeData(id, { label: event.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") setEditing(false);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              LABEL_TEXT_CLASS,
              "nodrag nopan nowheel absolute inset-0 size-full resize-none overflow-y-auto bg-transparent p-0 text-inherit outline-none [scrollbar-width:none] placeholder:opacity-50 placeholder:text-current",
            )}
          />
        )}
      </div>
    </div>
  );
}

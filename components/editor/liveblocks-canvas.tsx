"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Component,
  useCallback,
  useRef,
  type DragEvent,
  type ReactNode,
} from "react";

import { CanvasNodeView } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  parseShapeDragPayload,
} from "@/lib/canvas-shapes";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

type LiveblocksCanvasProps = {
  roomId: string;
};

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function CanvasStatus({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-base px-6 text-center text-sm text-copy-muted">
      {message}
    </div>
  );
}

const nodeTypes = { canvasNode: CanvasNodeView };

function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  const nodeCounter = useRef(0);

  const onDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      const payload = parseShapeDragPayload(
        event.dataTransfer.getData(SHAPE_DRAG_MIME),
      );
      if (!payload) return;
      event.preventDefault();

      const position = screenToFlowPosition({
        x: event.clientX - payload.width / 2,
        y: event.clientY - payload.height / 2,
      });
      nodeCounter.current += 1;
      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: { label: "", color: DEFAULT_NODE_COLOR, shape: payload.shape },
      };
      onNodesChange([{ type: "add", item: node }]);
    },
    [screenToFlowPosition, onNodesChange],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        colorMode="dark"
        className="!bg-base"
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          pannable
          zoomable
          bgColor="var(--bg-surface)"
          maskColor="rgba(8, 8, 9, 0.7)"
          nodeColor="var(--border-default)"
          className="!rounded-xl !border !border-surface-border"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(255, 255, 255, 0.16)"
          bgColor="var(--bg-base)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

export function LiveblocksCanvas({ roomId }: LiveblocksCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary
          fallback={
            <CanvasStatus message="Could not connect to the collaborative canvas. Please refresh and try again." />
          }
        >
          <ClientSideSuspense
            fallback={<CanvasStatus message="Loading canvas…" />}
          >
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

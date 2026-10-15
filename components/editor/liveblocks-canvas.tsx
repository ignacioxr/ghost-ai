"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useRedo,
  useRoom,
  useUndo,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  type Connection,
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

import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdgeView } from "@/components/editor/canvas-edge";
import { CanvasNodeView } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useStarterTemplates } from "@/components/editor/starter-templates-context";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
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
const edgeTypes = { canvasEdge: CanvasEdgeView };
const EDGE_COLOR = "#f8fafc";

function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const room = useRoom();
  const undo = useUndo();
  const redo = useRedo();
  useKeyboardShortcuts({ reactFlow, undo, redo });
  const nodeCounter = useRef(0);
  const templates = useStarterTemplates();

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      room.batch(() => {
        if (edges.length > 0) {
          onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })));
        }
        if (nodes.length > 0) {
          onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })));
        }
        onNodesChange(
          template.nodes.map((item) => ({ type: "add", item: structuredClone(item) })),
        );
        onEdgesChange(
          template.edges.map((item) => ({ type: "add", item: structuredClone(item) })),
        );
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void reactFlow.fitView({ duration: 300, padding: 0.2 });
        });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlow, room],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const edge: CanvasEdge = {
        id: `edge-${connection.source}-${connection.sourceHandle ?? ""}-${connection.target}-${connection.targetHandle ?? ""}-${Date.now()}`,
        type: "canvasEdge",
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 1.5, strokeLinecap: "round" },
        data: {},
      };
      onEdgesChange([{ type: "add", item: edge }]);
    },
    [onEdgesChange],
  );

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
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          textColor: DEFAULT_NODE_TEXT_COLOR,
          shape: payload.shape,
        },
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
        onConnect={handleConnect}
        edgeTypes={edgeTypes}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        colorMode="dark"
        className="!bg-base"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(255, 255, 255, 0.16)"
          bgColor="var(--bg-base)"
        />
      </ReactFlow>
      <ShapePanel />
      <CanvasControls undo={undo} redo={redo} />
      {templates && (
        <StarterTemplatesModal
          open={templates.open}
          onOpenChange={templates.setOpen}
          onImport={handleImportTemplate}
        />
      )}
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

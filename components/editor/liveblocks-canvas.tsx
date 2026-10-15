"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useRedo,
  useRoom,
  useUndo,
  useUpdateMyPresence,
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
  ViewportPortal,
  useEdges,
  useNodes,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdgeView } from "@/components/editor/canvas-edge";
import { LiveCursors } from "@/components/editor/live-cursors";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { CanvasNodeView } from "@/components/editor/canvas-node";
import { SaveIndicator } from "@/components/editor/save-indicator";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useStarterTemplates } from "@/components/editor/starter-templates-context";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useSaveStatusContext } from "@/components/editor/save-status-context";
import { useCanvasAutosave } from "@/hooks/useCanvasAutosave";
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

function Canvas({ roomId }: LiveblocksCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const flowNodes = useNodes<CanvasNode>();
  const flowEdges = useEdges<CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const room = useRoom();
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  useKeyboardShortcuts({ reactFlow, undo, redo });
  const nodeCounter = useRef(0);
  const templates = useStarterTemplates();
  const saveContext = useSaveStatusContext();
  const [roomWasPopulated] = useState(
    () => nodes.length > 0 || edges.length > 0,
  );
  const [loadChecked, setLoadChecked] = useState(roomWasPopulated);
  const latestCanvas = useRef({ nodes, edges });
  useEffect(() => {
    latestCanvas.current = { nodes, edges };
  });
  const { status, saveNow } = useCanvasAutosave({
    projectId: roomId,
    nodes,
    edges,
    enabled: loadChecked,
  });

  // Load the saved canvas only into an empty room; never overwrite live collaboration.
  useEffect(() => {
    if (roomWasPopulated) return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/projects/${roomId}/canvas`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          saveContext?.setState({
            status: "error",
            saveNow: () => void saveNow(),
          });
          return;
        }

        const saved = (await res.json().catch(() => null)) as
          | { nodes: CanvasNode[]; edges: CanvasEdge[] }
          | null;
        const current = latestCanvas.current;

        if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) {
          saveContext?.setState({
            status: "error",
            saveNow: () => void saveNow(),
          });
          return;
        }

        if (current.nodes.length > 0 || current.edges.length > 0) {
          setLoadChecked(true);
          return;
        }

        if (saved.nodes.length === 0 && saved.edges.length === 0) {
          setLoadChecked(true);
          return;
        }

        room.batch(() => {
          onNodesChange(saved.nodes.map((item) => ({ type: "add", item })));
          onEdgesChange(saved.edges.map((item) => ({ type: "add", item })));
        });
        requestAnimationFrame(() => {
          void reactFlow.fitView({ padding: 0.2 });
        });
        setLoadChecked(true);
      } catch {
        saveContext?.setState({
          status: "error",
          saveNow: () => void saveNow(),
        });
      }
    })();

    return () => controller.abort();
    // Runs once on mount; later changes must not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    saveContext?.setState({ status, saveNow: () => void saveNow() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, saveNow]);

  useEffect(() => () => saveContext?.setState(null), []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Window-level so deletion works even when focus is on the body (e.g. after
  // a marquee selection) rather than inside the canvas wrapper.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      const selectedNodes = flowNodes.filter((node) => node.selected);
      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
      // Edges attached to a deleted node are removed with it.
      const edgesToDelete = flowEdges.filter(
        (edge) =>
          edge.selected ||
          selectedNodeIds.has(edge.source) ||
          selectedNodeIds.has(edge.target),
      );
      if (selectedNodes.length === 0 && edgesToDelete.length === 0) return;

      event.preventDefault();
      // onNodesChange/onEdgesChange ignore "remove" changes; onDelete is the
      // Liveblocks mutation that deletes from collaborative storage.
      onDelete({ nodes: selectedNodes, edges: edgesToDelete });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flowNodes, flowEdges, onDelete]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      updateMyPresence({
        cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
        deleteKeyCode={null}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
        <ViewportPortal>
          <LiveCursors />
        </ViewportPortal>
      </ReactFlow>
      <PresenceAvatars />
      <SaveIndicator status={status} />
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
        initialPresence={{ cursor: null, thinking: false }}
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
              <Canvas roomId={roomId} />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

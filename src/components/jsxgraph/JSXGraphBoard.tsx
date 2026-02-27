import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import JXG from 'jsxgraph';
import type { Board, BoardAttributes } from 'jsxgraph';

const { JSXGraph } = JXG;

export interface JSXGraphBoardProps {
  id: string;
  boundingBox: [number, number, number, number]; // [xMin, yMax, xMax, yMin]
  keepAspectRatio?: boolean;
  showNavigation?: boolean;
  showCopyright?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onBoardReady?: (board: Board) => void;
  onPan?: (dx: number, dy: number) => void;
  onZoom?: (zoomIn: boolean, centerX: number, centerY: number) => void;
}

export interface JSXGraphBoardRef {
  board: Board | null;
  update: () => void;
  setBoundingBox: (bbox: [number, number, number, number]) => void;
}

export const JSXGraphBoard = forwardRef<JSXGraphBoardRef, JSXGraphBoardProps>(
  (
    {
      id,
      boundingBox,
      keepAspectRatio = false,
      showNavigation = false,
      showCopyright = false,
      className = '',
      style,
      onBoardReady,
      onPan,
      onZoom,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const boardRef = useRef<Board | null>(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Initialize board
    useEffect(() => {
      if (!containerRef.current) return;

      const attributes = {
        boundingbox: boundingBox,
        axis: false,
        grid: false,
        showNavigation,
        showCopyright,
        keepAspectRatio,
        pan: { enabled: false },
        zoom: { enabled: false, wheel: false },
        renderer: 'svg',
      } as BoardAttributes;

      const board = JSXGraph.initBoard(containerRef.current, attributes);
      boardRef.current = board;

      if (onBoardReady) {
        onBoardReady(board);
      }

      return () => {
        if (boardRef.current) {
          JSXGraph.freeBoard(boardRef.current);
          boardRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only reinitialize if id changes

    // Update bounding box when it changes
    useEffect(() => {
      if (boardRef.current) {
        boardRef.current.setBoundingBox(boundingBox, keepAspectRatio);
      }
    }, [boundingBox, keepAspectRatio]);

    // Custom pan handling
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (e.button === 0 || e.button === 1) {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDragging.current || !containerRef.current || !onPan) return;

      const rect = containerRef.current.getBoundingClientRect();
      const bbox = boundingBox;
      const xRange = bbox[2] - bbox[0];
      const yRange = bbox[1] - bbox[3];

      const dx = -((e.clientX - lastPos.current.x) / rect.width) * xRange;
      const dy = ((e.clientY - lastPos.current.y) / rect.height) * yRange;

      lastPos.current = { x: e.clientX, y: e.clientY };
      onPan(dx, dy);
    }, [boundingBox, onPan]);

    const handleMouseUp = useCallback(() => {
      isDragging.current = false;
    }, []);

    const handleMouseLeave = useCallback(() => {
      isDragging.current = false;
    }, []);

    // Custom zoom handling
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !onZoom) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = container.getBoundingClientRect();
        const bbox = boundingBox;
        const xRange = bbox[2] - bbox[0];
        const yRange = bbox[1] - bbox[3];

        const graphX = bbox[0] + ((e.clientX - rect.left) / rect.width) * xRange;
        const graphY = bbox[1] - ((e.clientY - rect.top) / rect.height) * yRange;

        const zoomIn = e.deltaY < 0;
        onZoom(zoomIn, graphX, graphY);
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }, [boundingBox, onZoom]);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      board: boardRef.current,
      update: () => boardRef.current?.update(),
      setBoundingBox: (bbox: [number, number, number, number]) => {
        boardRef.current?.setBoundingBox(bbox, keepAspectRatio);
      },
    }), [keepAspectRatio]);

    return (
      <div
        ref={containerRef}
        id={id}
        className={`jxgbox ${className}`}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          ...style,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    );
  }
);

JSXGraphBoard.displayName = 'JSXGraphBoard';

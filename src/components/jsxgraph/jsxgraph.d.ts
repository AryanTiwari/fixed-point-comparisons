// Type declarations for JSXGraph
declare module 'jsxgraph' {
  export interface ZoomOptions {
    enabled?: boolean;
    wheel?: boolean;
    needShift?: boolean;
    needTwoFingers?: boolean;
    min?: number;
    max?: number;
  }

  export interface PanOptions {
    enabled?: boolean;
    needTwoFingers?: boolean;
    needShift?: boolean;
  }

  export interface BoardAttributes {
    boundingbox?: [number, number, number, number];
    axis?: boolean;
    grid?: boolean;
    showNavigation?: boolean;
    showCopyright?: boolean;
    keepAspectRatio?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pan?: PanOptions | boolean | any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zoom?: ZoomOptions | boolean | any;
    renderer?: 'svg' | 'canvas' | 'vml';
    document?: Document;
  }

  export interface ElementAttributes {
    name?: string;
    size?: number;
    color?: string;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fixed?: boolean;
    visible?: boolean;
    withLabel?: boolean;
    opacity?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    highlight?: boolean;
    dash?: number;
    straightFirst?: boolean;
    straightLast?: boolean;
    firstArrow?: boolean | { type?: number; size?: number };
    lastArrow?: boolean | { type?: number; size?: number };
    label?: {
      offset?: [number, number];
      fontSize?: number;
      color?: string;
      strokeColor?: string;
      visible?: boolean;
      anchorX?: 'left' | 'middle' | 'right';
      anchorY?: 'top' | 'middle' | 'bottom';
    };
    fontSize?: number;
    anchorX?: 'left' | 'middle' | 'right';
    anchorY?: 'top' | 'middle' | 'bottom';
    useMathJax?: boolean;
    useKatex?: boolean;
    ticks?: {
      drawLabels?: boolean;
      drawZero?: boolean;
      insertTicks?: boolean;
      minorTicks?: number;
      majorHeight?: number;
      minorHeight?: number;
      ticksDistance?: number;
      strokeColor?: string;
      visible?: boolean;
    };
  }

  export interface GeometryElement {
    id: string;
    name: string;
    setAttribute(attr: Record<string, unknown>): void;
    getAttribute(key: string): unknown;
    setPosition(method: number, coords: [number, number]): void;
    moveTo(coords: [number, number], time?: number): void;
    show(): void;
    hide(): void;
    remove(): void;
  }

  export interface Board {
    id: string;
    container: string;
    containerObj: HTMLElement;
    create(
      elementType: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parents: any[],
      attributes?: ElementAttributes
    ): GeometryElement;
    removeObject(obj: GeometryElement | GeometryElement[] | string): void;
    update(): void;
    fullUpdate(): void;
    setBoundingBox(
      bbox: [number, number, number, number],
      keepAspectRatio?: boolean
    ): void;
    getBoundingBox(): [number, number, number, number];
    on(event: string, handler: (e: Event) => void): void;
    off(event: string, handler?: (e: Event) => void): void;
    suspendUpdate(): void;
    unsuspendUpdate(): void;
    addChild(board: Board): void;
    removeChild(board: Board): void;
  }

  export interface JXGNamespace {
    JSXGraph: {
      initBoard(
        container: string | HTMLElement,
        attributes?: BoardAttributes
      ): Board;
      freeBoard(board: Board | string): void;
    };
  }

  const JXG: JXGNamespace;
  export default JXG;
}

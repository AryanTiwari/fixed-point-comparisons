# Migration Plan: Mafs to JSXGraph

## Overview

This document outlines the plan to migrate the visualization library from **Mafs** (v0.21.0) to **JSXGraph** for improved interactivity, performance, and flexibility.

---

## Current State

### Library: Mafs
- React-native declarative components
- Used in two main visualization components:
  - `AlgorithmGraph.tsx` - 1D function plots with iteration paths
  - `TrajectoryPlot2D.tsx` - 2D trajectory visualization with vector fields

### Components Used
| Mafs Component | Usage |
|----------------|-------|
| `<Mafs>` | Main container |
| `<Coordinates.Cartesian>` | Grid and axes |
| `<Plot.OfX>` | Function curves (g(x), y=x) |
| `<Point>` | Fixed points, starting points, iteration markers |
| `<Line.Segment>` | Iteration paths, trajectory lines |
| `<Vector>` | Vector field arrows |
| `<LaTeX>` | Point labels |

### Current Limitations with Mafs
- Limited customization of plot appearance
- No built-in slider/interactive controls
- Performance issues with dense vector fields
- Limited plot types (no implicit curves, polar plots)
- Minimal documentation

---

## Target State

### Library: JSXGraph
- Mature, well-documented interactive geometry library
- Better performance for complex visualizations
- Rich interactivity (draggable points, sliders, dynamic constructions)

### React Integration
We will use a custom React wrapper approach (more control than `jsxgraph-react-js`).

---

## Migration Steps

### Phase 1: Setup and Infrastructure

#### 1.1 Install Dependencies
```bash
npm install jsxgraph
npm install --save-dev @types/jsxgraph
```

#### 1.2 Create JSXGraph React Wrapper
Create a reusable `JSXGraphBoard` component that:
- Manages board lifecycle (init/destroy)
- Handles React state synchronization
- Supports theme switching (dark/light)
- Provides imperative API via ref

**New file:** `src/components/jsxgraph/JSXGraphBoard.tsx`

#### 1.3 Add JSXGraph CSS
Import JSXGraph styles in the main entry point or component.

---

### Phase 2: Migrate 1D Visualization (AlgorithmGraph)

#### 2.1 Create JSXGraph Version
**New file:** `src/components/jsxgraph/AlgorithmGraphJSX.tsx`

Features to implement:
- [ ] Cartesian coordinate system with dynamic tick intervals
- [ ] Function plot for g(x) curve
- [ ] Dashed y=x identity line
- [ ] Fixed point marker (orange)
- [ ] Starting point marker (cyan)
- [ ] Animated iteration path (vertical + horizontal lines)
- [ ] Point markers at each iteration
- [ ] Pan and zoom with mouse
- [ ] Dark/light theme support

#### 2.2 JSXGraph Equivalents

| Mafs | JSXGraph |
|------|----------|
| `<Plot.OfX y={func}>` | `board.create('functiongraph', [func])` |
| `<Point x={x} y={y}>` | `board.create('point', [x, y])` |
| `<Line.Segment point1={} point2={}>` | `board.create('segment', [p1, p2])` |
| `<Coordinates.Cartesian>` | `board.create('axis', ...)` (or default axes) |

#### 2.3 Handle Animation
- Use JSXGraph's `board.update()` for step-by-step animation
- Manage iteration state in React, push updates to board

---

### Phase 3: Migrate 2D Visualization (TrajectoryPlot2D)

#### 3.1 Create JSXGraph Version
**New file:** `src/components/jsxgraph/TrajectoryPlot2DJSX.tsx`

Features to implement:
- [ ] 2D coordinate system with adaptive ticks
- [ ] Vector field visualization
- [ ] Multiple trajectory paths (color-coded by algorithm)
- [ ] Start/end point markers with labels
- [ ] Pan and zoom
- [ ] Legend display
- [ ] Dark/light theme support

#### 3.2 Vector Field Implementation
JSXGraph provides better options for vector fields:
```javascript
board.create('vectorfield', [
  [(x, y) => dx(x, y), (x, y) => dy(x, y)],
  [xMin, xMax, yMin, yMax]
]);
```
This should be more performant than manually creating individual `<Vector>` components.

---

### Phase 4: Integration and Cleanup

#### 4.1 Update Parent Components
- `GraphGrid.tsx` - Switch to new `AlgorithmGraphJSX`
- `App.tsx` - Switch to new `TrajectoryPlot2DJSX`

#### 4.2 Theme Integration
Create a theme configuration object for JSXGraph:
```typescript
const jsxGraphTheme = {
  dark: {
    backgroundColor: 'transparent',
    axisColor: '#e2e8f0',
    gridColor: 'rgba(255,255,255,0.15)',
  },
  light: {
    backgroundColor: '#f8fafc',
    axisColor: '#334155',
    gridColor: 'rgba(0,0,0,0.1)',
  }
};
```

#### 4.3 Remove Mafs
```bash
npm uninstall mafs
```
Delete old component files:
- `src/components/AlgorithmGraph.tsx`
- `src/components/TrajectoryPlot2D.tsx`

---

## File Structure After Migration

```
src/components/
├── jsxgraph/
│   ├── JSXGraphBoard.tsx        # Reusable board wrapper
│   ├── AlgorithmGraphJSX.tsx    # 1D visualization
│   ├── TrajectoryPlot2DJSX.tsx  # 2D visualization
│   └── themes.ts                # Theme configurations
├── GraphGrid.tsx                # Updated to use JSXGraph
├── MetricsPanel.tsx             # Unchanged (uses custom SVG)
├── Formula.tsx                  # Unchanged (uses KaTeX)
└── ...
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Incremental migration, keep old components until validated |
| Performance regression | Low | Medium | JSXGraph generally faster; benchmark before removing Mafs |
| Learning curve | Medium | Low | JSXGraph has excellent documentation |
| React state sync issues | Medium | Medium | Use refs and imperative updates carefully |

---

## Testing Checklist

### 1D Visualization
- [ ] Function g(x) renders correctly for all example functions
- [ ] y=x line displays as dashed
- [ ] Fixed point and starting point markers visible
- [ ] Iteration path animates correctly step-by-step
- [ ] Pan (drag) works smoothly
- [ ] Zoom (scroll) centers on cursor
- [ ] Dark/light theme switches correctly
- [ ] All four algorithms display correctly in grid

### 2D Visualization
- [ ] Vector field renders with correct directions
- [ ] Trajectories for each algorithm color-coded correctly
- [ ] Start/End labels positioned correctly
- [ ] Pan and zoom work with 1:1 aspect ratio
- [ ] Performance acceptable with vector field + multiple trajectories
- [ ] Theme switching works

### General
- [ ] No console errors
- [ ] Memory cleanup on unmount (no leaks)
- [ ] Responsive layout preserved
- [ ] Animation controls (play/pause/step) work

---

## Estimated Scope

| Phase | Files Changed | New Files |
|-------|---------------|-----------|
| Phase 1: Setup | `package.json` | 1 wrapper component |
| Phase 2: 1D Migration | `GraphGrid.tsx` | 1 new graph component |
| Phase 3: 2D Migration | `App.tsx` | 1 new plot component |
| Phase 4: Cleanup | Remove 2 old files | 1 themes file |

**Total: ~4-5 new files, 3-4 modified files, 2 deleted files**

---

## Decision Points for Review

1. **React wrapper approach**: Custom wrapper vs `jsxgraph-react-js` package?
   - Recommendation: Custom wrapper for better control

2. **Migration strategy**: Big bang vs incremental?
   - Recommendation: Incremental - build new components alongside old, switch over when validated

3. **Keep Mafs as fallback?**: Should we keep Mafs installed during transition?
   - Recommendation: Yes, until migration is complete and tested

---

## Approval

Please review this plan and confirm:
- [x] Proceed with the migration as outlined
- [ ] Modify the approach (please specify changes)
- [ ] Cancel the migration

## Migration Status: COMPLETED

Migration completed successfully on 2026-02-23.

### What was done:
1. Installed JSXGraph (v1.12.2)
2. Created custom TypeScript type declarations for JSXGraph
3. Created reusable wrapper components in `src/components/jsxgraph/`:
   - `JSXGraphBoard.tsx` - Base board wrapper
   - `AlgorithmGraphJSX.tsx` - 1D function visualization
   - `TrajectoryPlot2DJSX.tsx` - 2D trajectory visualization
   - `themes.ts` - Theme configuration
   - `jsxgraph.d.ts` - TypeScript declarations
4. Updated `GraphGrid.tsx` and `index.ts` to use new components
5. Removed Mafs library and old component files
6. Added JSXGraph CSS styles to `index.css`
7. Cleaned up Mafs-related CSS overrides

### Breaking changes:
None - the component API remained the same, so no changes were needed in parent components.

# React-Sheets

A lightweight, high-performance in-browser basic spreadsheet built with React, Zustand, and CSS-Grid. Supports keyboard navigation, click-drag range selection, per-column width & per-row height resizing, and dynamic viewport sizes.

---

## Features

- **Grid display**  
  Renders tabular data in a scrollable CSS-Grid, with a fixed-width index column on the left.
- **Single-cell & range selection**  
  Click to select; click-and-drag to select a rectangular range; keyboard arrows/Tab/Enter to move, including shift-arrow to grow a range.
- **In-cell editing**  
  Inline `<input>` cells; type freely, then use Enter/Tab/Arrows to commit & move.
- **Per-column width**  
  Drag the thin bar on the right edge of any header cell to resize that column.
- **Per-row height**  
  Drag the thin bar on the bottom edge of any index cell to resize that row.
- **Auto-expand**  
  Arrow-navigate beyond the last column/row and the sheet grows dynamically.
- **Viewport-fit blank cells**  
  On mount & resize, the grid renders enough blank rows/columns to fill the viewport.
- **Persisted state**  
  All cell values, column widths, row heights, and selection survive in the Zustand store; easily serializable for API sync.

---

## Installation

```
git clone https://github.com/your-org/react-sheets.git
cd react-sheets
npm install
```

---

## Running locally

```
# start dev server
npm run dev

# build for production
npm run build
```

## Assumptions & Design Decisions

- **Target scale:** We expect most financial models to be on the order of a few thousand rows and a few dozen columns. Beyond that, users usually aggregate or split models into separate sheets, so we didn’t prioritize full virtual scrolling up‐front.
- **Extensible styling:** All cell and header styles can be overridden via props (`headerCellClassName`, `cellClassName`, `showIndex`), keeping the component library–agnostic and easy to theme.
- **Data persistence in-store:** We chose Zustand as a lightweight, in-memory store so that all cell values, column widths, row heights, and selections live in a single source of truth, easily serializable for API sync, and avoiding prop drilling.
- **CSS Grid layout:** Columns are rendered via a dynamic `gridTemplateColumns` string, giving each column its own track size (for per-column width) without complex flex hacks.
- **Keyboard + mouse navigation:** Unified into a single `keyboardMove` helper and a small drag-and-enter selection mechanism, matching the mental model of both Excel and Google Sheets.

## What We’d Improve with More Time
(Besides standard sheet functionality and styling adjustments)

1. **Virtualization**  
   Integrate row/column virtualization (e.g. `react-window` or `@tanstack/virtual`) to smoothly handle tens of thousands of rows, while preserving formula recalculation and resize behaviors.

2. **Sorting & Filtering**  
   Build a lightweight UI for column-level sorts and filters, including multi-column sort, filter by condition, and custom filter functions—stored in the `columns[]` metadata.

3. **Formula Engine & Custom Functions**  
   Integrate a formula engine (e.g. [formulajs](https://github.com/formulajs/formulajs) or a custom parser) with support for user-defined function modules in case of future advanced functions that can be added on.


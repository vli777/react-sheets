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

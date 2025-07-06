// src/components/Sheet.tsx

import { useSheetStore } from '../store/useSheetStore'
import { Cell } from './Cell'

export interface SheetProps {
  minRows?: number
  minCols?: number
  headerCellClassName?: string
  cellClassName?: string
}

export function Sheet({
  minRows = 50,
  minCols = 10,
  headerCellClassName = 'text-sm',
  cellClassName = 'text-sm',
}: SheetProps) {
  const columns = useSheetStore((s) => s.columns)
  const rowCount = useSheetStore((s) => Math.max(s.rowCount, minRows))
  const colCount = useSheetStore((s) => Math.max(s.colCount, minCols))

  const renderCols = Array.from({ length: colCount }).map(
    (_, i) => columns[i] || { name: '', key: `__blank_${i}` },
  )

  return (
    <div className="overflow-auto whitespace-nowrap border bg-white shadow rounded-md p-4">
      {/* header row */}
      <div className="flex">
        {renderCols.map((_, c) => (
          <Cell
            key={`h-${c}`}
            row={-1}
            col={c}
            className={headerCellClassName}
            rowCount={rowCount}
            colCount={colCount}
          />
        ))}
      </div>

      {/* data rows */}
      {Array.from({ length: rowCount }).map((_, r) => (
        <div key={`r-${r}`} className="flex">
          {renderCols.map((_, c) => (
            <Cell
              key={`d-${r}-${c}`}
              row={r}
              col={c}
              className={cellClassName}
              rowCount={rowCount}
              colCount={colCount}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

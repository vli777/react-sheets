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
  const apiCols = useSheetStore((s) => s.columns)
  const apiRows = useSheetStore((s) => s.rowCount)

  const rowCount = Math.max(apiRows, minRows)
  const colCount = Math.max(apiCols.length, minCols)
  const totalRows = rowCount + 1

  return (
    <div className="overflow-auto border bg-white shadow rounded-md p-4">
      {Array.from({ length: totalRows }).map((_, r) => {
        const isHeader = r === 0
        const dataRow = r - 1

        return (
          <div key={`row-${r}`} className="flex">
            {Array.from({ length: colCount }).map((_, c) => (
              <Cell
                key={`cell-${r}-${c}`}
                row={isHeader ? -1 : dataRow}
                col={c}
                className={isHeader ? headerCellClassName : cellClassName}
                rowCount={rowCount}
                colCount={colCount}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

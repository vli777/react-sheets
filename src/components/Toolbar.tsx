import React from 'react'
import { useSheetStore } from '../store/useSheetStore'
import { getCellId, parseCellId } from '../utils/getCellId'

function getRangeBounds(anchor: string, head: string) {
  const a = parseCellId(anchor)
  const h = parseCellId(head)
  
  return {
    startCol: Math.min(a.col, h.col),
    endCol: Math.max(a.col, h.col),
    startRow: Math.min(a.row, h.row),
    endRow: Math.max(a.row, h.row),
  }
}

export const Toolbar: React.FC = () => {
  const selection = useSheetStore((s) => s.selection)
  const rangeAnchor = useSheetStore((s) => s.rangeAnchor)
  const rangeHead = useSheetStore((s) => s.rangeHead)
  const cells = useSheetStore((s) => s.cells)

  let display = ''
  let valueDisplay = ''

  if (rangeAnchor && rangeHead && rangeAnchor !== rangeHead) {
    // Multi-cell range
    const { startCol, endCol, startRow, endRow } = getRangeBounds(rangeAnchor, rangeHead)
    const startId = getCellId(startCol, startRow)
    const endId = getCellId(endCol, endRow)
    display = `${startId}:${endId}`
    const values: string[] = []
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const id = getCellId(c, r)
        values.push(cells[id]?.value ?? '')
      }
    }
    valueDisplay = values.join(', ')
  } else if (selection) {
    // Single cell
    display = selection
    valueDisplay = cells[selection]?.value ?? ''
  } else {
    display = 'No selection'
    valueDisplay = ''
  }

  return (
    <div className="w-full px-4 py-2 bg-gray-100 border-b border-gray-300 flex items-center text-sm font-mono min-h-[40px]">
      <span className="text-gray-600 mr-4">{display}</span>
      <span className="truncate text-gray-900">{valueDisplay}</span>
    </div>
  )
} 
import React from 'react'
import { useSheetStore } from '../store/useSheetStore'
import { getCellId, parseCellId } from '../utils/getCellId'
import { isFormula } from '../utils/formulas'

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
  const setCell = useSheetStore((s) => s.setCell)
  const getCellValue = useSheetStore((s) => s.getCellValue)

  let display = ''
  let valueDisplay = ''
  let rawValue = ''

  if (rangeAnchor && rangeHead && rangeAnchor !== rangeHead) {
    // Multi-cell range
    const { startCol, endCol, startRow, endRow } = getRangeBounds(rangeAnchor, rangeHead)
    const startId = getCellId(startCol, startRow)
    const endId = getCellId(endCol, endRow)
    display = `${startId}:${endId}`
    // Show only the focused cell's value (like Google Sheets)
    if (selection) {
      rawValue = cells[selection]?.value ?? ''
      valueDisplay = getCellValue(selection)
    }
  } else if (selection) {
    // Single cell
    display = selection
    rawValue = cells[selection]?.value ?? ''
    valueDisplay = getCellValue(selection)
  } else {
    display = 'No selection'
    valueDisplay = ''
    rawValue = ''
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selection) {
      setCell(selection, e.target.value)
    }
  }

  return (
    <div className="w-full px-4 py-2 bg-gray-100 dark:bg-[#161b22] border-b border-gray-300 dark:border-[#30363d] flex items-center text-sm font-mono min-h-[40px]">
      <span className="text-gray-600 dark:text-[#8b949e] mr-4">{display}</span>
      <input
        type="text"
        value={rawValue}
        onChange={handleValueChange}
        className="truncate text-gray-900 dark:text-[#c9d1d9] bg-transparent border-none outline-none flex-1 placeholder-gray-500 dark:placeholder-[#8b949e]"
        placeholder="No selection"
        disabled={!selection}
      />
      {isFormula(rawValue) && valueDisplay !== rawValue && !valueDisplay.startsWith('#ERROR') && (
        <span className="ml-2 text-gray-500 dark:text-[#8b949e]">
          = {valueDisplay}
        </span>
      )}
    </div>
  )
} 
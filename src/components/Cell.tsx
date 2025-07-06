// src/components/Cell.tsx

import React, { useEffect, useRef } from 'react'
import { getCellId, parseCellId } from '../utils/getCellId'
import { keyboardMove } from '../utils/keyboardMove'
import { useSheetStore } from '../store/useSheetStore'

const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'])

const BASE_CELL_CLASS = 'flex-1 min-w-0 box-border p-1 truncate text-sm'

export interface CellProps {
  col: number
  row: number
  className?: string
  rowCount: number
  colCount: number
}

export function Cell({ row, col, className = '' }: CellProps) {
  const id = getCellId(col, row)
  const cols = useSheetStore((s) => s.columns)
  const dataVal = useSheetStore((s) => s.cells[id]?.value ?? '')
  const selection = useSheetStore((s) => s.selection)
  const setCell = useSheetStore((s) => s.setCell)
  const setCol = useSheetStore((s) => s.setColumnName)
  const setSel = useSheetStore((s) => s.setSelection)
  const setRowCount = useSheetStore((s) => s.setRowCount)
  const setColCount = useSheetStore((s) => s.setColCount)
  const ref = useRef<HTMLInputElement>(null)

  const isHeader = row === -1
  const value = isHeader ? cols[col]?.name ?? '' : dataVal

  useEffect(() => {
    if (selection === id) {
      ref.current?.focus({ preventScroll: true })
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [selection, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (isHeader) {
      setCol(col, v)
    } else {
      setCell(id, v)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!NAV_KEYS.has(e.key)) return

    const next = keyboardMove({
      cellId: id,
      key: e.key,
      shiftKey: e.shiftKey,
    })

    if (next) {
      e.preventDefault()

      const { col: nc, row: nr } = parseCellId(next)
      setColCount(nc + 1)
      setRowCount(nr + 1)
      setSel(next)

      const nextInput = document.getElementById(next) as HTMLInputElement | null
      nextInput?.focus({ preventScroll: true })
    }
  }

  return (
    <input
      id={id}
      ref={ref}
      type="text"
      className={`
        ${BASE_CELL_CLASS}
        ${className}
        ${selection === id ? 'border-blue-500' : 'border-gray-200'}
        focus:border-blue-400
        `}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onClick={() => setSel(id)}
      spellCheck="false"
      autoComplete="off"
    />
  )
}

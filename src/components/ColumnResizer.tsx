// src/components/ColumnResizer.tsx

import { useSheetStore, MIN_COL_PX } from '../store/useSheetStore'
import { useRef } from 'react'

export function ColumnResizer({ colIndex }: { colIndex: number }) {
  const setWidth = useSheetStore((s) => s.setColumnWidth)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseMove = (e: MouseEvent) => {
    const delta = e.clientX - startX.current
    setWidth(colIndex, startW.current + delta)
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <span
      className="absolute top-0 right-0 h-full w-1 cursor-col-resize"
      onMouseDown={(e) => {
        startX.current = e.clientX
        startW.current = useSheetStore.getState().columns[colIndex]?.width ?? MIN_COL_PX
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
      }}
    />
  )
}

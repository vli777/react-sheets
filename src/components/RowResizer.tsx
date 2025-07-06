// src/components/RowResizer.tsx

import { useSheetStore, MIN_ROW_PX } from '../store/useSheetStore'
import { useRef } from 'react'

export function RowResizer({ rowIndex }: { rowIndex: number }) {
  const setHeight = useSheetStore((s) => s.setRowHeight)
  const startY = useRef(0)
  const startH = useRef(0)

  const onMouseMove = (e: MouseEvent) => {
    const delta = e.clientY - startY.current
    setHeight(rowIndex, startH.current + delta)
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <span
      className="absolute left-0 bottom-0 w-full h-1 cursor-row-resize"
      onMouseDown={(e) => {
        startY.current = e.clientY
        startH.current = useSheetStore.getState().rowMeta[rowIndex]?.height ?? MIN_ROW_PX
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
      }}
    />
  )
}

// src/utils/apiTransform.ts

import type { ApiResponse, Column } from '../types/api'
import { getCellId } from './getCellId'

/**
 * Convert API response to internal cell map.
 * Returns a blank sheet if data is missing or malformed.
 */
export function apiToCellMap(apiData?: ApiResponse) {
  if (
    !apiData ||
    !apiData.values ||
    !Array.isArray(apiData.values.columns) ||
    !Array.isArray(apiData.values.items)
  ) {
    return {
      cellMap: {} as Record<string, { value: string }>,
      columnHeaders: [] as string[],
      rowCount: 0,
      colCount: 0,
      columns: [] as Column[],
    }
  }

  const { columns, items } = apiData.values
  const cellMap: Record<string, { value: string }> = {}

  for (let row = 0; row < items.length; row++) {
    const item = items[row] || {}
    for (let col = 0; col < columns.length; col++) {
      const key = columns[col].key
      const id = getCellId(col, row)
      const raw = item[key]
      cellMap[id] = { value: raw != null ? String(raw) : '' }
    }
  }

  return {
    cellMap,
    columnHeaders: columns.map((c) => c.name),
    rowCount: items.length,
    colCount: columns.length,
    columns,
  }
}

/**
 * Convert internal cell map back to API response shape.
 */
export function cellMapToApi(
  cellMap: Record<string, { value: string }>,
  columns: Column[],
  rowCount: number,
): ApiResponse {
  const items: Array<Record<string, string>> = []

  for (let row = 0; row < rowCount; row++) {
    const item: Record<string, string> = {}
    for (let col = 0; col < columns.length; col++) {
      const key = columns[col].key
      const id = getCellId(col, row)
      item[key] = cellMap[id]?.value ?? ''
    }
    items.push(item)
  }

  return {
    values: {
      columns,
      items,
    },
  }
}

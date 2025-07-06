// src/utils/getCellId.ts

export function getCellId(col: number, row: number): string {
  let colLabel = ''
  let colNum = col

  // Build the column letters (A, B, …, Z, AA, AB, …)
  while (colNum >= 0) {
    colLabel = String.fromCharCode(65 + (colNum % 26)) + colLabel
    colNum = Math.floor(colNum / 26) - 1
  }

  // Append 1-based row number
  return `${colLabel}${row + 1}`
}

export function parseCellId(cellId: string): { col: number; row: number } {
  // Match letter(s) + number(s)
  const match = cellId.match(/^([A-Z]+)(\d+)$/)
  if (!match) throw new Error(`Invalid cell ID format: ${cellId}`)

  // Destructure the match into its parts
  const [, colLabel, rowStr] = match

  // Convert row portion to zero-based index
  const row = parseInt(rowStr, 10) - 1

  // Compute zero-based column index from letters
  let col = 0
  for (let i = 0; i < colLabel.length; i++) {
    col = col * 26 + (colLabel.charCodeAt(i) - 65)
  }

  return { col, row }
}

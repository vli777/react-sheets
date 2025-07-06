export interface Column {
  name: string
  key: string
}

export interface Item {
  [key: string]: string | number
}

export interface Values {
  columns: Column[]
  items: Item[]
}

export interface ApiResponse {
  values: Values
}

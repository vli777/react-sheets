import { Toolbar } from './Toolbar'
import { Sheet } from './Sheet'

export function SheetWithToolbar() {
  return (
    <div className="p-4 m-4 bg-white rounded-lg shadow-lg flex flex-col items-center w-full min-w-[600px] max-w-5xl">
      <Toolbar />
      <Sheet />
    </div>
  )
} 
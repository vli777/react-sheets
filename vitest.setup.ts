// vitest.setup.ts

import '@testing-library/jest-dom/vitest'

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = function () {}
}

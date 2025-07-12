import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSheetStore } from '../src/store/useSheetStore';

// Mock canvas for text measurement
const mockMeasureText = vi.fn();
const mockGetContext = vi.fn(() => ({
  measureText: mockMeasureText,
  font: '',
}));

// Mock document.createElement for canvas
const mockCreateElement = vi.fn(() => ({
  getContext: mockGetContext,
}));

beforeEach(() => {
  // Reset store state
  useSheetStore.setState({
    cells: {},
    columns: [],
    rowCount: 0,
    colCount: 0,
    selection: null,
    rangeAnchor: null,
    rangeHead: null,
    rowMeta: [],
    history: [],
    historyIndex: -1,
  });

  // Reset mocks
  vi.clearAllMocks();
  mockMeasureText.mockReset();
  mockGetContext.mockReset();
  mockCreateElement.mockReset();
});

describe('autoFitColumnWidth', () => {
  it('calculates width based on header text', () => {
    // Mock canvas measurement
    mockMeasureText.mockReturnValue({ width: 80 });
    vi.stubGlobal('document', { createElement: mockCreateElement });

    // Set up store with header text
    useSheetStore.setState({
      columns: [{ name: 'Long Header Text', key: 'A' }],
      rowCount: 0,
    });

    const autoFitColumnWidth = useSheetStore.getState().autoFitColumnWidth;
    autoFitColumnWidth(0);

    // Verify canvas was used for measurement
    expect(mockCreateElement).toHaveBeenCalledWith('canvas');
    expect(mockGetContext).toHaveBeenCalledWith('2d');
    expect(mockMeasureText).toHaveBeenCalledWith('Long Header Text');

    // Check that column width was updated
    const state = useSheetStore.getState();
    expect(state.columns[0].width).toBeGreaterThan(80);
  });

  it('calculates width based on cell content', () => {
    // Mock canvas measurement for different text lengths
    mockMeasureText
      .mockReturnValueOnce({ width: 40 }) // Header
      .mockReturnValueOnce({ width: 120 }) // Cell A1
      .mockReturnValueOnce({ width: 60 }); // Cell A2
    vi.stubGlobal('document', { createElement: mockCreateElement });

    // Set up store with cells containing different text lengths
    useSheetStore.setState({
      columns: [{ name: 'Header', key: 'A' }],
      cells: {
        'A1': { value: 'Very long cell content that should determine the width' },
        'A2': { value: 'Short' },
      },
      rowCount: 2,
    });

    const autoFitColumnWidth = useSheetStore.getState().autoFitColumnWidth;
    autoFitColumnWidth(0);

    // Should use the longest cell content (120px + padding)
    const state = useSheetStore.getState();
    expect(state.columns[0].width).toBeGreaterThan(120);
  });

  it('respects minimum column width', () => {
    // Mock very short text
    mockMeasureText.mockReturnValue({ width: 10 });
    vi.stubGlobal('document', { createElement: mockCreateElement });

    useSheetStore.setState({
      columns: [{ name: 'A', key: 'A' }],
      rowCount: 0,
    });

    const autoFitColumnWidth = useSheetStore.getState().autoFitColumnWidth;
    autoFitColumnWidth(0);

    const state = useSheetStore.getState();
    // Should be at least MIN_COL_RESIZE_PX (15px)
    expect(state.columns[0].width).toBeGreaterThanOrEqual(15);
  });

  it('handles empty cells and headers', () => {
    mockMeasureText.mockReturnValue({ width: 0 });
    vi.stubGlobal('document', { createElement: mockCreateElement });

    useSheetStore.setState({
      columns: [{ name: '', key: 'A' }],
      cells: {
        'A1': { value: '' },
        'A2': { value: '' },
      },
      rowCount: 2,
    });

    const autoFitColumnWidth = useSheetStore.getState().autoFitColumnWidth;
    autoFitColumnWidth(0);

    const state = useSheetStore.getState();
    // Should use minimum width when all content is empty
    expect(state.columns[0].width).toBeGreaterThanOrEqual(15);
  });

  it('pads columns array if needed', () => {
    mockMeasureText.mockReturnValue({ width: 50 });
    vi.stubGlobal('document', { createElement: mockCreateElement });

    // Try to auto-fit a column that doesn't exist yet
    useSheetStore.setState({
      columns: [],
      rowCount: 0,
    });

    const autoFitColumnWidth = useSheetStore.getState().autoFitColumnWidth;
    autoFitColumnWidth(2); // Column index 2 doesn't exist

    const state = useSheetStore.getState();
    // Should create the column and set its width
    expect(state.columns.length).toBeGreaterThan(2);
    expect(state.columns[2].width).toBeGreaterThan(50);
  });
}); 
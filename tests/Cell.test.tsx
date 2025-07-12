import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Cell } from '../src/components/Cell';
import { useSheetStore } from '../src/store/useSheetStore';
import '@testing-library/jest-dom';

// Helper to reset store before each test
beforeEach(() => {
  useSheetStore.setState({
    cells: { 'A1': { value: 'foo' }, 'B1': { value: 'bar' } },
    columns: [{ name: 'Col1', key: 'A' }, { name: 'Col2', key: 'B' }],
    rowCount: 1,
    colCount: 2,
    selection: null,
    rangeAnchor: null,
    rangeHead: null,
    rowMeta: [],
  });
});

describe('Cell', () => {
  it('renders a data cell', () => {
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    expect(getByDisplayValue('foo')).not.toBeNull();
  });

  it('renders a header cell', () => {
    const { getByDisplayValue } = render(
      <Cell row={-1} col={1} maxCol={2} maxRow={1} />
    );
    expect(getByDisplayValue('Col2')).not.toBeNull();
  });

  it('edits a data cell', () => {
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    fireEvent.change(input, { target: { value: 'baz' } });
    expect(useSheetStore.getState().cells['A1'].value).toBe('baz');
  });

  it('edits a header cell', () => {
    const { getByDisplayValue } = render(
      <Cell row={-1} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('Col1');
    fireEvent.change(input, { target: { value: 'Header' } });
    expect(useSheetStore.getState().columns[0].name).toBe('Header');
  });

  it('focuses when selected', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    expect(document.activeElement).toBe(input);
  });

  it('handles keyboard navigation', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    // Should move selection to B1
    expect(useSheetStore.getState().selection).toBe('B1');
  });

  it('confirms formula with Enter and stays in cell', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    
    // Set cell to edit mode first
    useSheetStore.setState({ editingCellId: 'A1' });
    
    // Type a formula
    fireEvent.change(input, { target: { value: '=SUM(B1:B3)' } });
    
    // Press Enter - should confirm formula and stay in cell
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Should still be in A1
    expect(useSheetStore.getState().selection).toBe('A1');
    // Should have the formula value
    expect(useSheetStore.getState().cells['A1'].value).toBe('=SUM(B1:B3)');
  });

  it('moves to next cell with Enter for non-formula input', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    
    // Type regular text
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    // Press Enter - should move to next cell
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Should move to A2 (next row)
    expect(useSheetStore.getState().selection).toBe('A2');
  });

  it('allows range selection during formula input', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    
    // Type a formula
    fireEvent.change(input, { target: { value: '=SUM(' } });
    
    // Click on another cell to select range (should not clear range)
    const cellContainer = input.closest('div');
    fireEvent.mouseDown(cellContainer!, { button: 0 });
    
    // Should still have the formula value
    expect(useSheetStore.getState().cells['A1'].value).toBe('=SUM(');
  });

  it('allows range selection during formula editing', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByDisplayValue } = render(
      <Cell row={0} col={0} maxCol={2} maxRow={1} />
    );
    const input = getByDisplayValue('foo');
    
    // Set cell to edit mode and type a formula
    useSheetStore.setState({ editingCellId: 'A1' });
    fireEvent.change(input, { target: { value: '=SUM(' } });
    
    // Verify we're in edit mode
    expect(input).toHaveValue('=SUM(');
    
    // Click on another cell to start range selection
    const cellContainer = input.closest('div');
    fireEvent.mouseDown(cellContainer!, { button: 0 });
    
    // Verify we're still in edit mode and the formula is preserved
    expect(useSheetStore.getState().cells['A1'].value).toBe('=SUM(');
    expect(useSheetStore.getState().editingCellId).toBe('A1');
  });
}); 
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
}); 
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Toolbar } from '../src/components/Toolbar';
import { useSheetStore } from '../src/store/useSheetStore';

beforeEach(() => {
  useSheetStore.setState({
    selection: null,
    rangeAnchor: null,
    rangeHead: null,
    cells: { 'A1': { value: 'foo' }, 'B1': { value: 'bar' }, 'A2': { value: 'baz' } },
  });
});

describe('Toolbar', () => {
  it('shows no selection by default', () => {
    const { getByText, getByPlaceholderText } = render(<Toolbar />);
    expect(getByText('No selection')).toBeInTheDocument();
    expect(getByPlaceholderText('No selection')).toBeInTheDocument();
  });

  it('shows single cell selection', () => {
    useSheetStore.setState({ selection: 'A1' });
    const { getByText, getByDisplayValue } = render(<Toolbar />);
    expect(getByText('A1')).toBeInTheDocument();
    expect(getByDisplayValue('foo')).toBeInTheDocument();
  });

  it('shows multi-cell range', () => {
    useSheetStore.setState({ rangeAnchor: 'A1', rangeHead: 'B2', selection: 'A1' });
    const { getByText, getByDisplayValue } = render(<Toolbar />);
    // Should show range A1:B2 and values foo, bar, baz
    expect(getByText('A1:B2')).toBeInTheDocument();
    // Should show only the focused cell's value (foo from A1)
    expect(getByDisplayValue('foo')).toBeInTheDocument();
  });
}); 
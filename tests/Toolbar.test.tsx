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
    cells: { 'A0': { value: 'foo' }, 'B0': { value: 'bar' }, 'A1': { value: 'baz' } },
  });
});

describe('Toolbar', () => {
  it('shows no selection by default', () => {
    const { getByText } = render(<Toolbar />);
    expect(getByText('No selection')).toBeInTheDocument();
  });

  it('shows single cell selection', () => {
    useSheetStore.setState({ selection: 'A0' });
    const { getByText } = render(<Toolbar />);
    expect(getByText('A0')).toBeInTheDocument();
    expect(getByText('foo')).toBeInTheDocument();
  });

  it('shows multi-cell range', () => {
    useSheetStore.setState({ rangeAnchor: 'A0', rangeHead: 'B1', selection: 'A0' });
    const { getByText } = render(<Toolbar />);
    // Should show range A0:B1 and values foo, bar, baz
    expect(getByText('A0:B1')).toBeInTheDocument();
    // Should show only the focused cell's value (foo from A0)
    expect(getByText('foo')).toBeInTheDocument();
  });
}); 
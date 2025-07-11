import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ColumnResizer } from '../src/components/ColumnResizer';
import { useSheetStore } from '../src/store/useSheetStore';

beforeEach(() => {
  useSheetStore.setState({
    columns: [{ name: 'Col1', key: 'A', width: 144 }],
    cells: {},
    rowCount: 0,
    colCount: 1,
    setColumnWidth: vi.fn(),
    autoFitColumnWidth: vi.fn(),
  });
});

describe('ColumnResizer', () => {
  it('renders when isResizable is true', () => {
    const { container } = render(<ColumnResizer colIndex={0} isResizable={true} />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('does not render when isResizable is false', () => {
    const { container } = render(<ColumnResizer colIndex={0} isResizable={false} />);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('triggers mouse event listeners on mousedown', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const { container } = render(<ColumnResizer colIndex={0} isResizable={true} />);
    const resizer = container.querySelector('span');
    fireEvent.mouseDown(resizer!, { clientX: 100 });
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  it('calls autoFitColumnWidth on double click', async () => {
    const autoFitSpy = vi.fn();
    useSheetStore.setState({ autoFitColumnWidth: autoFitSpy });
    
    const { container } = render(<ColumnResizer colIndex={0} isResizable={true} />);
    const resizer = await container.querySelector('span');
    expect(resizer).toBeInTheDocument();
    
    fireEvent.doubleClick(resizer!);
    
    expect(autoFitSpy).toHaveBeenCalledWith(0);
  });

  it('does not call autoFitColumnWidth when isResizable is false', async () => {
    const autoFitSpy = vi.fn();
    useSheetStore.setState({ autoFitColumnWidth: autoFitSpy });
    
    const { container } = render(<ColumnResizer colIndex={0} isResizable={false} />);
    const resizer = await container.querySelector('span');
    
    // Should not render when not resizable
    expect(resizer).not.toBeInTheDocument();
  });
}); 
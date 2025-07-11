import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SheetWithToolbar } from '../src/components/SheetWithToolbar';

// Mock Toolbar and Sheet to isolate the test
vi.mock('../src/components/Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar" />,
}));
vi.mock('../src/components/Sheet', () => ({
  Sheet: () => <div data-testid="sheet" />,
}));

describe('SheetWithToolbar', () => {
  it('renders Toolbar and Sheet', () => {
    const { getByTestId } = render(<SheetWithToolbar />);
    expect(getByTestId('toolbar')).toBeInTheDocument();
    expect(getByTestId('sheet')).toBeInTheDocument();
  });
}); 
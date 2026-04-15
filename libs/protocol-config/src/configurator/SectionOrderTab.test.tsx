import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DEFAULT_PROTOCOL_CONFIG } from '../defaults';
import { getSectionEnabled, toggleSectionEnabled } from './SectionOrderTab';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: 'vertical',
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: vi.fn((arr: string[], from: number, to: number) => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock('@shared/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Switch: ({ checked, onCheckedChange, ...props }: Record<string, unknown>) => (
    <input
      type="checkbox"
      role="switch"
      checked={checked as boolean}
      onChange={() => (onCheckedChange as () => void)()}
      {...props}
    />
  ),
}));

// Import after mocks
const { SectionOrderTab } = await import('./SectionOrderTab');

describe('SectionOrderTab', () => {
  it('renders a card for each section in sectionOrder', () => {
    render(
      <SectionOrderTab config={DEFAULT_PROTOCOL_CONFIG} onChange={vi.fn()} />
    );
    expect(screen.getByText('Nagłówek')).toBeInTheDocument();
    expect(screen.getByText('Dane klienta')).toBeInTheDocument();
    expect(screen.getByText('Podpis klienta')).toBeInTheDocument();
  });

  it('renders header card without drag handle', () => {
    render(
      <SectionOrderTab config={DEFAULT_PROTOCOL_CONFIG} onChange={vi.fn()} />
    );
    expect(screen.getByTestId('pinned-card-header')).toBeInTheDocument();
    expect(screen.queryByTestId('drag-handle-header')).not.toBeInTheDocument();
  });

  it('renders customerSignature card without drag handle', () => {
    render(
      <SectionOrderTab config={DEFAULT_PROTOCOL_CONFIG} onChange={vi.fn()} />
    );
    expect(screen.getByTestId('pinned-card-customerSignature')).toBeInTheDocument();
    expect(screen.queryByTestId('drag-handle-customerSignature')).not.toBeInTheDocument();
  });
});

describe('getSectionEnabled', () => {
  it('returns fuelLevel.enabled for fuelOdometer section', () => {
    expect(getSectionEnabled(DEFAULT_PROTOCOL_CONFIG, 'fuelOdometer')).toBe(true);
  });

  it('returns false for valuableItems when disabled', () => {
    expect(getSectionEnabled(DEFAULT_PROTOCOL_CONFIG, 'valuableItems')).toBe(false);
  });
});

describe('toggleSectionEnabled', () => {
  it('toggles fuelOdometer', () => {
    const result = toggleSectionEnabled(DEFAULT_PROTOCOL_CONFIG, 'fuelOdometer');
    expect(result.builtInFields.fuelLevel.enabled).toBe(false);
  });
});

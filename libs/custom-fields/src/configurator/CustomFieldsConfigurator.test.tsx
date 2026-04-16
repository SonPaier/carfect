import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomFieldsConfigurator } from './CustomFieldsConfigurator';
import type { CustomFieldDefinition } from '../types';

// Mock the useCustomFields hook
vi.mock('../useCustomFields', () => ({
  useCustomFields: vi.fn(),
}));

import { useCustomFields } from '../useCustomFields';

const mockUseCustomFields = useCustomFields as ReturnType<typeof vi.fn>;

const makeDefinition = (overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition => ({
  id: 'field-1',
  instance_id: 'inst-1',
  context: 'protocol',
  field_type: 'text',
  label: 'My Field',
  required: false,
  sort_order: 0,
  config: {},
  ...overrides,
});

const mockSupabase = {} as Parameters<typeof CustomFieldsConfigurator>[0]['supabase'];

const defaultHookReturn = {
  definitions: [],
  isLoading: false,
  addField: vi.fn(),
  updateField: vi.fn(),
  removeField: vi.fn(),
  reorderFields: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCustomFields.mockReturnValue(defaultHookReturn);
});

describe('CustomFieldsConfigurator', () => {
  it('renders loading spinner while fetching', () => {
    mockUseCustomFields.mockReturnValue({ ...defaultHookReturn, isLoading: true });
    render(
      <CustomFieldsConfigurator instanceId="inst-1" context="protocol" supabase={mockSupabase} />,
    );
    // The spinner is rendered via Loader2 with animate-spin
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no fields', () => {
    mockUseCustomFields.mockReturnValue({ ...defaultHookReturn, definitions: [] });
    render(
      <CustomFieldsConfigurator instanceId="inst-1" context="protocol" supabase={mockSupabase} />,
    );
    expect(screen.getByText('Brak pól własnych')).toBeInTheDocument();
  });

  it('renders a card for each definition', () => {
    const definitions = [
      makeDefinition({ id: 'field-1', label: 'First Field' }),
      makeDefinition({ id: 'field-2', label: 'Second Field', sort_order: 1 }),
    ];
    mockUseCustomFields.mockReturnValue({ ...defaultHookReturn, definitions });
    render(
      <CustomFieldsConfigurator instanceId="inst-1" context="protocol" supabase={mockSupabase} />,
    );
    expect(screen.getByDisplayValue('First Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second Field')).toBeInTheDocument();
  });

  it('calls addField when add button clicked', async () => {
    const user = userEvent.setup();
    const addField = vi.fn();
    mockUseCustomFields.mockReturnValue({ ...defaultHookReturn, addField });
    render(
      <CustomFieldsConfigurator instanceId="inst-1" context="protocol" supabase={mockSupabase} />,
    );
    await user.click(screen.getByRole('button', { name: /Dodaj pole/i }));
    expect(addField).toHaveBeenCalledWith({
      field_type: 'text',
      label: 'Nowe pole',
      required: false,
      sort_order: 0,
      config: {},
    });
  });
});

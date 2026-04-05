import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mocks
// ============================================================

const mockInvoke = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// ============================================================
// Import after mocks
// ============================================================

import { useCreateInstanceUser } from './useCreateInstanceUser';

// ============================================================
// Constants
// ============================================================

const INSTANCE_ID = 'inst-123';
const VALID_SESSION = { data: { session: { access_token: 'tok-abc' } } };
const NO_SESSION = { data: { session: null } };

// ============================================================
// Tests
// ============================================================

describe('useCreateInstanceUser', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(VALID_SESSION);
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  it('starts with isPending false', () => {
    const { result } = renderHook(() => useCreateInstanceUser());
    expect(result.current.isPending).toBe(false);
  });

  it('calls manage-instance-users edge function with correct params', async () => {
    const { result } = renderHook(() => useCreateInstanceUser());

    await act(async () => {
      await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'jankowalski',
        password: 'SecurePass1!',
        role: 'employee',
      });
    });

    expect(mockInvoke).toHaveBeenCalledWith('manage-instance-users', {
      body: {
        action: 'create',
        instanceId: INSTANCE_ID,
        username: 'jankowalski',
        password: 'SecurePass1!',
        role: 'employee',
      },
    });
  });

  it('includes hallId in body only when role is hall and hallId is provided', async () => {
    const { result } = renderHook(() => useCreateInstanceUser());

    await act(async () => {
      await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'halluser',
        password: 'SecurePass1!',
        role: 'hall',
        hallId: 'hall-42',
      });
    });

    expect(mockInvoke).toHaveBeenCalledWith('manage-instance-users', {
      body: expect.objectContaining({
        role: 'hall',
        hallId: 'hall-42',
      }),
    });
  });

  it('does not include hallId when role is employee even if hallId is provided', async () => {
    const { result } = renderHook(() => useCreateInstanceUser());

    await act(async () => {
      await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'emp',
        password: 'SecurePass1!',
        role: 'employee',
        hallId: 'hall-42',
      });
    });

    const body = mockInvoke.mock.calls[0][1].body;
    expect(body).not.toHaveProperty('hallId');
  });

  it('throws error when session is missing', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);

    const { result } = renderHook(() => useCreateInstanceUser());

    await expect(
      act(async () => {
        await result.current.createUser({
          instanceId: INSTANCE_ID,
          username: 'jan',
          password: 'pass',
          role: 'employee',
        });
      }),
    ).rejects.toThrow('Sesja wygasła');
  });

  it('throws error when edge function returns an error object', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Username taken' } });

    const { result } = renderHook(() => useCreateInstanceUser());

    await expect(
      act(async () => {
        await result.current.createUser({
          instanceId: INSTANCE_ID,
          username: 'jan',
          password: 'SecurePass1!',
          role: 'employee',
        });
      }),
    ).rejects.toThrow('Username taken');
  });

  it('throws error when edge function returns data with error field', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'User already exists' }, error: null });

    const { result } = renderHook(() => useCreateInstanceUser());

    await expect(
      act(async () => {
        await result.current.createUser({
          instanceId: INSTANCE_ID,
          username: 'jan',
          password: 'SecurePass1!',
          role: 'employee',
        });
      }),
    ).rejects.toThrow('User already exists');
  });

  it('sets isPending to false after successful call', async () => {
    const { result } = renderHook(() => useCreateInstanceUser());

    await act(async () => {
      await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'jan',
        password: 'SecurePass1!',
        role: 'employee',
      });
    });

    expect(result.current.isPending).toBe(false);
  });

  it('sets isPending to false even after a failed call', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Fail' } });

    const { result } = renderHook(() => useCreateInstanceUser());

    await act(async () => {
      await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'jan',
        password: 'SecurePass1!',
        role: 'employee',
      }).catch(() => {});
    });

    expect(result.current.isPending).toBe(false);
  });

  it('returns data from edge function on success', async () => {
    const mockData = { userId: 'user-new-99' };
    mockInvoke.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useCreateInstanceUser());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.createUser({
        instanceId: INSTANCE_ID,
        username: 'jan',
        password: 'SecurePass1!',
        role: 'employee',
      });
    });

    expect(returnValue).toEqual(mockData);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mocks — must be declared before any imports
// ============================================================

const mockOnAuthStateChange = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockSetSentryUser = vi.fn();
const mockClearSentryUser = vi.fn();

vi.mock('@/lib/sentry', () => ({
  setSentryUser: (...args: unknown[]) => mockSetSentryUser(...args),
  clearSentryUser: (...args: unknown[]) => mockClearSentryUser(...args),
}));

// ============================================================
// Imports after mocks
// ============================================================

import { AuthProvider, useAuth } from './useAuth';

// ============================================================
// Helpers
// ============================================================

/** Default unsubscribe spy shared across tests */
let mockUnsubscribe: ReturnType<typeof vi.fn>;

/** Auth state change callback captured from onAuthStateChange calls */
let capturedAuthCallback: ((event: string, session: unknown) => void) | null = null;

const makeUser = (id = 'user-1', email = 'user@example.com') => ({
  id,
  email,
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
});

const makeSession = (userId = 'user-1') => ({
  user: makeUser(userId),
  access_token: 'tok-abc',
  token_type: 'bearer',
  expires_in: 3600,
});

/** Chainable query builder that resolves with provided data */
const makeQueryBuilder = (data: unknown, error: unknown = null) => {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'order',
    'limit',
    'range',
    'filter',
    'is',
    'in',
    'or',
    'not',
  ];
  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });

  builder['maybeSingle'] = vi.fn().mockResolvedValue({ data, error });
  builder['single'] = vi.fn().mockResolvedValue({ data, error });
  builder['then'] = (resolve: (v: unknown) => void) => {
    resolve({ data, error });
  };

  void chain; // satisfy unused variable lint
  return builder;
};

/**
 * Set up supabase.from() to return roles + profile data.
 * user_roles returns `roles`, profiles returns `profile`.
 */
const setupFromMock = (
  roles: { role: string; instance_id: string | null; hall_id: string | null }[] = [],
  profile: { username: string } | null = null,
) => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return makeQueryBuilder(roles);
    }
    if (table === 'profiles') {
      return makeQueryBuilder(profile);
    }
    return makeQueryBuilder(null);
  });
};

/**
 * Set up supabase.auth.getSession() to return a specific session.
 */
const setupGetSession = (session: unknown = null) => {
  mockGetSession.mockResolvedValue({ data: { session } });
};

/**
 * Set up supabase.auth.onAuthStateChange() and capture the callback.
 */
const setupOnAuthStateChange = () => {
  mockUnsubscribe = vi.fn();
  capturedAuthCallback = null;
  mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
    capturedAuthCallback = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });
};

/** Render the hook wrapped in AuthProvider */
const renderAuthHook = () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthProvider, null, children);
  return renderHook(() => useAuth(), { wrapper });
};

// ============================================================
// Tests
// ============================================================

describe('useAuth', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    vi.useFakeTimers();

    setupOnAuthStateChange();
    setupGetSession(null);
    setupFromMock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ----------------------------------------------------------
  // Context guard
  // ----------------------------------------------------------

  describe('useAuth outside AuthProvider', () => {
    it('throws when used outside AuthProvider', () => {
      // Suppress expected React error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider',
      );
      consoleSpy.mockRestore();
    });
  });

  // ----------------------------------------------------------
  // Initial state
  // ----------------------------------------------------------

  describe('initial state', () => {
    it('returns null user, session, username, and empty roles when no session exists', async () => {
      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.roles).toEqual([]);
      expect(result.current.username).toBeNull();
    });

    it('transitions loading to false when there is no session', async () => {
      setupGetSession(null);

      const { result } = renderAuthHook();

      // loading starts true while getSession is pending
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.loading).toBe(false);
    });

    it('unsubscribes from auth state change on unmount', async () => {
      const { unmount } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------
  // Session restoration
  // ----------------------------------------------------------

  describe('session restoration from getSession', () => {
    it('restores user, session, and roles when existing session is found', async () => {
      const session = makeSession('user-42');
      setupGetSession(session);
      setupFromMock([{ role: 'admin', instance_id: 'inst-1', hall_id: null }]);

      const { result } = renderAuthHook();

      // onAuthStateChange fires INITIAL_SESSION — this is the sole trigger for role fetching
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.user?.id).toBe('user-42');
      expect(result.current.session).toEqual(session);
      expect(result.current.roles).toEqual([
        { role: 'admin', instance_id: 'inst-1', hall_id: null },
      ]);
    });

    it('sets username from profile when restored session has profile', async () => {
      const session = makeSession('user-99');
      setupGetSession(session);
      setupFromMock([], { username: 'johndoe' });

      const { result } = renderAuthHook();

      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.username).toBe('johndoe');
    });

    it('keeps username null when profile has no username', async () => {
      const session = makeSession('user-99');
      setupGetSession(session);
      setupFromMock([], null);

      const { result } = renderAuthHook();

      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.username).toBeNull();
    });

    it('sets loading to false after session restoration with roles', async () => {
      const session = makeSession('user-42');
      setupGetSession(session);
      setupFromMock([{ role: 'user', instance_id: null, hall_id: null }]);

      const { result } = renderAuthHook();

      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.loading).toBe(false);
    });

    it('loading is true while roles are being fetched after auth callback fires', async () => {
      const session = makeSession('user-42');
      setupGetSession(session);

      let resolveRoles!: (value: unknown) => void;
      const rolesPromise = new Promise((resolve) => {
        resolveRoles = resolve;
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          const builder: Record<string, unknown> = {};
          const methods = [
            'select',
            'insert',
            'update',
            'delete',
            'eq',
            'neq',
            'order',
            'limit',
            'range',
            'filter',
            'is',
            'in',
            'or',
            'not',
          ];
          methods.forEach((m) => {
            builder[m] = vi.fn().mockReturnValue(builder);
          });
          builder['maybeSingle'] = vi.fn().mockResolvedValue({ data: null, error: null });
          builder['single'] = vi.fn().mockResolvedValue({ data: null, error: null });
          builder['then'] = (resolve: (v: unknown) => void) => {
            rolesPromise.then(resolve);
          };
          return builder;
        }
        return makeQueryBuilder(null);
      });

      const { result } = renderAuthHook();

      // Fire INITIAL_SESSION — this sets rolesLoading=true and schedules fetchUserRoles via setTimeout
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        // Run setTimeout(0) so fetchUserRoles is called, but roles promise is still pending
        await vi.runAllTimersAsync();
        // Flush microtasks so getSession resolves (sets sessionLoading=false)
        // but rolesPromise is still unresolved
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(true);

      // Now let roles resolve
      await act(async () => {
        resolveRoles({ data: [], error: null });
        await vi.runAllTimersAsync();
      });

      expect(result.current.loading).toBe(false);
    });

    it('calls setSentryUser when roles are fetched', async () => {
      const session = makeSession('user-42');
      setupGetSession(session);
      setupFromMock([{ role: 'admin', instance_id: 'inst-1', hall_id: null }]);

      renderAuthHook();

      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(mockSetSentryUser).toHaveBeenCalledWith({
        id: 'user-42',
        role: 'admin',
      });
    });

    it('handles getSession error gracefully and sets loading to false', async () => {
      mockGetSession.mockRejectedValue(new Error('network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      consoleSpy.mockRestore();

      expect(result.current.loading).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Auth state changes (onAuthStateChange)
  // ----------------------------------------------------------

  describe('auth state changes', () => {
    it('updates user and session when SIGNED_IN event fires', async () => {
      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const session = makeSession('user-signed-in');

      await act(async () => {
        capturedAuthCallback?.('SIGNED_IN', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.user?.id).toBe('user-signed-in');
      expect(result.current.session).toEqual(session);
    });

    it('fetches roles on SIGNED_IN event', async () => {
      setupFromMock([{ role: 'employee', instance_id: 'inst-2', hall_id: null }]);

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const session = makeSession('user-emp');
      await act(async () => {
        capturedAuthCallback?.('SIGNED_IN', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.roles).toEqual([
        { role: 'employee', instance_id: 'inst-2', hall_id: null },
      ]);
    });

    it('clears user, session, roles and username on SIGNED_OUT event', async () => {
      // First, establish a logged-in state via INITIAL_SESSION
      const session = makeSession('user-1');
      setupGetSession(session);
      setupFromMock([{ role: 'admin', instance_id: null, hall_id: null }]);

      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.user).not.toBeNull();

      // Now fire signed-out
      await act(async () => {
        capturedAuthCallback?.('SIGNED_OUT', null);
        await vi.runAllTimersAsync();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.roles).toEqual([]);
      expect(result.current.username).toBeNull();
    });

    it('calls clearSentryUser on SIGNED_OUT event', async () => {
      const { result: _ } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        capturedAuthCallback?.('SIGNED_OUT', null);
        await vi.runAllTimersAsync();
      });

      expect(mockClearSentryUser).toHaveBeenCalled();
    });

    it('does not refetch roles on TOKEN_REFRESHED for the same user', async () => {
      // previousUserIdRef is only set by the onAuthStateChange path (not getSession).
      // To test dedup, we must first fire a SIGNED_IN event so the ref is populated,
      // then fire TOKEN_REFRESHED with the same user id.
      setupGetSession(null); // no existing session
      setupFromMock([{ role: 'admin', instance_id: null, hall_id: null }]);

      renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Step 1: SIGNED_IN fires — this sets previousUserIdRef to 'user-same'
      const session = makeSession('user-same');
      await act(async () => {
        capturedAuthCallback?.('SIGNED_IN', session);
        await vi.runAllTimersAsync();
      });

      const callCountAfterSignIn = mockFrom.mock.calls.length;

      // Step 2: TOKEN_REFRESHED fires with the same user — should NOT refetch
      await act(async () => {
        capturedAuthCallback?.('TOKEN_REFRESHED', session);
        await vi.runAllTimersAsync();
      });

      // from() should NOT have been called again for user_roles / profiles
      expect(mockFrom.mock.calls.length).toBe(callCountAfterSignIn);
    });

    it('does refetch roles when a different user signs in', async () => {
      const session1 = makeSession('user-A');
      setupGetSession(session1);
      setupFromMock([{ role: 'admin', instance_id: null, hall_id: null }]);

      renderAuthHook();
      // Fire INITIAL_SESSION for user-A to establish first user's roles
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session1);
        await vi.runAllTimersAsync();
      });

      const callCountAfterFirst = mockFrom.mock.calls.length;

      const session2 = makeSession('user-B');
      await act(async () => {
        capturedAuthCallback?.('SIGNED_IN', session2);
        await vi.runAllTimersAsync();
      });

      expect(mockFrom.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
    });
  });

  // ----------------------------------------------------------
  // hasRole
  // ----------------------------------------------------------

  describe('hasRole', () => {
    const renderWithRoles = async (
      roleList: { role: string; instance_id: string | null; hall_id: string | null }[],
    ) => {
      const session = makeSession('user-roles-test');
      setupGetSession(session);
      setupFromMock(roleList);

      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });
      return result;
    };

    it('returns true when user has the queried role', async () => {
      const result = await renderWithRoles([{ role: 'admin', instance_id: null, hall_id: null }]);
      expect(result.current.hasRole('admin')).toBe(true);
    });

    it('returns false when user does not have the queried role', async () => {
      const result = await renderWithRoles([
        { role: 'employee', instance_id: null, hall_id: null },
      ]);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('returns false when roles array is empty', async () => {
      const result = await renderWithRoles([]);
      expect(result.current.hasRole('super_admin')).toBe(false);
    });

    it('finds role among multiple roles', async () => {
      const result = await renderWithRoles([
        { role: 'employee', instance_id: 'inst-1', hall_id: null },
        { role: 'admin', instance_id: 'inst-2', hall_id: null },
      ]);
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('employee')).toBe(true);
      expect(result.current.hasRole('super_admin')).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // hasInstanceRole
  // ----------------------------------------------------------

  describe('hasInstanceRole', () => {
    const renderWithRoles = async (
      roleList: { role: string; instance_id: string | null; hall_id: string | null }[],
    ) => {
      const session = makeSession('user-inst-test');
      setupGetSession(session);
      setupFromMock(roleList);

      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });
      return result;
    };

    it('returns true when role matches and instance_id matches', async () => {
      const result = await renderWithRoles([
        { role: 'admin', instance_id: 'inst-abc', hall_id: null },
      ]);
      expect(result.current.hasInstanceRole('admin', 'inst-abc')).toBe(true);
    });

    it('returns false when role matches but instance_id does not match', async () => {
      const result = await renderWithRoles([
        { role: 'admin', instance_id: 'inst-abc', hall_id: null },
      ]);
      expect(result.current.hasInstanceRole('admin', 'inst-xyz')).toBe(false);
    });

    it('returns true when role matches and instance_id is null (global role)', async () => {
      const result = await renderWithRoles([{ role: 'admin', instance_id: null, hall_id: null }]);
      // null instance_id means the role applies to all instances
      expect(result.current.hasInstanceRole('admin', 'inst-any')).toBe(true);
    });

    it('returns false when role does not match even with correct instance_id', async () => {
      const result = await renderWithRoles([
        { role: 'employee', instance_id: 'inst-abc', hall_id: null },
      ]);
      expect(result.current.hasInstanceRole('admin', 'inst-abc')).toBe(false);
    });

    it('returns false when roles array is empty', async () => {
      const result = await renderWithRoles([]);
      expect(result.current.hasInstanceRole('admin', 'inst-abc')).toBe(false);
    });

    it('finds matching instance role among multiple roles', async () => {
      const result = await renderWithRoles([
        { role: 'employee', instance_id: 'inst-1', hall_id: null },
        { role: 'admin', instance_id: 'inst-2', hall_id: null },
      ]);
      expect(result.current.hasInstanceRole('admin', 'inst-2')).toBe(true);
      expect(result.current.hasInstanceRole('admin', 'inst-1')).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // signIn
  // ----------------------------------------------------------

  describe('signIn', () => {
    it('wraps supabase error in Error object on failed sign in', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      let returnValue: { error: Error | null } | undefined;
      await act(async () => {
        returnValue = await result.current.signIn('user@example.com', 'wrongpass');
      });

      expect(returnValue?.error).toBeInstanceOf(Error);
      expect(returnValue?.error?.message).toBe('Invalid login credentials');
    });
  });

  // ----------------------------------------------------------
  // signUp
  // ----------------------------------------------------------

  describe('signUp', () => {
    it('calls supabase.auth.signUp with email, password and options', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.signUp('new@example.com', 'newpass', 'John Doe');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'newpass',
          options: expect.objectContaining({
            data: expect.objectContaining({ full_name: 'John Doe' }),
          }),
        }),
      );
    });

    it('uses email as full_name fallback when fullName is not provided', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.signUp('new@example.com', 'newpass');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { full_name: 'new@example.com' },
          }),
        }),
      );
    });

    it('wraps supabase error in Error object on failed sign up', async () => {
      mockSignUp.mockResolvedValue({ error: { message: 'Email already in use' } });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      let returnValue: { error: Error | null } | undefined;
      await act(async () => {
        returnValue = await result.current.signUp('existing@example.com', 'pass');
      });

      expect(returnValue?.error).toBeInstanceOf(Error);
      expect(returnValue?.error?.message).toBe('Email already in use');
    });

    it('includes emailRedirectTo in options', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.signUp('new@example.com', 'pass');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining('/'),
          }),
        }),
      );
    });
  });

  // ----------------------------------------------------------
  // signOut
  // ----------------------------------------------------------

  describe('signOut', () => {
    it('clears user, session, roles and username immediately on signOut', async () => {
      const session = makeSession('user-signout');
      setupGetSession(session);
      setupFromMock([{ role: 'admin', instance_id: null, hall_id: null }]);
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.user).not.toBeNull();

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.roles).toEqual([]);
      expect(result.current.username).toBeNull();
    });

    it('calls clearSentryUser on signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockClearSentryUser).toHaveBeenCalled();
    });

    it('calls forceClearAuthStorage (via localStorage) when signOut fails', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Signout failed' } });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        replace: vi.fn(),
      } as unknown as Location);

      // Seed localStorage with auth-related keys
      localStorage.setItem('sb-project-auth-token', 'some-token');
      localStorage.setItem('sb-project-auth-token-code-verifier', 'verifier');
      localStorage.setItem('other-key', 'should-remain');

      const { result } = renderAuthHook();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.signOut();
      });

      // Supabase auth keys should have been cleared
      expect(localStorage.getItem('sb-project-auth-token')).toBeNull();
      expect(localStorage.getItem('sb-project-auth-token-code-verifier')).toBeNull();
      // Non-auth key should remain
      expect(localStorage.getItem('other-key')).toBe('should-remain');

      consoleSpy.mockRestore();
      locationSpy.mockRestore();
      localStorage.clear();
    });
  });

  // ----------------------------------------------------------
  // Role errors (fetchUserRoles failure)
  // ----------------------------------------------------------

  describe('fetchUserRoles error handling', () => {
    it('keeps empty roles and sets loading to false when user_roles query fails', async () => {
      const session = makeSession('user-err');
      setupGetSession(session);

      // Override user_roles to return an error
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return makeQueryBuilder(null, { message: 'permission denied' });
        }
        if (table === 'profiles') {
          return makeQueryBuilder(null);
        }
        return makeQueryBuilder(null);
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });
      consoleSpy.mockRestore();

      expect(result.current.roles).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Multiple roles
  // ----------------------------------------------------------

  describe('multiple roles from DB', () => {
    it('stores all roles returned by user_roles query', async () => {
      const session = makeSession('user-multi');
      setupGetSession(session);
      setupFromMock([
        { role: 'admin', instance_id: 'inst-1', hall_id: null },
        { role: 'employee', instance_id: 'inst-2', hall_id: null },
        { role: 'hall', instance_id: 'inst-1', hall_id: 'hall-5' },
      ]);

      const { result } = renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(result.current.roles).toHaveLength(3);
      expect(result.current.roles[0].role).toBe('admin');
      expect(result.current.roles[1].role).toBe('employee');
      expect(result.current.roles[2].role).toBe('hall');
    });

    it('setSentryUser uses the first role as primary role', async () => {
      const session = makeSession('user-primary');
      setupGetSession(session);
      setupFromMock([
        { role: 'admin', instance_id: null, hall_id: null },
        { role: 'employee', instance_id: 'inst-1', hall_id: null },
      ]);

      renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(mockSetSentryUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    it('setSentryUser uses undefined as role when there are no roles', async () => {
      const session = makeSession('user-noroles');
      setupGetSession(session);
      setupFromMock([]);

      renderAuthHook();
      await act(async () => {
        capturedAuthCallback?.('INITIAL_SESSION', session);
        await vi.runAllTimersAsync();
      });

      expect(mockSetSentryUser).toHaveBeenCalledWith(expect.objectContaining({ role: undefined }));
    });
  });
});

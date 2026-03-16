import { vi } from 'vitest';

type MockResponse = {
  data: unknown;
  error: { message: string } | null;
};

const queryMocks: Record<string, MockResponse> = {};
const authMocks: Record<string, MockResponse> = {};
const rpcMocks: Record<string, MockResponse> = {};

export const mockSupabaseQuery = (
  table: string,
  response: MockResponse,
  method: 'select' | 'insert' | 'update' | 'delete' = 'select',
) => {
  queryMocks[`${table}:${method}`] = response;
};

export const mockSupabaseRpc = (functionName: string, response: MockResponse) => {
  rpcMocks[functionName] = response;
};

export const mockSupabaseAuth = (
  method: 'signIn' | 'signOut' | 'getSession' | 'getUser',
  response: MockResponse,
) => {
  authMocks[method] = response;
};

export const resetSupabaseMocks = () => {
  Object.keys(queryMocks).forEach((key) => delete queryMocks[key]);
  Object.keys(authMocks).forEach((key) => delete authMocks[key]);
  Object.keys(rpcMocks).forEach((key) => delete rpcMocks[key]);

  queryMocks['instances:select'] = {
    data: {
      id: 'test-instance-id',
      name: 'Test Instance',
      short_name: 'TEST',
    },
    error: null,
  };

  queryMocks['calendar_items:select'] = {
    data: [],
    error: null,
  };

  queryMocks['calendar_items:insert'] = {
    data: { id: 'new-item-id' },
    error: null,
  };

  queryMocks['calendar_items:update'] = {
    data: { id: 'updated-item-id' },
    error: null,
  };

  queryMocks['calendar_items:delete'] = {
    data: null,
    error: null,
  };

  queryMocks['calendar_item_services:select'] = {
    data: [],
    error: null,
  };

  queryMocks['calendar_item_services:insert'] = {
    data: null,
    error: null,
  };

  queryMocks['calendar_item_services:delete'] = {
    data: null,
    error: null,
  };

  queryMocks['customers:select'] = {
    data: [],
    error: null,
  };

  queryMocks['unified_services:select'] = {
    data: [],
    error: null,
  };

  queryMocks['projects:select'] = {
    data: [],
    error: null,
  };

  queryMocks['customer_sms_notifications:select'] = {
    data: [],
    error: null,
  };

  queryMocks['employees:select'] = {
    data: [],
    error: null,
  };

  queryMocks['instance_features:select'] = {
    data: [],
    error: null,
  };

  authMocks['getUser'] = {
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null,
  };

  authMocks['getSession'] = {
    data: { session: null },
    error: null,
  };
};

const createQueryBuilder = (table: string) => {
  let currentMethod = 'select';

  const builder = {
    select: vi.fn().mockImplementation(() => {
      // Only set to 'select' if no mutation method was called first
      // (e.g. insert().select() should keep 'insert')
      if (currentMethod === 'select') {
        currentMethod = 'select';
      }
      return builder;
    }),
    insert: vi.fn().mockImplementation((data: unknown) => {
      currentMethod = 'insert';
      return builder;
    }),
    update: vi.fn().mockImplementation(() => {
      currentMethod = 'update';
      return builder;
    }),
    delete: vi.fn().mockImplementation(() => {
      currentMethod = 'delete';
      return builder;
    }),
    upsert: vi.fn().mockImplementation(() => {
      currentMethod = 'insert';
      return builder;
    }),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      const key = `${table}:${currentMethod}`;
      return Promise.resolve(queryMocks[key] || { data: null, error: null });
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      const key = `${table}:${currentMethod}`;
      return Promise.resolve(queryMocks[key] || { data: null, error: null });
    }),
    then: (resolve: (value: MockResponse) => void) => {
      const key = `${table}:${currentMethod}`;
      resolve(queryMocks[key] || { data: [], error: null });
    },
  };

  return builder;
};

export const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => createQueryBuilder(table)),
  rpc: vi.fn().mockImplementation((functionName: string) => {
    return Promise.resolve(rpcMocks[functionName] || { data: null, error: null });
  }),
  auth: {
    signInWithPassword: vi.fn().mockImplementation(async () => {
      return authMocks['signIn'] || { data: { user: null }, error: null };
    }),
    signOut: vi.fn().mockImplementation(async () => {
      return authMocks['signOut'] || { error: null };
    }),
    getSession: vi.fn().mockImplementation(async () => {
      return authMocks['getSession'] || { data: { session: null }, error: null };
    }),
    getUser: vi.fn().mockImplementation(async () => {
      return authMocks['getUser'] || { data: { user: null }, error: null };
    }),
    onAuthStateChange: vi.fn().mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({ data: { publicUrl: 'https://example.com/file.jpg' } }),
    }),
  },
};

export default mockSupabase;

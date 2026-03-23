export interface AiAnalystSuggestion {
  label: string;
  prompt: string;
}

export interface AiAnalystRequest {
  prompt: string;
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
}

export interface AiAnalystResponse {
  answer: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface AiAnalystHistoryEntry {
  id: string;
  prompt: string;
  response: AiAnalystResponse | null;
  loading: boolean;
  error?: string;
}

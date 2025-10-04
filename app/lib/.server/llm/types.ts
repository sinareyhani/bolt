export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type Messages = Message[];

export interface StreamingOptions {
  toolChoice?: string;
  onFinish?: (result: { text: string; finishReason: string }) => Promise<void>;
}

export interface PuterResponse {
  result?: {
    message?: {
      content?: string;
    };
  };
}
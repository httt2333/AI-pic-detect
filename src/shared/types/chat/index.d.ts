export interface ChatModel {
  name: string; // model name, e.g. "moonshotai/kimi-k2-thinking"
  title: string; // model title, e.g. "Kimi K2 Thinking"
  provider?: string; // model provider, e.g. "openrouter"
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  model: string;
  provider: string;
  parts: any;
  metadata: any;
  content: any;
}

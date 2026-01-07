// Types for GitHub Copilot CLI JSONL events

export interface CopilotEvent {
  type: string;
  data: Record<string, unknown>;
  id: string;
  timestamp: string;
  parentId: string | null;
  _rawLine?: string;
  _parsedDate?: Date;
  _index?: number;
}

export interface SessionStartData {
  sessionId: string;
  version: number;
  producer: string;
  copilotVersion: string;
  startTime: string;
}

export interface SessionInfoData {
  infoType: string;
  message: string;
}

export interface UserMessageData {
  content: string;
  attachments?: unknown[];
}

export interface AssistantMessageData {
  messageId: string;
  content: string;
  toolRequests?: ToolRequest[];
}

export interface ToolRequest {
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolExecutionData {
  toolCallId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  success?: boolean;
  result?: {
    content: string;
  };
}

export interface TurnData {
  turnId: string;
}

export interface TruncationData {
  tokenLimit: number;
  preTruncationTokensInMessages: number;
  preTruncationMessagesLength: number;
  postTruncationTokensInMessages: number;
  postTruncationMessagesLength: number;
  tokensRemovedDuringTruncation: number;
  messagesRemovedDuringTruncation: number;
  performedBy: string;
}

export type EventType = 
  | 'session.start'
  | 'session.info'
  | 'session.truncation'
  | 'session.end'
  | 'user.message'
  | 'assistant.message'
  | 'assistant.turn_start'
  | 'assistant.turn_end'
  | 'tool.execution_start'
  | 'tool.execution_complete';

export interface FilterState {
  query: string;
  type: string;
  hideToolDetails: boolean;
}

export interface TimelineState {
  events: CopilotEvent[];
  filtered: CopilotEvent[];
  selectedId: string | null;
  tzMode: 'local' | 'utc';
  filters: FilterState;
}

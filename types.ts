export enum SourceType {
  EMAIL = 'EMAIL',
  MEETING_TRANSCRIPT = 'MEETING_TRANSCRIPT',
  SLACK_THREAD = 'SLACK_THREAD',
  DOCUMENT = 'DOCUMENT',
  TEXT_NOTE = 'TEXT_NOTE'
}

export interface DataSource {
  id: string;
  type: SourceType;
  title: string;
  content: string;
  date: string;
  author?: string;
}

export interface BRDSection {
  id: string;
  title: string;
  content: string; // Markdown supported
}

export interface BRDData {
  title: string;
  sections: BRDSection[];
  conflicts: string[];
  pendingChanges?: boolean;
}

export interface Project {
  id: string;
  name: string;
  status: 'draft' | 'generated' | 'review';
  sources: DataSource[];
  brd: BRDData | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

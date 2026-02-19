
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  journal?: string;
  citations: number;
  url: string;
  tags: string[];
  addedAt: string;
  thumbnail?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  paperIds: string[];
  createdAt: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'update' | 'paper';
  read: boolean;
  time: string;
}

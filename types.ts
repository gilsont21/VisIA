export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
  file?: {
    url: string;
    type: string;
    name: string;
  }
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  content: string; // base64 encoded
  size: number;
  lastModified: number;
}

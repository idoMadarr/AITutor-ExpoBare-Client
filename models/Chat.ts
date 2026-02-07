export enum RoleType {
  USER = 'user',
  AGENT = 'system',
}

export interface MessageType {
  // id: number;
  content: string;
  role: string;
}

export type ChatType = MessageType[];

export class ChatMessage {
  // id;
  content;
  role;

  constructor(content: string, role: string) {
    // this.id = Math.floor(Math.random() * 1000);
    this.content = content;
    this.role = role;
  }
}

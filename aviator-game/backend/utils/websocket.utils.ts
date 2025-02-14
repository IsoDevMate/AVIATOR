interface WSMessage {
  type: string;
  data?: any;
}

export function parseMessage(data: string): WSMessage {
  try {
    return JSON.parse(data);
  } catch {
    throw new Error('Invalid message format');
  }
}

export function createMessage(type: string, data?: any): string {
  return JSON.stringify({ type, data });
}

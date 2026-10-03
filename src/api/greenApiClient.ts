import type { NotificationEnvelope } from '../domain/notifications';

export interface ConnectionCredentials {
  idInstance: string;
  apiTokenInstance: string;
}

const API_BASE_URL = 'https://api.green-api.com';

export function createGreenApiClient(credentials: ConnectionCredentials) {
  const endpoint = (operation: string) =>
    `${API_BASE_URL}/waInstance${credentials.idInstance}/${operation}/${credentials.apiTokenInstance}`;

  async function request(operation: string, options: RequestInit, receiptId?: number): Promise<Response> {
    let response: Response;
    try {
      const url = receiptId === undefined ? endpoint(operation) : `${endpoint(operation)}/${receiptId}`;
      response = await fetch(url, options);
    } catch {
      throw new Error(`${operation} failed (network error)`);
    }

    if (!response.ok) {
      throw new Error(`${operation} failed (HTTP ${response.status})`);
    }

    return response;
  }

  async function readJson(operation: string, response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      return text.trim() ? JSON.parse(text) : null;
    } catch {
      throw new Error(`${operation} failed (invalid response)`);
    }
  }

  return {
    async checkAccount(phoneNumber: string): Promise<string | null> {
      const response = await request('checkAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
      });
      const result = await readJson('checkAccount', response);
      if (
        typeof result === 'object' && result !== null &&
        'exist' in result &&
        'chatId' in result && typeof result.chatId === 'string'
      ) {
        if (result.exist === false) return null;
        if (result.exist === true && result.chatId) return result.chatId;
      }
      throw new Error('checkAccount failed (invalid response)');
    },

    async sendText(chatId: string, text: string): Promise<void> {
      await request('sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: text }),
      });
    },

    async receiveNotification(): Promise<NotificationEnvelope | null> {
      const response = await request('receiveNotification', { method: 'GET' });
      return await readJson('receiveNotification', response) as NotificationEnvelope | null;
    },

    async deleteNotification(receiptId: number): Promise<void> {
      await request('deleteNotification', { method: 'DELETE' }, receiptId);
    },
  };
}

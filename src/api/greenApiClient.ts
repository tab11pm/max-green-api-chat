import type { NotificationEnvelope } from '../domain/notifications';

export interface ConnectionCredentials {
  idInstance: string;
  apiTokenInstance: string;
}

function getApiBasePath(): string {
  return import.meta.env.VITE_GREEN_API_URL?.replace(/\/$/, '') || '/green-api';
}

export function createGreenApiClient(credentials: ConnectionCredentials) {
  const apiBasePath = getApiBasePath();
  const endpoint = (operation: string) =>
    `${apiBasePath}/waInstance${credentials.idInstance}/${operation}/${credentials.apiTokenInstance}`;

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
    async checkWhatsapp(phoneNumber: string): Promise<string | null> {
      const response = await request('checkWhatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
      });
      const result = await readJson('checkWhatsapp', response);
      if (
        typeof result === 'object' && result !== null &&
        'existsWhatsapp' in result &&
        'chatId' in result && typeof result.chatId === 'string'
      ) {
        if (result.existsWhatsapp === false) return null;
        if (result.existsWhatsapp === true && result.chatId) return result.chatId;
      }
      throw new Error('checkWhatsapp failed (invalid response)');
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
      const response = await request('deleteNotification', { method: 'DELETE' }, receiptId);
      const result = await readJson('deleteNotification', response);
      if (typeof result === 'object' && result !== null && 'result' in result) {
        if (result.result === true) return;
        if (result.result === false) {
          throw new Error('deleteNotification failed (not acknowledged)');
        }
      }
      throw new Error('deleteNotification failed (invalid response)');
    },
  };
}

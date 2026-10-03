import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGreenApiClient } from './greenApiClient';

const credentials = {
  idInstance: 'instance-placeholder',
  apiTokenInstance: 'token-placeholder',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createGreenApiClient', () => {
  it('sends text to the documented endpoint with the chat ID and message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await createGreenApiClient(credentials).sendText('recipient-chat-id', 'Привет');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstanceinstance-placeholder/sendMessage/token-placeholder',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: 'recipient-chat-id', message: 'Привет' }),
      },
    );
  });

  it('checks an international number as numeric JSON and returns its MAX chat ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ exist: true, chatId: '10000000', fromCache: true }),
      { status: 200 },
    ));
    vi.stubGlobal('fetch', fetchMock);

    const chatId = await createGreenApiClient(credentials).checkAccount('79991234567');

    expect(chatId).toBe('10000000');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstanceinstance-placeholder/checkAccount/token-placeholder',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: 79991234567 }),
      },
    );
  });

  it('returns null when the checked number has no MAX account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ exist: false, chatId: '', fromCache: false }),
      { status: 200 },
    )));

    await expect(createGreenApiClient(credentials).checkAccount('79991234567'))
      .resolves.toBeNull();
  });

  it('rejects an account response that reports an instance problem', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status: false, reason: 'instance is starting or not authorized' }),
      { status: 200 },
    )));

    await expect(createGreenApiClient(credentials).checkAccount('79991234567'))
      .rejects.toThrow(/^checkAccount failed \(invalid response\)$/);
  });

  it('returns a received notification from the GET endpoint', async () => {
    const notification = { receiptId: 42, body: { typeWebhook: 'incomingMessageReceived' } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(notification), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createGreenApiClient(credentials).receiveNotification())
      .resolves.toEqual(notification);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstanceinstance-placeholder/receiveNotification/token-placeholder',
      { method: 'GET' },
    );
  });

  it('returns null when no notification is available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })));

    await expect(createGreenApiClient(credentials).receiveNotification())
      .resolves.toBeNull();
  });

  it('returns null for an empty notification response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    await expect(createGreenApiClient(credentials).receiveNotification())
      .resolves.toBeNull();
  });

  it('deletes a notification by receipt ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ result: true, reason: '' }),
      { status: 200 },
    ));
    vi.stubGlobal('fetch', fetchMock);

    await createGreenApiClient(credentials).deleteNotification(42);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstanceinstance-placeholder/deleteNotification/token-placeholder/42',
      { method: 'DELETE' },
    );
  });

  it('rejects an unsuccessful delete without exposing the server reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ result: false, reason: 'token-placeholder in reason' }),
      { status: 200 },
    )));

    await expect(createGreenApiClient(credentials).deleteNotification(42))
      .rejects.toThrow(/^deleteNotification failed \(not acknowledged\)$/);
  });

  it('rejects an unexpected delete response safely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })));

    await expect(createGreenApiClient(credentials).deleteNotification(42))
      .rejects.toThrow(/^deleteNotification failed \(invalid response\)$/);
  });

  it('reports only the operation and HTTP status on a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      'token-placeholder appears in a server error',
      { status: 403, statusText: 'token-placeholder' },
    )));

    await expect(createGreenApiClient(credentials).checkAccount('79991234567'))
      .rejects.toThrow(/^checkAccount failed \(HTTP 403\)$/);
  });
});

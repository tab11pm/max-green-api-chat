import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GreenApiClient } from './useNotifications';
import { useNotifications } from './useNotifications';
import type { NotificationEnvelope } from '../domain/notifications';

const chatId = '79991234567@c.us';

function textNotification(receiptId: number, senderChatId: string) {
  return {
    receiptId,
    body: {
      typeWebhook: 'incomingMessageReceived',
      senderData: { chatId: senderChatId },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: 'Привет' },
      },
      timestamp: 1_791_000_000,
    },
  };
}

function mockClient() {
  return {
    checkWhatsapp: vi.fn(),
    sendText: vi.fn(),
    receiveNotification: vi.fn(),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
  };
}

describe('useNotifications', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits only matching text and acknowledges every received notification', async () => {
    const client = mockClient();
    client.receiveNotification
      .mockResolvedValueOnce(textNotification(41, chatId))
      .mockResolvedValueOnce(textNotification(42, '375291234567@c.us'))
      .mockResolvedValueOnce({
        ...textNotification(43, chatId),
        body: {
          ...textNotification(43, chatId).body,
          messageData: { typeMessage: 'imageMessage' },
        },
      });
    const onMessage = vi.fn();

    renderHook(() => useNotifications({ client: client as GreenApiClient, chatId, onMessage }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });

    expect(onMessage).toHaveBeenCalledExactlyOnceWith({
      direction: 'incoming',
      text: 'Привет',
      timestamp: 1_791_000_000,
    });
    expect(client.deleteNotification.mock.calls).toEqual([[41], [42], [43]]);
  });

  it('does not emit a response that arrives after unmount, but acknowledges it', async () => {
    const client = mockClient();
    let resolveReceive!: (value: NotificationEnvelope) => void;
    client.receiveNotification.mockImplementationOnce(() => new Promise<NotificationEnvelope>((resolve) => {
      resolveReceive = resolve;
    }));
    const onMessage = vi.fn();
    const { unmount } = renderHook(() =>
      useNotifications({ client: client as GreenApiClient, chatId, onMessage }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    unmount();
    await act(async () => {
      resolveReceive(textNotification(43, chatId));
      await Promise.resolve();
    });

    expect(onMessage).not.toHaveBeenCalled();
    expect(client.deleteNotification).toHaveBeenCalledExactlyOnceWith(43);
  });

  it('stops receiving when the chat closes', async () => {
    const client = mockClient();
    client.receiveNotification.mockResolvedValue(null);
    const { rerender } = renderHook(
      ({ activeChatId }) => useNotifications({
        client: client as GreenApiClient,
        chatId: activeChatId,
        onMessage: vi.fn(),
      }),
      { initialProps: { activeChatId: chatId as string | null } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    rerender({ activeChatId: null });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });

    expect(client.receiveNotification).toHaveBeenCalledTimes(1);
  });

  it('clears its timer on unmount', async () => {
    const client = mockClient();
    client.receiveNotification.mockResolvedValue(null);
    const { unmount } = renderHook(() =>
      useNotifications({ client: client as GreenApiClient, chatId, onMessage: vi.fn() }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });

    expect(client.receiveNotification).toHaveBeenCalledTimes(1);
  });

  it('does not start another receive while a request is pending', async () => {
    const client = mockClient();
    client.receiveNotification.mockImplementation(() => new Promise(() => {}));
    renderHook(() =>
      useNotifications({ client: client as GreenApiClient, chatId, onMessage: vi.fn() }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(client.receiveNotification).toHaveBeenCalledTimes(1);
  });

  it('reports an issue after a failed poll and returns online after recovery', async () => {
    const client = mockClient();
    client.receiveNotification.mockRejectedValueOnce(new Error('network')).mockResolvedValue(null);
    const { result } = renderHook(() =>
      useNotifications({ client: client as GreenApiClient, chatId, onMessage: vi.fn() }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.status).toBe('issue');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.status).toBe('online');
  });
});

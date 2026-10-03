import { useEffect, useRef, useState } from 'react';
import { createGreenApiClient } from '../api/greenApiClient';
import { parseIncomingText, type IncomingMessage } from '../domain/notifications';

export type GreenApiClient = ReturnType<typeof createGreenApiClient>;

interface UseNotificationsOptions {
  client: GreenApiClient | null;
  chatId: string | null;
  phone?: string | null;
  onMessage: (message: IncomingMessage) => void;
}

export function useNotifications({ client, chatId, phone, onMessage }: UseNotificationsOptions): {
  status: 'checking' | 'online' | 'issue';
} {
  const [status, setStatus] = useState<'checking' | 'online' | 'issue'>('checking');
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!client || !chatId) return;
    let active = true;
    let inFlight = false;

    const timer = setInterval(async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const notification = await client.receiveNotification();
        if (notification) {
          try {
            const message = parseIncomingText(notification, chatId, phone ?? undefined);
            if (active && message) onMessageRef.current(message);
          } finally {
            await client.deleteNotification(notification.receiptId);
          }
        }
        if (active) setStatus('online');
      } catch {
        if (active) setStatus('issue');
      } finally {
        inFlight = false;
      }
    }, 2_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [client, chatId, phone]);

  return { status };
}

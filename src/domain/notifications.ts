export interface IncomingMessage {
  direction: 'incoming';
  text: string;
  timestamp: number;
}

export interface NotificationEnvelope {
  receiptId: number;
  body: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseIncomingText(
  notification: unknown,
  activeChatId: string,
  activePhone?: string,
): IncomingMessage | null {
  const payload = isRecord(notification) && 'body' in notification
    ? notification.body
    : notification;

  if (!isRecord(payload)) return null;

  const senderData = payload.senderData;
  const messageData = payload.messageData;
  if (!isRecord(senderData)) return null;
  const senderChatId = senderData.chatId;
  const senderDigits = typeof senderChatId === 'string' ? senderChatId.replace(/\D/g, '') : '';
  const activeDigits = activePhone?.replace(/\D/g, '') ?? '';
  const belongsToActiveChat = senderChatId === activeChatId || (Boolean(activeDigits) && senderDigits === activeDigits);

  if (
    payload.typeWebhook !== 'incomingMessageReceived' ||
    !belongsToActiveChat ||
    !isRecord(messageData) ||
    messageData.typeMessage !== 'textMessage'
  ) {
    return null;
  }

  const textMessageData = messageData.textMessageData;
  const timestamp = payload.timestamp;
  if (
    !isRecord(textMessageData) ||
    typeof textMessageData.textMessage !== 'string' ||
    typeof timestamp !== 'number' ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  return {
    direction: 'incoming',
    text: textMessageData.textMessage,
    timestamp,
  };
}

import { describe, expect, it } from 'vitest';
import { parseIncomingText, type NotificationEnvelope } from './notifications';

const textNotification = {
  typeWebhook: 'incomingMessageReceived',
  senderData: { chatId: '79991234567@c.us' },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет' },
  },
  timestamp: 1_791_000_000,
};

describe('parseIncomingText', () => {
  it('maps a matching text event and leaves its receipt envelope intact', () => {
    const envelope: NotificationEnvelope = { receiptId: 42, body: textNotification };

    expect(parseIncomingText(envelope, '79991234567@c.us')).toEqual({
      direction: 'incoming',
      text: 'Привет',
      timestamp: 1_791_000_000,
    });
    expect(envelope.receiptId).toBe(42);
  });

  it('ignores notifications from another chat', () => {
    expect(parseIncomingText(textNotification, '375291234567@c.us')).toBeNull();
  });

  it('matches an incoming WhatsApp message by the recipient phone when chat IDs differ', () => {
    expect(parseIncomingText(textNotification, 'server-assigned-chat-id', '79991234567')).toEqual({
      direction: 'incoming',
      text: 'Привет',
      timestamp: 1_791_000_000,
    });
  });

  it('ignores non-text notifications', () => {
    expect(
      parseIncomingText(
        {
          ...textNotification,
          messageData: { typeMessage: 'imageMessage' },
        },
        '79991234567@c.us',
      ),
    ).toBeNull();
  });
});

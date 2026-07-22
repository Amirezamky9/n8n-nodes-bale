import { describe, it, expect } from 'vitest';
import { 
  buildInlineKeyboard, 
  buildReplyKeyboard, 
} from '../nodes/Bale/GenericFunctions';
import { getMimeType } from '../nodes/Bale/util/triggerUtils';
import { processUserResponse, buildWaitKeyboard } from '../nodes/Bale/hitl/sendAndWait';

describe('GenericFunctions', () => {
  describe('buildInlineKeyboard', () => {
    it('should return empty array for empty input', () => {
      expect(buildInlineKeyboard([])).toEqual([]);
    });

    it('should build URL buttons (each in own row)', () => {
      const buttons = [{ text: 'Click', type: 'url', url: 'https://example.com' }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Click', url: 'https://example.com' }]]);
    });

    it('should build callback data buttons', () => {
      const buttons = [{ text: 'OK', type: 'callback_data', callback_data: 'ok' }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([[{ text: 'OK', callback_data: 'ok' }]]);
    });

    it('should wrap each button in its own array (row)', () => {
      const buttons = [
        { text: 'Btn1', type: 'url', url: 'https://a.com' },
        { text: 'Btn2', type: 'callback_data', callback_data: 'b' },
      ];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([
        [{ text: 'Btn1', url: 'https://a.com' }],
        [{ text: 'Btn2', callback_data: 'b' }],
      ]);
    });

    it('should handle web_app buttons', () => {
      const buttons = [{ text: 'Open', type: 'web_app', web_app: { url: 'https://app.com' } }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Open', web_app: { url: 'https://app.com' } }]]);
    });

    it('should handle pay buttons', () => {
      const buttons = [{ text: 'Pay', type: 'pay', pay: true }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Pay', pay: true }]]);
    });
  });

  describe('buildReplyKeyboard', () => {
    it('should return empty array for empty input', () => {
      expect(buildReplyKeyboard([])).toEqual([]);
    });

    it('should build reply keyboard rows', () => {
      const buttons = [{ button: [{ text: 'Button 1' }, { text: 'Button 2' }] }];
      const result = buildReplyKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Button 1' }, { text: 'Button 2' }]]);
    });

    it('should handle request_contact flag', () => {
      const buttons = [{ button: [{ text: 'Share', request_contact: true }] }];
      const result = buildReplyKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Share', request_contact: true }]]);
    });

    it('should handle request_location flag', () => {
      const buttons = [{ button: [{ text: 'Location', request_location: true }] }];
      const result = buildReplyKeyboard(buttons);
      expect(result).toEqual([[{ text: 'Location', request_location: true }]]);
    });
  });
});

describe('getMimeType', () => {
  it('should return correct MIME types', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('video.mp4')).toBe('video/mp4');
    expect(getMimeType('doc.pdf')).toBe('application/pdf');
    expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('audio.ogg')).toBe('audio/ogg');
  });
});

describe('processUserResponse', () => {
  it('should return null for empty update', () => {
    expect(processUserResponse(null)).toBeNull();
    expect(processUserResponse(undefined)).toBeNull();
  });

  it('should extract text message', () => {
    const update = { message: { text: 'hello' } };
    const result = processUserResponse(update);
    expect(result).toEqual({ response: 'hello', value: 'hello' });
  });

  it('should extract callback query data', () => {
    const update = { callback_query: { data: 'button_press' } };
    const result = processUserResponse(update);
    expect(result).toEqual({ response: 'button_press', value: 'button_press' });
  });

  it('should return null for non-message update', () => {
    const update = { poll: { id: '123' } };
    const result = processUserResponse(update);
    expect(result).toBeNull();
  });
});

describe('buildWaitKeyboard', () => {
  it('should return empty object for freeText', () => {
    expect(buildWaitKeyboard('freeText')).toEqual({});
  });

  it('should build inline keyboard for fromList', () => {
    const options = [
      { text: 'Yes', value: 'yes' },
      { text: 'No', value: 'no' },
    ];
    const result = buildWaitKeyboard('fromList', options);
    expect(result).toEqual({
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Yes', callback_data: 'yes' }],
          [{ text: 'No', callback_data: 'no' }],
        ],
      },
    });
  });

  it('should return empty object when no options provided', () => {
    expect(buildWaitKeyboard('fromList', [])).toEqual({});
  });
});

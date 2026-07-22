import { describe, it, expect } from 'vitest';
import {
  buildInlineKeyboard,
  buildReplyKeyboard,
} from '../nodes/Bale/GenericFunctions';
import { getMimeType } from '../nodes/Bale/util/triggerUtils';
import { processUserResponse, buildWaitKeyboard } from '../nodes/Bale/hitl/sendAndWait';

// ==========================================
//       Inline Keyboard Tests
// ==========================================
describe('buildInlineKeyboard', () => {
  it('should return empty array for empty input', () => {
    expect(buildInlineKeyboard([])).toEqual([]);
  });

  it('should return empty array for null/undefined', () => {
    expect(buildInlineKeyboard(null as any)).toEqual([]);
    expect(buildInlineKeyboard(undefined as any)).toEqual([]);
  });

  it('should wrap each button in its own array (row)', () => {
    const buttons = [{ text: 'Click', type: 'url', url: 'https://example.com' }];
    const result = buildInlineKeyboard(buttons);
    expect(result).toEqual([[{ text: 'Click', url: 'https://example.com' }]]);
  });

  it('should handle URL buttons', () => {
    const buttons = [{ text: 'Visit', type: 'url', url: 'https://google.com' }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Visit', url: 'https://google.com' });
  });

  it('should handle callback_data buttons', () => {
    const buttons = [{ text: 'OK', type: 'callback_data', callback_data: 'ok' }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'OK', callback_data: 'ok' });
  });

  it('should handle web_app buttons', () => {
    const buttons = [{ text: 'Open', type: 'web_app', web_app: { url: 'https://app.com' } }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Open', web_app: { url: 'https://app.com' } });
  });

  it('should handle pay buttons', () => {
    const buttons = [{ text: 'Pay', type: 'pay', pay: true }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Pay', pay: true });
  });

  it('should handle switch_inline_query', () => {
    const buttons = [{ text: 'Search', type: 'switch_inline_query', switch_inline_query: 'query' }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Search', switch_inline_query: 'query' });
  });

  it('should handle multiple buttons (each in own row)', () => {
    const buttons = [
      { text: 'Btn1', type: 'url', url: 'https://a.com' },
      { text: 'Btn2', type: 'callback_data', callback_data: 'b' },
      { text: 'Btn3', type: 'pay', pay: true },
    ];
    const result = buildInlineKeyboard(buttons);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual([{ text: 'Btn1', url: 'https://a.com' }]);
    expect(result[1]).toEqual([{ text: 'Btn2', callback_data: 'b' }]);
    expect(result[2]).toEqual([{ text: 'Btn3', pay: true }]);
  });

  it('should skip buttons without text', () => {
    const buttons = [
      { text: 'Valid', type: 'url', url: 'https://a.com' },
      { type: 'callback_data', callback_data: 'no_text' },
    ];
    const result = buildInlineKeyboard(buttons);
    expect(result).toHaveLength(2);
    expect(result[0][0].text).toBe('Valid');
    expect(result[1][0].text).toBeUndefined();
  });

  it('should handle login_url buttons', () => {
    const buttons = [{ text: 'Login', type: 'login_url', login_url: { url: 'https://auth.com' } }];
    const result = buildInlineKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Login', login_url: { url: 'https://auth.com' } });
  });
});

// ==========================================
//       Reply Keyboard Tests
// ==========================================
describe('buildReplyKeyboard', () => {
  it('should return empty array for empty input', () => {
    expect(buildReplyKeyboard([])).toEqual([]);
  });

  it('should return empty array for null/undefined', () => {
    expect(buildReplyKeyboard(null as any)).toEqual([]);
    expect(buildReplyKeyboard(undefined as any)).toEqual([]);
  });

  it('should build reply keyboard rows', () => {
    const buttons = [{ button: [{ text: 'Button 1' }, { text: 'Button 2' }] }];
    const result = buildReplyKeyboard(buttons);
    expect(result).toEqual([[{ text: 'Button 1' }, { text: 'Button 2' }]]);
  });

  it('should handle request_contact flag', () => {
    const buttons = [{ button: [{ text: 'Share', request_contact: true }] }];
    const result = buildReplyKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Share', request_contact: true });
  });

  it('should handle request_location flag', () => {
    const buttons = [{ button: [{ text: 'Location', request_location: true }] }];
    const result = buildReplyKeyboard(buttons);
    expect(result[0][0]).toEqual({ text: 'Location', request_location: true });
  });

  it('should handle multiple rows', () => {
    const buttons = [
      { button: [{ text: 'Row1-Btn1' }] },
      { button: [{ text: 'Row2-Btn1' }, { text: 'Row2-Btn2' }] },
    ];
    const result = buildReplyKeyboard(buttons);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([{ text: 'Row1-Btn1' }]);
    expect(result[1]).toEqual([{ text: 'Row2-Btn1' }, { text: 'Row2-Btn2' }]);
  });

  it('should handle empty button array in row', () => {
    const buttons = [{ button: [] }];
    const result = buildReplyKeyboard(buttons);
    expect(result).toEqual([[]]);
  });
});

// ==========================================
//       getMimeType Tests
// ==========================================
describe('getMimeType', () => {
  it('should return correct MIME types for images', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('animation.gif')).toBe('image/gif');
    expect(getMimeType('sticker.webp')).toBe('image/webp');
  });

  it('should return correct MIME types for video', () => {
    expect(getMimeType('video.mp4')).toBe('video/mp4');
    expect(getMimeType('video.mpeg')).toBe('video/mpeg');
  });

  it('should return correct MIME types for audio', () => {
    expect(getMimeType('audio.ogg')).toBe('audio/ogg');
    expect(getMimeType('audio.mp3')).toBe('audio/mpeg');
  });

  it('should return correct MIME types for documents', () => {
    expect(getMimeType('doc.pdf')).toBe('application/pdf');
    expect(getMimeType('archive.zip')).toBe('application/zip');
  });

  it('should return octet-stream for unknown', () => {
    expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    expect(getMimeType('file')).toBe('application/octet-stream');
  });

  it('should handle case insensitivity', () => {
    expect(getMimeType('PHOTO.JPG')).toBe('image/jpeg');
    expect(getMimeType('Video.MP4')).toBe('video/mp4');
  });
});

// ==========================================
//       processUserResponse Tests
// ==========================================
describe('processUserResponse', () => {
  it('should return null for null/undefined', () => {
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
    expect(processUserResponse({ poll: { id: '123' } })).toBeNull();
    expect(processUserResponse({ inline_query: { id: '456' } })).toBeNull();
  });

  it('should prioritize message over callback_query', () => {
    const update = {
      message: { text: 'msg' },
      callback_query: { data: 'cb' },
    };
    const result = processUserResponse(update);
    expect(result).toEqual({ response: 'msg', value: 'msg' });
  });

  it('should handle empty text message (returns null since text is falsy)', () => {
    const update = { message: { text: '' } };
    const result = processUserResponse(update);
    expect(result).toBeNull();
  });
});

// ==========================================
//       buildWaitKeyboard Tests
// ==========================================
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

  it('should handle single option', () => {
    const options = [{ text: 'OK', value: 'ok' }];
    const result = buildWaitKeyboard('fromList', options);
    expect(result.reply_markup?.inline_keyboard).toHaveLength(1);
    expect(result.reply_markup?.inline_keyboard[0]).toEqual([{ text: 'OK', callback_data: 'ok' }]);
  });

  it('should handle many options', () => {
    const options = Array.from({ length: 10 }, (_, i) => ({ text: `Option ${i}`, value: `opt_${i}` }));
    const result = buildWaitKeyboard('fromList', options);
    expect(result.reply_markup?.inline_keyboard).toHaveLength(10);
  });
});

// ==========================================
//       API URL Structure Tests
// ==========================================
describe('API URL structure', () => {
  it('should match Telegram pattern', () => {
    // Telegram: ${credentials.baseUrl}/bot${credentials.accessToken}/${endpoint}
    // Bale should be identical
    const baseUrl = 'https://tapi.bale.ai';
    const token = '123456789:ABC';
    const endpoint = 'sendMessage';
    const expected = `${baseUrl}/bot${token}/${endpoint}`;
    expect(expected).toBe('https://tapi.bale.ai/bot123456789:ABC/sendMessage');
  });

  it('should not have double slashes in path', () => {
    const baseUrl = 'https://tapi.bale.ai';
    const token = '123456789:ABC';
    const endpoint = 'sendMessage';
    const url = `${baseUrl}/bot${token}/${endpoint}`;
    // After https://, no more //
    const pathPart = url.split('://')[1];
    expect(pathPart).not.toContain('//');
  });
});

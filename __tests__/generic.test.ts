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

    it('should build URL buttons', () => {
      const buttons = [{ text: 'Click', type: 'url', url: 'https://example.com' }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([{ text: 'Click', url: 'https://example.com' }]);
    });

    it('should build callback data buttons', () => {
      const buttons = [{ text: 'OK', type: 'callback_data', callback_data: 'ok' }];
      const result = buildInlineKeyboard(buttons);
      expect(result).toEqual([{ text: 'OK', callback_data: 'ok' }]);
    });

    it('should handle multiple buttons', () => {
      const buttons = [
        { text: 'Btn1', type: 'url', url: 'https://a.com' },
        { text: 'Btn2', type: 'callback_data', callback_data: 'b' },
      ];
      const result = buildInlineKeyboard(buttons);
      expect(result.length).toBe(2);
    });

    it('should handle web_app buttons', () => {
      const buttons = [{ text: 'Open', type: 'web_app', web_app: { url: 'https://app.com' } }];
      const result = buildInlineKeyboard(buttons);
      expect(result[0].web_app).toEqual({ url: 'https://app.com' });
    });

    it('should handle pay buttons', () => {
      const buttons = [{ text: 'Pay', type: 'pay', pay: true }];
      const result = buildInlineKeyboard(buttons);
      expect(result[0].pay).toBe(true);
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
    expect(getMimeType('image.jpeg')).toBe('image/jpeg');
    expect(getMimeType('archive.zip')).toBe('application/zip');
    expect(getMimeType('audio.mp3')).toBe('audio/mpeg');
    expect(getMimeType('animation.gif')).toBe('image/gif');
    expect(getMimeType('video.mpeg')).toBe('video/mpeg');
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

  it('should prioritize message over callback_query', () => {
    const update = { 
      message: { text: 'msg' }, 
      callback_query: { data: 'cb' } 
    };
    const result = processUserResponse(update);
    expect(result).toEqual({ response: 'msg', value: 'msg' });
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

  it('should handle single option', () => {
    const options = [{ text: 'OK', value: 'ok' }];
    const result = buildWaitKeyboard('fromList', options);
    expect(result.reply_markup.inline_keyboard.length).toBe(1);
  });
});

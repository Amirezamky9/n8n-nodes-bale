import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	INodeProperties,
	IRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

// ----------------------------------
//       Base URL
// ----------------------------------

const BASE_URL = 'https://api.bale.ai';

// ----------------------------------
//       API Request
// ----------------------------------

/**
 * Make an API request to Bale Bot API.
 */
export async function apiRequest(
	this: IExecuteFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('baleApi');
	const token = credentials.token;

	const options: IRequestOptions = {
		method: method as any,
		uri: `${BASE_URL}/bot${token}${endpoint}`,
		body,
		qs: query,
		json: true,
	};

	try {
		const response = await this.helpers.request(options);
		return response;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

// ----------------------------------
//       Reply Markup Builders
// ----------------------------------

/**
 * Build inline keyboard from fixed collection data.
 */
export function buildInlineKeyboard(buttons: any[]): any[][] {
	if (!buttons?.length) return [];
	return buttons.map((btn: any) => {
		const button: any = {};
		if (btn.text) button.text = btn.text;
		if (btn.url) button.url = btn.url;
		if (btn.callback_data) button.callback_data = btn.callback_data;
		if (btn.web_app?.url) button.web_app = { url: btn.web_app.url };
		if (btn.login_url?.url) button.login_url = { url: btn.login_url.url };
		if (btn.switch_inline_query) button.switch_inline_query = btn.switch_inline_query;
		if (btn.switch_inline_query_current_chat) button.switch_inline_query_current_chat = btn.switch_inline_query_current_chat;
		if (btn.pay) button.pay = true;
		return button;
	});
}

/**
 * Build reply keyboard from fixed collection data.
 */
export function buildReplyKeyboard(buttons: any[]): any[][] {
	if (!buttons?.length) return [];
	return buttons.map((row: any) => {
		const rowButtons = row.button || [];
		return rowButtons.map((btn: any) => {
			const button: any = { text: btn.text };
			if (btn.request_contact) button.request_contact = true;
			if (btn.request_location) button.request_location = true;
			return button;
		});
	});
}

// ----------------------------------
//       Add Reply Markup to Body
// ----------------------------------

/**
 * Add reply_markup to the request body based on user selection.
 */
export function addReplyMarkup(this: IExecuteFunctions, body: IDataObject, itemIndex: number): void {
	const replyMarkupType = this.getNodeParameter('replyMarkup', itemIndex, '') as string;

	if (!replyMarkupType) return;

	if (replyMarkupType === 'inlineKeyboard') {
		const keyboardData = this.getNodeParameter('inlineKeyboard', itemIndex, {}) as any;
		const buttons = keyboardData?.button || [];
		if (buttons.length) {
			body.reply_markup = {
				inline_keyboard: buildInlineKeyboard(buttons),
			};
		}
	} else if (replyMarkupType === 'replyKeyboard') {
		const keyboardData = this.getNodeParameter('replyKeyboard', itemIndex, {}) as any;
		const buttons = keyboardData?.button || [];
		if (buttons.length) {
			body.reply_markup = {
				keyboard: buildReplyKeyboard(buttons),
				resize_keyboard: this.getNodeParameter('resizeKeyboard', itemIndex, false) as boolean,
				one_time_keyboard: this.getNodeParameter('oneTimeKeyboard', itemIndex, false) as boolean,
				selective: this.getNodeParameter('selective', itemIndex, false) as boolean,
			};
		}
	} else if (replyMarkupType === 'forceReply') {
		const forceReplyData = this.getNodeParameter('forceReply', itemIndex, {}) as any;
		body.reply_markup = {
			force_reply: true,
			selective: forceReplyData?.selective || false,
		};
	} else if (replyMarkupType === 'replyKeyboardRemove') {
		const removeData = this.getNodeParameter('replyKeyboardRemove', itemIndex, {}) as any;
		body.reply_markup = {
			remove_keyboard: true,
			selective: removeData?.selective || false,
		};
	}
}

// ----------------------------------
//       Additional Fields
// ----------------------------------

/**
 * Add additional fields from the "Additional Fields" collection to the body.
 */
export function addAdditionalFields(this: IExecuteFunctions, body: IDataObject, itemIndex: number): void {
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

	if (Object.keys(additionalFields).length === 0) return;

	Object.assign(body, additionalFields);
}

// ----------------------------------
//       Property Name Helper
// ----------------------------------

/**
 * Get the property name for file uploads based on operation.
 */
export function getPropertyName(operation: string): string {
	const mapping: Record<string, string> = {
		sendPhoto: 'photo',
		sendVideo: 'video',
		sendAudio: 'audio',
		sendDocument: 'document',
		sendVoice: 'voice',
		sendAnimation: 'animation',
		sendSticker: 'sticker',
	};
	return mapping[operation] || 'file';
}

// ----------------------------------
//       Reply Markup Properties
// ----------------------------------

/**
 * Main replyMarkup property definition.
 */
export const replyMarkupProperty: INodeProperties = {
	displayName: 'Reply Markup',
	name: 'replyMarkup',
	type: 'options',
	displayOptions: {
		show: {
			operation: [
				'sendMessage', 'sendPhoto', 'sendVideo', 'sendDocument',
				'sendAudio', 'sendVoice', 'sendAnimation', 'sendSticker',
				'sendLocation', 'sendContact',
			],
		},
	},
	options: [
		{
			name: 'Inline Keyboard',
			value: 'inlineKeyboard',
		},
		{
			name: 'Reply Keyboard',
			value: 'replyKeyboard',
		},
		{
			name: 'Force Reply',
			value: 'forceReply',
		},
		{
			name: 'Reply Keyboard Remove',
			value: 'replyKeyboardRemove',
		},
	],
	default: '',
	description: 'Additional keyboard buttons to show',
};

/**
 * Inline keyboard buttons property.
 */
export const inlineKeyboardProperty: INodeProperties = {
	displayName: 'Inline Keyboard',
	name: 'inlineKeyboard',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	displayOptions: {
		show: {
			replyMarkup: ['inlineKeyboard'],
		},
	},
	default: {},
	placeholder: 'Add Button',
	options: [
		{
			name: 'button',
			displayName: 'Button',
			values: [
				{
					displayName: 'Text',
					name: 'text',
					type: 'string',
					default: '',
					description: 'Button text',
				},
				{
					displayName: 'Type',
					name: 'type',
					type: 'options',
					options: [
						{ name: 'URL', value: 'url' },
						{ name: 'Callback Data', value: 'callback_data' },
						{ name: 'Web App', value: 'web_app' },
						{ name: 'Login URL', value: 'login_url' },
						{ name: 'Switch Inline Query', value: 'switch_inline_query' },
						{ name: 'Pay', value: 'pay' },
					],
					default: 'callback_data',
					description: 'Type of inline button',
				},
				{
					displayName: 'URL',
					name: 'url',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							type: ['url'],
						},
					},
					description: 'URL to open when button is clicked',
				},
				{
					displayName: 'Callback Data',
					name: 'callback_data',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							type: ['callback_data'],
						},
					},
					description: 'Data sent to bot when button is clicked',
				},
				{
					displayName: 'Web App URL',
					name: 'web_app',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							type: ['web_app'],
						},
					},
					description: 'URL of the Web App to open',
				},
				{
					displayName: 'Login URL',
					name: 'login_url',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							type: ['login_url'],
						},
					},
					description: 'URL for Telegram login',
				},
				{
					displayName: 'Switch Inline Query',
					name: 'switch_inline_query',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							type: ['switch_inline_query'],
						},
					},
					description: 'Inline query to pre-fill',
				},
			],
		},
	],
};

/**
 * Reply keyboard buttons property.
 */
export const replyKeyboardProperty: INodeProperties = {
	displayName: 'Reply Keyboard',
	name: 'replyKeyboard',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	displayOptions: {
		show: {
			replyMarkup: ['replyKeyboard'],
		},
	},
	default: {},
	placeholder: 'Add Row',
	options: [
		{
			name: 'button',
			displayName: 'Button',
			values: [
				{
					displayName: 'Text',
					name: 'text',
					type: 'string',
					default: '',
					description: 'Button text',
				},
				{
					displayName: 'Request Contact',
					name: 'request_contact',
					type: 'boolean',
					default: false,
					description: 'Whether to request user contact',
				},
				{
					displayName: 'Request Location',
					name: 'request_location',
					type: 'boolean',
					default: false,
					description: 'Whether to request user location',
				},
			],
		},
	],
};

/**
 * Force reply property.
 */
export const forceReplyProperty: INodeProperties = {
	displayName: 'Force Reply',
	name: 'forceReply',
	type: 'collection',
	displayOptions: {
		show: {
			replyMarkup: ['forceReply'],
		},
	},
	default: {},
	options: [
		{
			displayName: 'Selective',
			name: 'selective',
			type: 'boolean',
			default: false,
			description: 'Whether to show the reply keyboard only to specific users',
		},
	],
};

/**
 * Reply keyboard remove property.
 */
export const replyKeyboardRemoveProperty: INodeProperties = {
	displayName: 'Reply Keyboard Remove',
	name: 'replyKeyboardRemove',
	type: 'collection',
	displayOptions: {
		show: {
			replyMarkup: ['replyKeyboardRemove'],
		},
	},
	default: {},
	options: [
		{
			displayName: 'Selective',
			name: 'selective',
			type: 'boolean',
			default: false,
			description: 'Whether to remove the keyboard only from specific users',
		},
	],
};

/**
 * Reply keyboard options (resize, one_time, selective).
 */
export const replyKeyboardOptionsProperty: INodeProperties = {
	displayName: 'Reply Keyboard Options',
	name: 'replyKeyboardOptions',
	type: 'collection',
	displayOptions: {
		show: {
			replyMarkup: ['replyKeyboard'],
		},
	},
	default: {},
	options: [
		{
			displayName: 'Resize Keyboard',
			name: 'resizeKeyboard',
			type: 'boolean',
			default: false,
			description: 'Whether to resize the keyboard vertically',
		},
		{
			displayName: 'One Time Keyboard',
			name: 'oneTimeKeyboard',
			type: 'boolean',
			default: false,
			description: 'Whether to hide the keyboard after one use',
		},
		{
			displayName: 'Selective',
			name: 'selective',
			type: 'boolean',
			default: false,
			description: 'Whether to show the keyboard only to specific users',
		},
	],
};

// ----------------------------------
//       File Download
// ----------------------------------

/**
 * Download a file from Bale Bot API.
 */
export async function downloadFile(
	fileId: string,
	token: string,
	baseUrl: string = 'https://api.bale.ai',
): Promise<{ data: Buffer; fileName: string; mimeType: string }> {
	const response = await fetch(`${baseUrl}/file/bot${token}/${fileId}`);
	if (!response.ok) {
		throw new Error(`Failed to download file: ${response.statusText}`);
	}
	const data = Buffer.from(await response.arrayBuffer());
	const contentType = response.headers.get('content-type') || 'application/octet-stream';
	const fileName = `file_${fileId}`;
	return { data, fileName, mimeType: contentType };
}

/**
 * Get the secret token from credentials.
 * Used by webhook trigger to verify requests.
 */
export async function getSecretToken(this: IExecuteFunctions | IHookFunctions | IWebhookFunctions): Promise<string> {
	const credentials = await this.getCredentials('baleApi');
	return credentials.token as string;
}

import { lookup } from 'mime-types';
import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import type { Readable } from 'stream';

import {
	addAdditionalFields,
	addReplyMarkup,
	apiRequest,
	forceReplyProperty,
	getPropertyName,
	replyKeyboardOptionsProperty,
	replyKeyboardProperty,
	replyMarkupProperty,
	inlineKeyboardProperty,
	replyKeyboardRemoveProperty,
} from './GenericFunctions';

export class Bale implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bale',
		name: 'bale',
		icon: 'file:bale.svg',
		group: ['output'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Sends data to Bale messenger',
		defaults: {
			name: 'Bale',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'baleApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------
			//       Resource
			// ----------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Callback',
						value: 'callback',
					},
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Payment',
						value: 'payment',
					},
				],
				default: 'message',
			},

			// ==========================================
			//         CALLBACK OPERATIONS
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['callback'],
					},
				},
				options: [
					{
						name: 'Answer Query',
						value: 'answerQuery',
						description: 'Send answer to callback query sent from inline keyboard',
						action: 'Answer a callback query',
					},
					{
						name: 'Answer Inline Query',
						value: 'answerInlineQuery',
						description: 'Send answer to callback query sent from inline bot',
						action: 'Answer an inline query callback',
					},
				],
				default: 'answerQuery',
			},

			// --- Callback: answerQuery ---
			{
				displayName: 'Callback Query ID',
				name: 'callbackQueryId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['answerQuery'],
					},
				},
				default: '',
				description: 'Unique identifier for the query to be answered',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
					},
				},
				default: '',
				description: 'Text of the notification',
			},
			{
				displayName: 'Show Alert',
				name: 'showAlert',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
					},
				},
				default: false,
				description: 'Whether to show an alert or a notification at the top of the chat',
			},

			// --- Callback: answerInlineQuery ---
			{
				displayName: 'Inline Query ID',
				name: 'inlineQueryId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
					},
				},
				default: '',
				description: 'Unique identifier for the query to be answered',
			},
			{
				displayName: 'Results',
				name: 'results',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
					},
				},
				default: '[]',
				description: 'Array of results for the inline query',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cache Time',
						name: 'cache_time',
						type: 'number',
						default: 300,
						description: 'Maximum amount of time in seconds the result may be cached',
					},
					{
						displayName: 'Next Offset',
						name: 'next_offset',
						type: 'string',
						default: '',
						description: 'Pass the offset that a client should send in the next query',
					},
					{
						displayName: 'Switch PM Text',
						name: 'switch_pm_text',
						type: 'string',
						default: '',
						description: 'Text of the inline query switch button',
					},
					{
						displayName: 'Switch PM Parameter',
						name: 'switch_pm_parameter',
						type: 'string',
						default: '',
						description: 'Deep-linking parameter for the start message',
					},
				],
			},

			// ==========================================
			//         CHAT OPERATIONS
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get up to date information about a chat',
						action: 'Get a chat',
					},
					{
						name: 'Get Administrators',
						value: 'getAdministrators',
						description: 'Get the Administrators of a chat',
						action: 'Get all administrators in a chat',
					},
					{
						name: 'Get Member',
						value: 'getMember',
						description: 'Get the member of a chat',
						action: 'Get a member in a chat',
					},
					{
						name: 'Leave',
						value: 'leave',
						description: 'Leave a group, supergroup or channel',
						action: 'Leave a chat',
					},
					{
						name: 'Set Description',
						value: 'setDescription',
						description: 'Set the description of a chat',
						action: 'Set description on a chat',
					},
					{
						name: 'Set Title',
						value: 'setTitle',
						description: 'Set the title of a chat',
						action: 'Set a title on a chat',
					},
				],
				default: 'get',
			},

			// --- Chat: chatId ---
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: [
							'get', 'getAdministrators', 'getMember', 'leave',
							'setDescription', 'setTitle',
						],
					},
				},
				default: '',
				description: 'Unique identifier for the target chat',
			},

			// --- Chat: getMember userId ---
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['getMember'],
					},
				},
				default: '',
				description: 'Unique identifier of the target user',
			},

			// --- Chat: setTitle/setDescription ---
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['setTitle'],
					},
				},
				default: '',
				description: 'New chat title (1-128 characters)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['setDescription'],
					},
				},
				default: '',
				description: 'New chat description (0-255 characters)',
			},

			// ==========================================
			//         FILE OPERATIONS
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a file',
						action: 'Get a file',
					},
				],
				default: 'get',
			},

			// --- File: getFile ---
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'File identifier to get info about',
			},

			// ==========================================
			//         MESSAGE OPERATIONS
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Answer Callback Query',
						value: 'answerCallbackQuery',
						description: 'Send answer to callback query from inline keyboard',
						action: 'Answer a callback query',
					},
					{
						name: 'Copy Message',
						value: 'copyMessage',
						description: 'Copy a message',
						action: 'Copy a message',
					},
					{
						name: 'Delete Chat Message',
						value: 'deleteMessage',
						description: 'Delete a message',
						action: 'Delete a chat message',
					},
					{
						name: 'Edit Message Caption',
						value: 'editMessageCaption',
						description: 'Edit caption of a message',
						action: 'Edit message caption',
					},
					{
						name: 'Edit Message Text',
						value: 'editMessageText',
						description: 'Edit a text message',
						action: 'Edit a text message',
					},
					{
						name: 'Forward Message',
						value: 'forwardMessage',
						description: 'Forward a message',
						action: 'Forward a message',
					},
					{
						name: 'Pin Chat Message',
						value: 'pinChatMessage',
						description: 'Pin a message',
						action: 'Pin a chat message',
					},
					{
						name: 'Send Animation',
						value: 'sendAnimation',
						description: 'Send an animated file (GIF)',
						action: 'Send an animated file',
					},
					{
						name: 'Send Audio',
						value: 'sendAudio',
						description: 'Send an audio file',
						action: 'Send an audio file',
					},
					{
						name: 'Send Chat Action',
						value: 'sendChatAction',
						description: 'Send a chat action (typing, uploading, etc.)',
						action: 'Send a chat action',
					},
					{
						name: 'Send Document',
						value: 'sendDocument',
						description: 'Send a file/document',
						action: 'Send a document',
					},
					{
						name: 'Send Location',
						value: 'sendLocation',
						description: 'Send a location',
						action: 'Send a location',
					},
					{
						name: 'Send Media Group',
						value: 'sendMediaGroup',
						description: 'Send a group of photos, videos, documents, or audio as an album',
						action: 'Send a media group',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a text message',
						action: 'Send a text message',
					},
					{
						name: 'Send Photo',
						value: 'sendPhoto',
						description: 'Send a photo',
						action: 'Send a photo',
					},
					{
						name: 'Send Sticker',
						value: 'sendSticker',
						description: 'Send a sticker',
						action: 'Send a sticker',
					},
					{
						name: 'Send Video',
						value: 'sendVideo',
						description: 'Send a video',
						action: 'Send a video',
					},
					{
						name: 'Send Video Note',
						value: 'sendVideoNote',
						description: 'Send a video note (circular video)',
						action: 'Send a video note',
					},
					{
						name: 'Send Voice',
						value: 'sendVoice',
						description: 'Send a voice message',
						action: 'Send a voice message',
					},
					{
						name: 'Unpin Chat Message',
						value: 'unpinChatMessage',
						description: 'Unpin a message',
						action: 'Unpin a chat message',
					},
				],
				default: 'sendMessage',
			},

			// ==========================================
			//         PAYMENT OPERATIONS
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['payment'],
					},
				},
				options: [
					{
						name: 'Send Invoice',
						value: 'sendInvoice',
						description: 'Send a payment invoice (Bale Wallet)',
						action: 'Send a payment invoice',
					},
					{
						name: 'Create Invoice Link',
						value: 'createInvoiceLink',
						description: 'Create a payment link for Mini Apps',
						action: 'Create an invoice link',
					},
					{
						name: 'Answer Pre-Checkout Query',
						value: 'answerPreCheckoutQuery',
						description: 'Answer a pre-checkout query (max 10 seconds)',
						action: 'Answer a pre-checkout query',
					},
					{
						name: 'Inquire Transaction',
						value: 'inquireTransaction',
						description: 'Inquire about a transaction status (Bale-specific)',
						action: 'Inquire a transaction',
					},
				],
				default: 'sendInvoice',
			},

			// --- Payment: sendInvoice ---
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '',
				description: 'Unique identifier for the target chat',
			},
			{
				displayName: 'Provider Token',
				name: 'providerToken',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '',
				description: 'Bale Wallet provider token from BotFather',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '',
				description: 'Product name (1-32 characters)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '',
				description: 'Product description (1-255 characters)',
			},
			{
				displayName: 'Payload',
				name: 'payload',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '',
				description: 'Bot-defined invoice payload (1-128 bytes)',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: 'IRR',
				description: 'Three-letter ISO 4217 currency code',
			},
			{
				displayName: 'Prices',
				name: 'prices',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: '[{"label": "Product", "amount": 1000}]',
				description: 'Price breakdown (JSON array of {label, amount} objects)',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['sendInvoice'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Photo URL',
						name: 'photo_url',
						type: 'string',
						default: '',
						description: 'URL of the product photo',
					},
					{
						displayName: 'Need Name',
						name: 'need_name',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s name',
					},
					{
						displayName: 'Need Phone Number',
						name: 'need_phone_number',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s phone number',
					},
					{
						displayName: 'Need Email',
						name: 'need_email',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s email',
					},
					{
						displayName: 'Send Email to Provider',
						name: 'send_email_to_provider',
						type: 'boolean',
						default: false,
						description: 'Whether to send the user\'s email to the provider',
					},
					{
						displayName: 'Is Flexible',
						name: 'is_flexible',
						type: 'boolean',
						default: false,
						description: 'Whether the final price depends on the shipping method',
					},
				],
			},

			// --- Payment: createInvoiceLink ---
			{
				displayName: 'Provider Token',
				name: 'providerToken',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: '',
				description: 'Bale Wallet provider token from BotFather',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: '',
				description: 'Product name (1-32 characters)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: '',
				description: 'Product description (1-255 characters)',
			},
			{
				displayName: 'Payload',
				name: 'payload',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: '',
				description: 'Bot-defined invoice payload (1-128 bytes)',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: 'IRR',
				description: 'Three-letter ISO 4217 currency code',
			},
			{
				displayName: 'Prices',
				name: 'prices',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: '[{"label": "Product", "amount": 1000}]',
				description: 'Price breakdown (JSON array of {label, amount} objects)',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createInvoiceLink'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Photo URL',
						name: 'photo_url',
						type: 'string',
						default: '',
						description: 'URL of the product photo',
					},
					{
						displayName: 'Need Name',
						name: 'need_name',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s name',
					},
					{
						displayName: 'Need Phone Number',
						name: 'need_phone_number',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s phone number',
					},
					{
						displayName: 'Need Email',
						name: 'need_email',
						type: 'boolean',
						default: false,
						description: 'Whether to ask for the user\'s email',
					},
				],
			},

			// --- Payment: answerPreCheckoutQuery ---
			{
				displayName: 'Pre-Checkout Query ID',
				name: 'preCheckoutQueryId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['answerPreCheckoutQuery'],
					},
				},
				default: '',
				description: 'Unique identifier for the pre-checkout query',
			},
			{
				displayName: 'OK',
				name: 'ok',
				type: 'boolean',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['answerPreCheckoutQuery'],
					},
				},
				default: true,
				description: 'Specify True if everything is alright and the bot is ready to process the order',
			},
			{
				displayName: 'Error Message',
				name: 'errorMessage',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['answerPreCheckoutQuery'],
						ok: [false],
					},
				},
				default: '',
				description: 'Required if ok is False. Error message in human readable form',
			},

			// --- Payment: inquireTransaction ---
			{
				displayName: 'Transaction ID',
				name: 'transactionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['inquireTransaction'],
					},
				},
				default: '',
				description: 'Unique identifier of the transaction to inquire about',
			},

			// ==========================================
			//         COMMON MESSAGE FIELDS
			// ==========================================

			// Chat ID for message operations
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				default: '',
				description: 'Unique identifier for the target chat or username of the target channel',
			},

			// ---- sendMessage ----
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: '',
				description: 'Text of the message to be sent (1-4096 characters after entities parsing)',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{ name: 'Markdown', value: 'Markdown' },
							{ name: 'HTML', value: 'HTML' },
						],
						default: '',
						description: 'Choose the parser for message text',
					},
					{
						displayName: 'Disable Web Page Preview',
						name: 'disable_web_page_preview',
						type: 'boolean',
						default: false,
						description: 'Whether to disable link previews for links in this message',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
					{
						displayName: 'Allow Sending Without Reply',
						name: 'allow_sending_without_reply',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message if the replied-to message is not found',
					},
				],
			},

			// ---- sendPhoto ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
					},
				},
				default: 'url',
				description: 'The source to send the photo from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the photo',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the photo',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Photo caption (0-1024 characters)',
					},
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{ name: 'Markdown', value: 'Markdown' },
							{ name: 'HTML', value: 'HTML' },
						],
						default: '',
						description: 'Choose the parser for caption text',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
				],
			},

			// ---- sendVideo ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVideo'],
					},
				},
				default: 'url',
				description: 'The source to send the video from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVideo'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the video',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVideo'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVideo'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the video',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendVideo'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Video caption (0-1024 characters)',
					},
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{ name: 'Markdown', value: 'Markdown' },
							{ name: 'HTML', value: 'HTML' },
						],
						default: '',
						description: 'Choose the parser for caption text',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
				],
			},

			// ---- sendDocument ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument'],
					},
				},
				default: 'url',
				description: 'The source to send the document from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the document',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the document',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendDocument'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Document caption (0-1024 characters)',
					},
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{ name: 'Markdown', value: 'Markdown' },
							{ name: 'HTML', value: 'HTML' },
						],
						default: '',
						description: 'Choose the parser for caption text',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
				],
			},

			// ---- sendAudio ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAudio'],
					},
				},
				default: 'url',
				description: 'The source to send the audio from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAudio'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the audio file',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAudio'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAudio'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the audio',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendAudio'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Audio caption (0-1024 characters)',
					},
					{
						displayName: 'Duration',
						name: 'duration',
						type: 'number',
						default: 0,
						description: 'Duration of the audio in seconds',
					},
					{
						displayName: 'Performer',
						name: 'performer',
						type: 'string',
						default: '',
						description: 'Performer of the audio',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Title of the audio',
					},
				],
			},

			// ---- sendVoice ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVoice'],
					},
				},
				default: 'url',
				description: 'The source to send the voice from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVoice'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the voice message',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVoice'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendVoice'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the voice',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendVoice'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Voice message caption (0-1024 characters)',
					},
					{
						displayName: 'Duration',
						name: 'duration',
						type: 'number',
						default: 0,
						description: 'Duration of the voice message in seconds',
					},
				],
			},

			// ---- sendAnimation ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
					},
				},
				default: 'url',
				description: 'The source to send the animation from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the animation (GIF)',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the animation',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Animation caption (0-1024 characters)',
					},
					{
						displayName: 'Duration',
						name: 'duration',
						type: 'number',
						default: 0,
						description: 'Duration of the animation in seconds',
					},
				],
			},

			// ---- sendSticker ----
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSticker'],
					},
				},
				default: 'url',
				description: 'The source to send the sticker from',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File ID', value: 'fileId' },
					{ name: 'Binary Data', value: 'binaryData' },
				],
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSticker'],
						source: ['url'],
					},
				},
				default: '',
				description: 'URL to the sticker image',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSticker'],
						source: ['fileId'],
					},
				},
				default: '',
				description: 'Telegram file ID of the sticker',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSticker'],
						source: ['binaryData'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the sticker',
			},

			// ---- sendLocation ----
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendLocation'],
					},
				},
				default: 0,
				description: 'Latitude of the location',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendLocation'],
					},
				},
				default: 0,
				description: 'Longitude of the location',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['sendLocation'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
				],
			},

			// ---- sendChatAction ----
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendChatAction'],
					},
				},
				default: 'typing',
				description: 'Type of action to broadcast',
				options: [
					{ name: 'Typing', value: 'typing' },
					{ name: 'Upload Photo', value: 'upload_photo' },
					{ name: 'Record Voice', value: 'record_voice' },
					{ name: 'Upload Voice', value: 'upload_voice' },
					{ name: 'Upload Video', value: 'upload_video' },
					{ name: 'Record Video', value: 'record_video' },
					{ name: 'Upload Document', value: 'upload_document' },
					{ name: 'Find Location', value: 'find_location' },
					{ name: 'Record Video Note', value: 'record_video_note' },
					{ name: 'Upload Video Note', value: 'upload_video_note' },
				],
			},

			// ---- copyMessage ----
			{
				displayName: 'From Chat ID',
				name: 'fromChatId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['copyMessage'],
					},
				},
				default: '',
				description: 'Unique identifier for the chat where the original message was sent',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['copyMessage'],
					},
				},
				default: 0,
				description: 'Message identifier in the chat specified in from_chat_id',
			},

			// ---- forwardMessage ----
			{
				displayName: 'From Chat ID',
				name: 'fromChatId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['forwardMessage'],
					},
				},
				default: '',
				description: 'Unique identifier for the chat where the original message was sent',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['forwardMessage'],
					},
				},
				default: 0,
				description: 'Message identifier in the chat specified in from_chat_id',
			},

			// ---- deleteMessage ----
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['deleteMessage'],
					},
				},
				default: 0,
				description: 'Unique message identifier',
			},

			// ---- editMessageText ----
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['editMessageText'],
					},
				},
				default: 0,
				description: 'Unique identifier of the message to edit',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['editMessageText'],
					},
				},
				default: '',
				description: 'New text of the message',
			},

			// ---- editMessageCaption ----
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['editMessageCaption'],
					},
				},
				default: 0,
				description: 'Unique identifier of the message to edit',
			},

			// ---- pinChatMessage / unpinChatMessage ----
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['pinChatMessage', 'unpinChatMessage'],
					},
				},
				default: 0,
				description: 'Unique identifier of the message to pin/unpin',
			},

			// ---- sendMediaGroup ----
			{
				displayName: 'Media',
				name: 'media',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMediaGroup'],
					},
				},
				default: '[]',
				description: 'JSON array of media objects (photo, video, document, audio). Each object must have type, media (URL or file_id), and optional caption.',
			},

			// ==========================================
			//         REPLY MARKUP PROPERTIES
			// ==========================================
			replyMarkupProperty,
			inlineKeyboardProperty,
			replyKeyboardProperty,
			forceReplyProperty,
			replyKeyboardRemoveProperty,
			replyKeyboardOptionsProperty,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: any;

				if (resource === 'message') {
					// ==========================================
					//         MESSAGE OPERATIONS
					// ==========================================
					const chatId = this.getNodeParameter('chatId', i) as string;

					if (operation === 'sendMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							text: this.getNodeParameter('text', i) as string,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendMessage', body);
					} else if (operation === 'sendPhoto') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.photo = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.photo = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'image/png';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendPhoto', body);
					} else if (operation === 'sendVideo') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.video = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.video = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'video/mp4';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendVideo', body);
					} else if (operation === 'sendDocument') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.document = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.document = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'application/octet-stream';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendDocument', body);
					} else if (operation === 'sendAudio') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.audio = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.audio = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'audio/mpeg';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendAudio', body);
					} else if (operation === 'sendVoice') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.voice = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.voice = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'audio/ogg';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendVoice', body);
					} else if (operation === 'sendAnimation') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.animation = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.animation = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const mimeType = binaryData.mimeType || 'video/mp4';
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendAnimation', body);
					} else if (operation === 'sendSticker') {
						const body: IDataObject = { chat_id: chatId };
						const source = this.getNodeParameter('source', i) as string;

						if (source === 'url') {
							body.sticker = this.getNodeParameter('url', i) as string;
						} else if (source === 'fileId') {
							body.sticker = this.getNodeParameter('fileId', i) as string;
						} else if (source === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = items[i].binary?.[binaryPropertyName];
							if (!binaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found');
							}
							const propertyName = getPropertyName(operation);
							body[propertyName] = {
								value: Buffer.from(binaryData.data, BINARY_ENCODING),
								options: {
									fileName: binaryData.fileName,
									mimeType: binaryData.mimeType,
								},
							};
						}
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendSticker', body);
					} else if (operation === 'sendLocation') {
						const body: IDataObject = {
							chat_id: chatId,
							latitude: this.getNodeParameter('latitude', i) as number,
							longitude: this.getNodeParameter('longitude', i) as number,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendLocation', body);
					} else if (operation === 'sendChatAction') {
						const body: IDataObject = {
							chat_id: chatId,
							action: this.getNodeParameter('action', i) as string,
						};
						responseData = await apiRequest.call(this, 'POST', '/sendChatAction', body);
					} else if (operation === 'sendMediaGroup') {
						const body: IDataObject = {
							chat_id: chatId,
							media: JSON.parse(this.getNodeParameter('media', i) as string),
						};
						responseData = await apiRequest.call(this, 'POST', '/sendMediaGroup', body);
					} else if (operation === 'copyMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							from_chat_id: this.getNodeParameter('fromChatId', i) as string,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/copyMessage', body);
					} else if (operation === 'forwardMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							from_chat_id: this.getNodeParameter('fromChatId', i) as string,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/forwardMessage', body);
					} else if (operation === 'deleteMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						responseData = await apiRequest.call(this, 'POST', '/deleteMessage', body);
					} else if (operation === 'editMessageText') {
						const body: IDataObject = {
							chat_id: chatId,
							message_id: this.getNodeParameter('messageId', i) as number,
							text: this.getNodeParameter('text', i) as string,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/editMessageText', body);
					} else if (operation === 'editMessageCaption') {
						const body: IDataObject = {
							chat_id: chatId,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/editMessageCaption', body);
					} else if (operation === 'pinChatMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/pinChatMessage', body);
					} else if (operation === 'unpinChatMessage') {
						const body: IDataObject = {
							chat_id: chatId,
							message_id: this.getNodeParameter('messageId', i) as number,
						};
						responseData = await apiRequest.call(this, 'POST', '/unpinChatMessage', body);
					}
				} else if (resource === 'callback') {
					// ==========================================
					//         CALLBACK OPERATIONS
					// ==========================================
					if (operation === 'answerQuery') {
						const body: IDataObject = {
							callback_query_id: this.getNodeParameter('callbackQueryId', i) as string,
							text: this.getNodeParameter('text', i) as string,
							show_alert: this.getNodeParameter('showAlert', i) as boolean,
						};
						responseData = await apiRequest.call(this, 'POST', '/answerCallbackQuery', body);
					} else if (operation === 'answerInlineQuery') {
						const body: IDataObject = {
							inline_query_id: this.getNodeParameter('inlineQueryId', i) as string,
							results: JSON.parse(this.getNodeParameter('results', i) as string),
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/answerInlineQuery', body);
					}
				} else if (resource === 'chat') {
					// ==========================================
					//         CHAT OPERATIONS
					// ==========================================
					const chatId = this.getNodeParameter('chatId', i) as string;

					if (operation === 'get') {
						responseData = await apiRequest.call(this, 'POST', '/getChat', { chat_id: chatId });
					} else if (operation === 'getAdministrators') {
						responseData = await apiRequest.call(this, 'POST', '/getChatAdministrators', { chat_id: chatId });
					} else if (operation === 'getMember') {
						responseData = await apiRequest.call(this, 'POST', '/getChatMember', {
							chat_id: chatId,
							user_id: this.getNodeParameter('userId', i) as string,
						});
					} else if (operation === 'leave') {
						responseData = await apiRequest.call(this, 'POST', '/leaveChat', { chat_id: chatId });
					} else if (operation === 'setDescription') {
						responseData = await apiRequest.call(this, 'POST', '/setChatDescription', {
							chat_id: chatId,
							description: this.getNodeParameter('description', i) as string,
						});
					} else if (operation === 'setTitle') {
						responseData = await apiRequest.call(this, 'POST', '/setChatTitle', {
							chat_id: chatId,
							title: this.getNodeParameter('title', i) as string,
						});
					}
				} else if (resource === 'file') {
					// ==========================================
					//         FILE OPERATIONS
					// ==========================================
					const fileId = this.getNodeParameter('fileId', i) as string;
					responseData = await apiRequest.call(this, 'POST', '/getFile', { file_id: fileId });
				} else if (resource === 'payment') {
					// ==========================================
					//         PAYMENT OPERATIONS
					// ==========================================
					if (operation === 'sendInvoice') {
						const prices = JSON.parse(this.getNodeParameter('prices', i) as string);
						const body: IDataObject = {
							chat_id: this.getNodeParameter('chatId', i) as string,
							provider_token: this.getNodeParameter('providerToken', i) as string,
							currency: this.getNodeParameter('currency', i) as string,
							prices,
							title: this.getNodeParameter('title', i) as string,
							description: this.getNodeParameter('description', i) as string,
							payload: this.getNodeParameter('payload', i) as string,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/sendInvoice', body);
					} else if (operation === 'createInvoiceLink') {
						const prices = JSON.parse(this.getNodeParameter('prices', i) as string);
						const body: IDataObject = {
							provider_token: this.getNodeParameter('providerToken', i) as string,
							currency: this.getNodeParameter('currency', i) as string,
							prices,
							title: this.getNodeParameter('title', i) as string,
							description: this.getNodeParameter('description', i) as string,
							payload: this.getNodeParameter('payload', i) as string,
						};
						addAdditionalFields.call(this, body, i);
						responseData = await apiRequest.call(this, 'POST', '/createInvoiceLink', body);
					} else if (operation === 'answerPreCheckoutQuery') {
						const body: IDataObject = {
							pre_checkout_query_id: this.getNodeParameter('preCheckoutQueryId', i) as string,
							ok: this.getNodeParameter('ok', i) as boolean,
						};
						if (!body.ok) {
							body.error_message = this.getNodeParameter('errorMessage', i) as string;
						}
						responseData = await apiRequest.call(this, 'POST', '/answerPreCheckoutQuery', body);
					} else if (operation === 'inquireTransaction') {
						const body: IDataObject = {
							transaction_id: this.getNodeParameter('transactionId', i) as string,
						};
						responseData = await apiRequest.call(this, 'POST', '/inquireTransaction', body);
					}
				}

				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}

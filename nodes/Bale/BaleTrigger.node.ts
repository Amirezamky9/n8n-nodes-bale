import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { apiRequest, downloadFile, getSecretToken } from './GenericFunctions';
import type { IEvent } from './IEvent';

/**
 * Update-type keys that `updates` (the "Trigger On" parameter) can select.
 */
const UPDATE_TYPE_KEYS = [
	'message',
	'edited_message',
	'channel_post',
	'edited_channel_post',
	'callback_query',
	'inline_query',
	'pre_checkout_query',
	'poll',
] as const;

export class BaleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bale Trigger',
		name: 'baleTrigger',
		icon: 'file:bale.svg',
		group: ['trigger'],
		version: [1],
		subtitle: '=Updates: {{$parameter["updates"].join(", ")}}',
		description: 'Starts the workflow on a Bale update',
		defaults: {
			name: 'Bale Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'baleApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Trigger On',
				name: 'updates',
				type: 'multiOptions',
				options: [
					{
						name: '*',
						value: '*',
						description: 'All updates',
					},
					{
						name: 'Callback Query',
						value: 'callback_query',
						description: 'Trigger on new incoming callback query',
					},
					{
						name: 'Channel Post',
						value: 'channel_post',
						description:
							'Trigger on new incoming channel post of any kind — text, photo, sticker, etc',
					},
					{
						name: 'Edited Channel Post',
						value: 'edited_channel_post',
						description:
							'Trigger on new version of a channel post that is known to the bot and was edited',
					},
					{
						name: 'Edited Message',
						value: 'edited_message',
						description:
							'Trigger on new version of a message that is known to the bot and was edited',
					},
					{
						name: 'Inline Query',
						value: 'inline_query',
						description: 'Trigger on new incoming inline query',
					},
					{
						name: 'Message',
						value: 'message',
						description: 'Trigger on new incoming message of any kind — text, photo, sticker, etc',
					},
					{
						name: 'Poll',
						value: 'poll',
						description:
							'Trigger on new poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot.',
					},
					{
						name: 'Pre-Checkout Query',
						value: 'pre_checkout_query',
						description:
							'Trigger on new incoming pre-checkout query. Contains full information about checkout.',
					},
				],
				required: true,
				default: [],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Download Images/Files',
						name: 'download',
						type: 'boolean',
						default: false,
						description: 'Whether the trigger should download files',
					},
				],
			},
		],
	};

	/**
	 * Webhook handler — called when a POST request hits the webhook
	 */
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as unknown as IEvent;

		const updates = this.getNodeParameter('updates', []) as string[];

		const additionalFields = this.getNodeParameter('additionalFields', {}) as {
			download?: boolean;
		};

		const download = additionalFields.download ?? false;

		// Filter updates based on selected types
		if (updates.length > 0 && !updates.includes('*')) {
			const matched = updates.some((updateType) => bodyData[updateType]);
			if (!matched) {
				return { webhookResponse: { status: 200 } };
			}
		}

		// Download files if requested
		if (download) {
			try {
				const credentials = await this.getCredentials('baleApi');
				const token = credentials.accessToken as string;
				const baseUrl = (credentials.baseUrl as string) || 'https://tapi.bale.ai';

				const message = bodyData.message || bodyData.edited_message || bodyData.channel_post || bodyData.edited_channel_post;

				if (message) {
					// Download photos
					if (message.photo) {
						const largest = message.photo[message.photo.length - 1];
						const { data, fileName, mimeType } = await downloadFile(largest.file_id, token, baseUrl);
						message.photo_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}

					// Download document
					if (message.document) {
						const { data, fileName, mimeType } = await downloadFile(message.document.file_id, token, baseUrl);
						message.document_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}

					// Download voice
					if (message.voice) {
						const { data, fileName, mimeType } = await downloadFile(message.voice.file_id, token, baseUrl);
						message.voice_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}

					// Download audio
					if (message.audio) {
						const { data, fileName, mimeType } = await downloadFile(message.audio.file_id, token, baseUrl);
						message.audio_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}

					// Download video
					if (message.video) {
						const { data, fileName, mimeType } = await downloadFile(message.video.file_id, token, baseUrl);
						message.video_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}

					// Download animation
					if (message.animation) {
						const { data, fileName, mimeType } = await downloadFile(message.animation.file_id, token, baseUrl);
						message.animation_data = {
							data: data.toString('base64'),
							fileName,
							mimeType,
						};
					}
				}
			} catch (error) {
				// If download fails, continue without file data
				console.warn('Failed to download file:', error);
			}
		}

		return {
			workflowData: [[{ json: bodyData as unknown as IDataObject }]],
		};
	}
}

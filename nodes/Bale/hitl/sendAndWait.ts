/**
 * HITL (Human-in-the-loop) support for Bale node.
 * Implements send-and-wait pattern for interactive workflows.
 */

/**
 * Create a send-and-wait operation for interactive workflows.
 * This allows the workflow to pause and wait for user response.
 */
export function createSendAndWaitProperty() {
	return {
		displayName: 'Send and Wait for Response',
		name: 'sendAndWait',
		type: 'boolean',
		default: false,
		description: 'Whether to wait for a response from the user before continuing',
	};
}

/**
 * Create response options for send-and-wait.
 * These define how the user can respond.
 */
export function createResponseOptionsProperty() {
	return {
		displayName: 'Response Options',
		name: 'responseOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				sendAndWait: [true],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Response Type',
				name: 'responseType',
				type: 'options',
				options: [
					{ name: 'Free Text', value: 'freeText' },
					{ name: 'From List', value: 'fromList' },
					{ name: 'Email', value: 'email' },
					{ name: 'Number', value: 'number' },
				],
				default: 'freeText',
				description: 'Type of response to expect from the user',
			},
			{
				displayName: 'List Options',
				name: 'listOptions',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						responseType: ['fromList'],
					},
				},
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						name: 'option',
						displayName: 'Option',
						values: [
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								default: '',
								description: 'Text to display for this option',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value to return when this option is selected',
							},
						],
					},
				],
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 300,
				description: 'How long to wait for a response before timing out',
			},
			{
				displayName: 'Custom Timeout Message',
				name: 'customTimeoutMessage',
				type: 'string',
				default: '',
				description: 'Custom message to send if the user does not respond in time',
			},
		],
	};
}

/**
 * Process the user response from the trigger webhook.
 * Extracts the response data from the incoming update.
 */
export function processUserResponse(update: any): { response: string; value: any } | null {
	if (!update) return null;

	// Handle text messages
	if (update.message?.text) {
		return {
			response: update.message.text,
			value: update.message.text,
		};
	}

	// Handle callback queries (inline keyboard buttons)
	if (update.callback_query?.data) {
		return {
			response: update.callback_query.data,
			value: update.callback_query.data,
		};
	}

	return null;
}

/**
 * Build the keyboard for send-and-wait operations.
 * Creates either inline keyboard or reply keyboard based on response type.
 */
export function buildWaitKeyboard(responseType: string, options?: any[]): any {
	if (responseType === 'fromList' && options?.length) {
		// Create inline keyboard with options as buttons
		const inline_keyboard = options.map((opt: any) => [
			{
				text: opt.text || opt.value,
				callback_data: opt.value || opt.text,
			},
		]);
		return { reply_markup: { inline_keyboard } };
	}

	// For free text, no special keyboard needed
	return {};
}

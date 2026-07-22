/**
 * Bale Update event interface.
 * Matches the Bale Bot API Update object structure.
 * Uses index signature for n8n IDataObject compatibility.
 */
export interface IEvent {
	[key: string]: unknown;
	update_id: number;
	message?: any;
	edited_message?: any;
	channel_post?: any;
	edited_channel_post?: any;
	callback_query?: any;
	inline_query?: any;
	pre_checkout_query?: any;
	poll?: any;
	// Bale-specific
	ask_review?: any;
}

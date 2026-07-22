import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class BaleApi implements ICredentialType {
	name = 'baleApi';

	displayName = 'Bale API';

	documentationUrl = 'https://docs.bale.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Chat with the <a href="https://ble.ir/botfather">Bale BotFather</a> to obtain the access token',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://tapi.bale.ai',
			description: 'Base URL for Bale Bot API',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}/bot{{$credentials.accessToken}}',
			url: '/getMe',
		},
	};
}

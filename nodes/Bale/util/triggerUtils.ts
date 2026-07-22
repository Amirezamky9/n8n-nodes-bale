import type { IHttpRequestMethods, IExecuteFunctions } from 'n8n-workflow';

/**
 * Download a file from Bale Bot API.
 * Used by the Trigger node to download attached files.
 */
export async function downloadFile(
	fileId: string,
	token: string,
	baseUrl: string = 'https://tapi.bale.ai',
): Promise<Buffer> {
	const response = await fetch(`${baseUrl}/file/bot${token}/${fileId}`);
	if (!response.ok) {
		throw new Error(`Failed to download file: ${response.statusText}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

/**
 * Get MIME type from a Bale file path.
 */
export function getMimeType(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase() || '';
	const mimeMap: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		mp4: 'video/mp4',
		mpeg: 'video/mpeg',
		zip: 'application/zip',
		pdf: 'application/pdf',
		ogg: 'audio/ogg',
		mp3: 'audio/mpeg',
	};
	return mimeMap[ext] || 'application/octet-stream';
}

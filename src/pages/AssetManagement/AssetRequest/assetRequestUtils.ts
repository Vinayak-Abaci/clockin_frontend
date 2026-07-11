export type AssetRequestDocument = {
	id?: number | string;
	name?: string;
	file?: string;
	uploaded_at?: string;
};

export const ASSET_REQUEST_STATUS_LOOKUP: Record<string, string> = {
	PENDING: 'Pending',
	APPLIED: 'Applied',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
	CANCELLED: 'Cancelled',
};

export type AssetRequestAction = 'approve' | 'reject' | 'cancel';

export const assetRequestActionUrl = (
	id: number | string,
	action: AssetRequestAction,
): string => `/api/hr/asset-requests/${id}/${action}/`;

export const assetRequestDetailUrl = (id: number | string): string =>
	`/api/hr/asset-requests/${id}/`;

export const assetRequestCommandsUrl = (id: number | string): string =>
	`/api/hr/asset-requests/${id}/commands/`;

export type AssetRequestCommand = {
	id?: number | string;
	command?: string;
	response_text?: string;
	command_by?: unknown;
	command_datetime?: string;
	created_at?: string;
};

export const normalizeAssetRequestCommands = (raw: unknown): AssetRequestCommand[] => {
	const source =
		raw != null &&
		typeof raw === 'object' &&
		!Array.isArray(raw) &&
		Array.isArray((raw as { commands?: unknown[] }).commands)
			? (raw as { commands: unknown[] }).commands
			: raw;
	const list = Array.isArray(source) ? source : (source as { results?: unknown[] })?.results || [];
	return [...list]
		.filter((item) => item != null)
		.sort((a, b) => {
			const aTime = String(
				(a as AssetRequestCommand).command_datetime ||
					(a as AssetRequestCommand).created_at ||
					'',
			);
			const bTime = String(
				(b as AssetRequestCommand).command_datetime ||
					(b as AssetRequestCommand).created_at ||
					'',
			);
			return aTime.localeCompare(bTime);
		}) as AssetRequestCommand[];
};

export const assetRequestCommandText = (cmd: AssetRequestCommand): string =>
	String(cmd.command || cmd.response_text || '').trim();

export const formatAssetRequestCommandAuthor = (commandBy: unknown): string | null => {
	if (commandBy == null || commandBy === '') return null;
	if (typeof commandBy === 'string') {
		const value = commandBy.trim();
		return value || null;
	}
	if (typeof commandBy === 'number' && !Number.isNaN(commandBy)) {
		return `User #${commandBy}`;
	}
	if (typeof commandBy === 'object') {
		const record = commandBy as Record<string, unknown>;
		const displayName = String(record.name || '').trim();
		if (displayName) return displayName;
		const first = String(record.first_name || '').trim();
		const last = String(record.last_name || '').trim();
		const full = [first, last].filter(Boolean).join(' ');
		if (full) return full;
		const email = String(record.email || '').trim();
		if (email) return email;
		if (record.id != null && record.id !== '') return `User #${record.id}`;
	}
	return null;
};

export const assetRequestRowStatus = (row: any): string | undefined =>
	row?.status ?? row?.approval_status ?? row?.state ?? row?.meta_data?.status ?? undefined;

export const assetRequestStatusCode = (row: any): string =>
	String(row?.status_code ?? '')
		.trim()
		.toUpperCase();

export const isEditableAssetRequestStatus = (
	status: string | undefined | null,
	statusCode?: string | null,
): boolean => {
	const code = String(statusCode ?? '')
		.trim()
		.toUpperCase();
	if (code === 'APPLIED' || code === 'PENDING') return true;

	const key = String(status ?? '')
		.trim()
		.toUpperCase();
	return key === 'APPLIED' || key === 'PENDING' || key.startsWith('PENDING');
};

export const normalizeAssetDocuments = (raw: unknown): AssetRequestDocument[] => {
	if (Array.isArray(raw)) {
		return raw.filter((item) => item != null) as AssetRequestDocument[];
	}
	if (raw && typeof raw === 'object') {
		return [raw as AssetRequestDocument];
	}
	if (typeof raw === 'string' && raw.trim()) {
		return [{ file: raw.trim() }];
	}
	return [];
};

export const resolveAssetDocumentsFromRow = (row: any): AssetRequestDocument[] =>
	normalizeAssetDocuments(
		row?.documents ??
			row?.attachments ??
			row?.documents_data ??
			(row?.document != null ? row.document : null),
	);

export const hasAssetDocuments = (row: any): boolean =>
	resolveAssetDocumentsFromRow(row).length > 0;

export const assetRequestDocumentLabel = (doc: AssetRequestDocument): string => {
	if (doc.name?.trim()) return doc.name.trim();
	if (typeof doc.file === 'string' && doc.file) {
		try {
			return (
				decodeURIComponent(new URL(doc.file).pathname.split('/').pop() || '') ||
				`Document ${doc.id ?? ''}`
			);
		} catch {
			return doc.file.split('/').pop() || `Document ${doc.id ?? ''}`;
		}
	}
	return `Document ${doc.id ?? ''}`.trim();
};

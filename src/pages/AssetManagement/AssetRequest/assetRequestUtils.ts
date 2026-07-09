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

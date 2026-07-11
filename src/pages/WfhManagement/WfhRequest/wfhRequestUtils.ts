export const WFH_REQUEST_STATUS_LOOKUP: Record<string, string> = {
	PENDING: 'Pending',
	APPLIED: 'Applied',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
	CANCELLED: 'Cancelled',
};

export type WfhRequestAction = 'approve' | 'reject' | 'cancel';

export const wfhRequestActionUrl = (id: number | string, action: WfhRequestAction): string =>
	`/api/hr/wfh-requests/${id}/${action}/`;

export const wfhRequestDetailUrl = (id: number | string): string => `/api/hr/wfh-requests/${id}/`;

export const wfhRequestRowStatus = (row: any): string | undefined =>
	row?.status ?? row?.approval_status ?? row?.state ?? row?.meta_data?.status ?? undefined;

export const wfhRequestStatusCode = (row: any): string =>
	String(row?.status_code ?? '')
		.trim()
		.toUpperCase();

export const isEditableWfhRequestStatus = (
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

export type WfhRequestFormValues = {
	start_date: string;
	end_date: string;
	reason: string;
};

export const buildWfhRequestPayload = (data: WfhRequestFormValues) => ({
	start_date: data.start_date,
	end_date: data.end_date,
	reason: String(data.reason || '').trim(),
});

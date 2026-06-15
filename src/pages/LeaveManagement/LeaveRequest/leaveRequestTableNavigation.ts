import { allRoutesObject } from '../../../routes/RoutesMenu';

export const LEAVE_REQUEST_STATUS_LABELS: Record<string, string> = {
	PENDING: 'Pending',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
	CANCELLED: 'Cancelled',
	APPLIED: 'Applied',
};

export const LEAVE_STATUS_LOOKUP: Record<string, string> = {
	PENDING: LEAVE_REQUEST_STATUS_LABELS.PENDING,
	APPLIED: LEAVE_REQUEST_STATUS_LABELS.APPLIED,
	APPROVED: LEAVE_REQUEST_STATUS_LABELS.APPROVED,
	REJECTED: LEAVE_REQUEST_STATUS_LABELS.REJECTED,
	CANCELLED: LEAVE_REQUEST_STATUS_LABELS.CANCELLED,
};

export const isEditableLeaveRequestStatus = (status: string | undefined | null): boolean =>
	String(status ?? '')
		.trim()
		.toUpperCase() === 'APPLIED';

export const isLeaveRequestDocumentUploadAllowed = (status: string | undefined | null): boolean => {
	const key = String(status ?? '').trim().toUpperCase();
	return key !== 'REJECTED' && key !== 'CANCELLED';
};

/** DD/MM/YYYY — matches leave-requests `date` query param (e.g. 06/06/2026). */
export const formatLeaveRequestDateParam = (date: Date): string => {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const todayLeaveRequestDateParam = (): string => formatLeaveRequestDateParam(new Date());

export type LeaveRequestUrlFilters = {
	status: string | null;
	leaveTypeId: number | null;
	leaveTypeName: string | null;
	date: string | null;
};

export const buildLeaveRequestUrlFilters = (
	filters: LeaveRequestTableFilters = {},
): LeaveRequestUrlFilters => ({
	status: filters.status?.trim().toUpperCase() || null,
	leaveTypeId: filters.leaveTypeId ?? null,
	leaveTypeName: filters.leaveTypeName?.trim() || null,
	date: filters.date?.trim() || null,
});

export const leaveRequestUrlFiltersToSearchParams = (
	filters: LeaveRequestUrlFilters,
): URLSearchParams => {
	const params = new URLSearchParams();
	if (filters.status) params.set('status', filters.status);
	if (filters.leaveTypeId != null) {
		params.set('leave_type', String(filters.leaveTypeId));
		if (filters.leaveTypeName) params.set('leave_type_name', filters.leaveTypeName);
	}
	if (filters.date) params.set('date', filters.date);
	return params;
};

export type LeaveRequestTableFilters = {
	status?: string;
	leaveTypeId?: number;
	leaveTypeName?: string;
	date?: string;
};

export const buildLeaveRequestsTablePath = (filters: LeaveRequestTableFilters = {}): string => {
	const params = new URLSearchParams();

	if (filters.status) {
		params.set('status', filters.status.trim().toUpperCase());
	}
	if (filters.leaveTypeId != null) {
		params.set('leave_type', String(filters.leaveTypeId));
		if (filters.leaveTypeName) {
			params.set('leave_type_name', filters.leaveTypeName);
		}
	}
	if (filters.date) {
		params.set('date', filters.date.trim());
	}

	const query = params.toString();
	return query
		? `${allRoutesObject.LeaveRequests.path}?${query}`
		: allRoutesObject.LeaveRequests.path;
};

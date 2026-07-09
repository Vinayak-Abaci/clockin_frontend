import {
	getAttendanceStatusMeta,
	normalizeAttendanceStatusKey,
} from '../../Attendance/attendanceStatusUtils';

export type SiteAttendanceSummary = {
	scheduled?: number;
	clocked_in?: number;
	clocked_out?: number;
	leave?: number;
	present?: number;
	absent?: number;
};

export type SiteAttendanceStatusFilter =
	| 'all'
	| 'scheduled'
	| 'present'
	| 'absent'
	| 'leave'
	| 'clocked_in'
	| 'clocked_out';

export const SITE_ATTENDANCE_STATUS_FILTERS: SiteAttendanceStatusFilter[] = [
	'all',
	'scheduled',
	'present',
	'absent',
	'leave',
	'clocked_in',
	'clocked_out',
];

export const summaryCount = (
	summary: SiteAttendanceSummary | null | undefined,
	key: Exclude<SiteAttendanceStatusFilter, 'all'>,
): number => {
	const value = summary?.[key];
	return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
};

export const formatSiteAttendanceUserName = (user: unknown): string => {
	if (!user || typeof user !== 'object') return '—';
	const u = user as Record<string, unknown>;
	const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
	return full || String(u.email ?? '—');
};

export const formatClockinStatusLabel = (status: unknown): string => {
	const key = normalizeAttendanceStatusKey(String(status ?? ''));
	if (!key) return '—';
	if (key === 'CLOCK_IN' || key === 'CLOCKED_IN') return 'Clocked in';
	if (key === 'CLOCK_OUT' || key === 'CLOCKED_OUT') return 'Clocked out';
	return getAttendanceStatusMeta(key)?.label ?? key.replace(/_/g, ' ');
};

export const ATTENDANCE_STATUS_META: Record<string, { label: string; color: string }> = {
	PRESENT: { label: 'Present', color: '#198754' },
	ABSENT: { label: 'Absent', color: '#dc3545' },
	HALF_DAY: { label: 'Half Day', color: '#fd7e14' },
	LEAVE: { label: 'On Leave', color: '#0d6efd' },
	HOLIDAY: { label: 'Holiday', color: '#6f42c1' },
	WEEKEND: { label: 'Weekend', color: '#6c757d' },
	LATE: { label: 'Late', color: '#f0ad4e' },
	SPECIAL_SCHEDULE: { label: 'Special Schedule', color: '#20c997' },
	SCHEDULED: { label: 'Scheduled', color: '#3174ad' },
	ATTENDANCE_REMOVED: { label: 'Attendance removed', color: '#6c757d' },
};

export const ATTENDANCE_REMOVED_META = ATTENDANCE_STATUS_META.ATTENDANCE_REMOVED;

export const isAttendanceDeleted = (data: any): boolean => {
	if (!data || typeof data !== 'object') return false;
	const v = data.attendance_deleted;
	return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
};

export const attendanceDeletedByLine = (data: any): string | null => {
	if (!isAttendanceDeleted(data)) return null;
	const by = formatAttendanceUserName(data?.attendance_deleted_by);
	return by ? `Removed by ${by}` : null;
};

export const normalizeAttendanceStatusKey = (status: string | undefined) =>
	String(status || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_');

export const getAttendanceStatusMeta = (status: string | undefined) => {
	const key = normalizeAttendanceStatusKey(status);
	if (!key) return null;
	return (
		ATTENDANCE_STATUS_META[key] || {
			label: key.replace(/_/g, ' '),
			color: '#0d6efd',
		}
	);
};

/** Converts a duration in seconds to `08h30m` or `04h` when minutes are zero. */
export const formatSecondsToHms = (totalSeconds: number): string => {
	const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
	const totalMinutes = Math.floor(secs / 60);
	return formatMinutesToHms(totalMinutes);
};

/** API duration fields such as `worked_mins` are stored in minutes. Omits minutes when zero (e.g. `04h`). */
export const formatMinutesToHms = (totalMinutes: number): string => {
	const mins = Math.max(0, Math.floor(Number(totalMinutes) || 0));
	const hrs = Math.floor(mins / 60);
	const m = mins % 60;
	const hoursPart = `${String(hrs).padStart(2, '0')}h`;
	return m > 0 ? `${hoursPart}${String(m).padStart(2, '0')}m` : hoursPart;
};

/** Matches worked/target strings such as `09h06m/08h` or `08h/08h`. */
export const WORKED_TIME_DISPLAY_LINE_RE = /^\d{2}h(\d{2}m)?\/\d{2}h(\d{2}m)?$/;

export const formatWorkedMinsPair = (workedRaw: unknown, targetRaw: unknown): string | null => {
	const worked = Number(workedRaw);
	const target = Number(targetRaw);
	if (!Number.isFinite(worked) || worked <= 0) return null;
	if (!Number.isFinite(target) || target < 0) return null;
	return `${formatMinutesToHms(worked)}/${formatMinutesToHms(target)}`;
};

export const formatAttendanceWorkedTime = (row: any): string =>
	formatWorkedMinsPair(
		row?.worked_mins ?? row?.worked_minutes,
		row?.target_work_mins ?? row?.target_work_minutes,
	) ?? '----';

export const formatAttendanceOtTime = (row: any): string => {
	const raw = row?.ot_mins ?? row?.ot_minutes ?? row?.overtime_mins ?? row?.overtime_minutes;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return '----';
	return formatMinutesToHms(n);
};

export const getWorkedTimeFromAttendance = (att: unknown): string | null => {
	if (!att || typeof att !== 'object' || Array.isArray(att)) return null;
	const row = att as Record<string, unknown>;
	return formatWorkedMinsPair(
		row.worked_mins ?? row.worked_minutes,
		row.target_work_mins ?? row.target_work_minutes,
	);
};

/** Light tint of a status/accent color for calendar cells and chips (`#rrggbb` + alpha hex). */
export const statusColorLightBackground = (color: string, opacityHex = '22') => {
	const c = String(color || '').trim();
	if (!c) return 'rgba(var(--bs-secondary-rgb), 0.12)';
	if (c.startsWith('var(')) {
		return `color-mix(in srgb, ${c} 14%, transparent)`;
	}
	if (/^#[0-9A-Fa-f]{6}$/.test(c)) return `${c}${opacityHex}`;
	if (/^#[0-9A-Fa-f]{3}$/.test(c)) {
		const r = c[1];
		const g = c[2];
		const b = c[3];
		return `#${r}${r}${g}${g}${b}${b}${opacityHex}`;
	}
	return c;
};

export const calendarEventStyleFromColor = (
	color: string,
): {
	backgroundColor: string;
	color: string;
	fontSize: string;
	lineHeight: number;
	fontWeight: number;
	border: string;
} => ({
	backgroundColor: statusColorLightBackground(color),
	color,
	fontSize: '0.72rem',
	lineHeight: 1.25,
	fontWeight: 600,
	border: 'none',
});

export const formatAttendanceUserName = (user: any): string => {
	if (user == null) return '';
	if (typeof user === 'string') return user.trim();
	const first = String(user?.first_name || '').trim();
	const last = String(user?.last_name || '').trim();
	const full = [first, last].filter(Boolean).join(' ').trim();
	if (full) return full;
	return String(user?.name || user?.preferred_name || user?.email || '').trim();
};

export const attendanceRowUserId = (row: any): number | null => {
	const u = row?.user;
	if (u == null) return null;
	if (typeof u === 'object' && !Array.isArray(u)) {
		const id = u?.id ?? u?.pk;
		if (id == null || id === '') return null;
		const num = Number(id);
		return Number.isNaN(num) ? null : num;
	}
	const num = Number(u);
	return Number.isNaN(num) ? null : num;
};

export const attendanceRowsFromResponse = (res: any): any[] => {
	const d = res?.data;
	if (Array.isArray(d)) return d;
	if (d && Array.isArray(d.results)) return d.results;
	return [];
};

export const eventsFromAttendanceRow = (row: any): any[] =>
	Array.isArray(row?.events) ? row.events.filter((e: any) => e != null) : [];

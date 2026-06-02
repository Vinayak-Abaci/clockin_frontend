export type HrExportFormat = 'csv' | 'xlsx';

export type HrExportOptions = {
	exportFormat: HrExportFormat;
	fromDate: string;
	toDate: string;
};

const PAGINATION_KEYS = new Set(['limit', 'offset']);

export const ATTENDANCE_EVENTS_EXPORT_PATH = '/api/hr/attendance-events/export/';
export const ATTENDANCE_EXPORT_PATH = '/api/hr/attendance/export/';

/** Build export URL from a list query URL, preserving search, ordering, and filters. */
export function buildHrListExportUrl(
	listUrl: string | undefined,
	exportPath: string,
	{ exportFormat, fromDate, toDate }: HrExportOptions,
): string {
	const params = new URLSearchParams();

	if (listUrl) {
		const queryStart = listUrl.indexOf('?');
		if (queryStart !== -1) {
			const existing = new URLSearchParams(listUrl.slice(queryStart + 1));
			existing.forEach((value, key) => {
				if (!PAGINATION_KEYS.has(key)) {
					params.append(key, value);
				}
			});
		}
	}

	params.set('export_format', exportFormat);
	params.set('from_date', fromDate);
	params.set('to_date', toDate);

	return `${exportPath}?${params.toString()}`;
}

export const hrExportFileName = (name: string, format: HrExportFormat): string =>
	`${name}.${format}`;

export const buildAttendanceEventsExportUrl = (
	listUrl: string | undefined,
	options: HrExportOptions,
): string => buildHrListExportUrl(listUrl, ATTENDANCE_EVENTS_EXPORT_PATH, options);

export const buildAttendanceExportUrl = (
	listUrl: string | undefined,
	options: HrExportOptions,
): string => buildHrListExportUrl(listUrl, ATTENDANCE_EXPORT_PATH, options);

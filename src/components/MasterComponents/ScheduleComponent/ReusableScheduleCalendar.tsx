import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	ATTENDANCE_REMOVED_META,
	isAttendanceDeleted,
	calendarEventStyleFromColor,
	getWorkedTimeFromAttendance,
} from '../../../pages/Attendance/attendanceStatusUtils';
import {
	shiftLabelsFromShiftsField,
	summarizeShiftLabels,
} from '../../../pages/Schedule/scheduleShiftUtils';
import CustomSpinner from '../../CustomSpinner/CustomSpinner';
import CustomCalendar from '../../CustomComponent/CustomCalendar';
import ButtonFiltter from '../../CustomComponent/Filters/ButtonFiltter';

const dayCodeByIndex: Record<number, string> = {
	0: 'SUN',
	1: 'MON',
	2: 'TUE',
	3: 'WED',
	4: 'THU',
	5: 'FRI',
	6: 'SAT',
};

type ReusableScheduleCalendarProps = {
	calendarType?: 'user' | 'group' | 'schedule';
	entityId?: string | number;
	userId?: string | number;
	height?: string;
	/** When true, shows the Status/Schedule/Leave/OT toggle (user calendar only). */
	enableViewFilter?: boolean;
	/** When true, no spinner while loading (e.g. parent shows a full-page loader). */
	hideLoadingIndicator?: boolean;
	/** Fires once after the first successful/failed fetch for the current user (not on month changes). */
	onInitialLoadComplete?: () => void;
	/** Fires when user clicks a date: first with `loading: true`, then with detail and `loading: false`. */
	onDateClick?: (date: Date, detail: any | null, meta: { loading: boolean }) => void;
};

const ReusableScheduleCalendar = ({
	calendarType = 'user',
	entityId,
	userId,
	height = '85vh',
	enableViewFilter = false,
	hideLoadingIndicator = true,
	onInitialLoadComplete,
	onDateClick,
}: ReusableScheduleCalendarProps) => {
	const calendarFilterOptions = ['All', 'Schedule', 'Status', 'Leave', 'OT'];
	const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
	const [calendarRows, setCalendarRows] = useState<any[]>([]);
	const [activeTab, setActiveTab] = useState('All');
	const [loading, setLoading] = useState(false);
	const [detailLoadingDate, setDetailLoadingDate] = useState<string | null>(null);
	const { showErrorNotification } = useToasterNotification();
	const initialLoadNotifiedRef = useRef(false);
	const resolvedEntityId = entityId ?? userId;
	const showViewFilter = enableViewFilter && calendarType === 'user';
	const effectiveTab = showViewFilter ? activeTab : 'Status';
	const showTopControls = !(loading && hideLoadingIndicator);

	useEffect(() => {
		initialLoadNotifiedRef.current = false;
	}, [calendarType, resolvedEntityId]);

	const selectedYearMonth = selectedMonth.format('YYYY-MM');

	const monthBounds = useMemo(
		() => ({
			start: selectedMonth.startOf('month'),
			end: selectedMonth.endOf('month'),
		}),
		[selectedMonth],
	);

	const isApplicableDay = (date: Dayjs, applicableDays: string[]) => {
		const dayCode = dayCodeByIndex[date.day()];
		return applicableDays.includes(dayCode);
	};

	const isAttendanceDayRow = (record: any) =>
		record?.date != null && (typeof record.date === 'string' || typeof record.date === 'number');

	const isMatchingUser = (record: any) => {
		if (!resolvedEntityId) return true;
		if (isAttendanceDayRow(record)) return true;
		const normalizedUserId = Number(resolvedEntityId);
		return (
			Number(record?.user) === normalizedUserId ||
			Number(record?.user_details?.id) === normalizedUserId
		);
	};

	const toShiftNames = (raw: any): string[] => {
		if (!Array.isArray(raw)) return [];
		return Array.from(
			new Set(
				raw
			.map((s: any) => {
				if (typeof s === 'string') return s.trim();
				if (s == null || typeof s !== 'object') return '';
				return String(
					s?.full_name ||
						s?.display_name ||
						s?.name ||
						s?.shift_name ||
						s?.shift_details?.name ||
						s?.shift_details?.shift_name ||
						'',
				).trim();
			})
			.filter(Boolean),
			),
		);
	};

	const deriveScheduleTitle = (schedule: any): string => {
		if (schedule == null) return '';
		if (typeof schedule === 'string') return schedule.trim();
		if (Array.isArray(schedule)) {
			const names = toShiftNames(schedule);
			return names.length ? names.join(', ') : '';
		}
		const direct =
			schedule.name ||
			schedule.schedule_name ||
			schedule.title ||
			schedule.shift_details?.name ||
			schedule.shift_details?.shift_name;
		if (direct) return String(direct);
		const shifts = Array.isArray(schedule.shifts) ? schedule.shifts : [];
		const fromShifts = shifts.map((s: any) => s?.name || s?.shift_name).filter(Boolean);
		if (fromShifts.length) return fromShifts.join(', ');
		if (schedule.id != null) return `Schedule ${schedule.id}`;
		return '';
	};

	const shiftLabelFromField = (raw: unknown): string => {
		const fromMap = shiftLabelsFromShiftsField(raw);
		if (fromMap.length) return summarizeShiftLabels(fromMap);
		const names = toShiftNames(raw);
		if (names.length) return summarizeShiftLabels(names);
		return '';
	};

	const deriveShiftLabelFromRow = (row: any): string => {
		const sd = row?.special_day;
		const hasSpecialDay = sd != null && sd !== '';
		if (hasSpecialDay) {
			const label = shiftLabelFromField(sd?.shifts);
			if (label) return label;
		}

		const sched = row?.schedule;
		if (sched != null && sched !== '') {
			const fromSched = shiftLabelFromField(sched?.shifts);
			if (fromSched) return fromSched;
			const single =
				sched?.shift_details?.name ||
				sched?.shift_details?.shift_name ||
				sched?.shift_name ||
				'';
			if (single) return String(single).trim();
			const title = deriveScheduleTitle(sched);
			if (title) return title;
		}

		return shiftLabelFromField(row?.shifts);
	};

	const SCHEDULE_EVENT_COLOR = '#3174ad';
	const LEAVE_EVENT_COLOR = '#0d6efd';
	const OT_EVENT_COLOR = '#6f42c1';

	const ATTENDANCE_STATUS_META: Record<string, { label: string; color: string }> = {
		PRESENT: { label: 'Present', color: '#198754' },
		ABSENT: { label: 'Absent', color: '#dc3545' },
		HALF_DAY: { label: 'Half Day', color: '#fd7e14' },
		LEAVE: { label: 'On Leave', color: '#0d6efd' },
		HOLIDAY: { label: 'Holiday', color: '#6f42c1' },
		WEEKEND: { label: 'Weekend', color: '#6c757d' },
		LATE: { label: 'Late', color: '#f0ad4e' },
		SPECIAL_SCHEDULE: { label: 'Special Schedule', color: '#20c997' },
		SCHEDULED: { label: 'Scheduled', color: '#3174ad' },
	};

	const normalizeStatusKey = (status: string | undefined) =>
		String(status || '')
			.trim()
			.toUpperCase()
			.replace(/\s+/g, '_');

	const getStatusMeta = (status: string | undefined) => {
		const key = normalizeStatusKey(status);
		if (!key) return null;
		return (
			ATTENDANCE_STATUS_META[key] || {
				label: key.replace(/_/g, ' '),
				color: '#0d6efd',
			}
		);
	};

	/** Day-level status (e.g. SCHEDULED) — shown on the Status filter. */
	const resolveMainDayStatus = (row: any): string | undefined => {
		const dayStatus = row?.status;
		return dayStatus != null && String(dayStatus).trim() !== '' ? String(dayStatus) : undefined;
	};

	/** `attendance.status` (e.g. ABSENT) — shown on the Leave filter for user calendar. */
	const resolveAttendanceStatus = (row: any): string | undefined => {
		const att = row?.attendance;
		if (!att || typeof att !== 'object' || Array.isArray(att)) return undefined;
		const attStatus = att.status;
		return attStatus != null && String(attStatus).trim() !== '' ? String(attStatus) : undefined;
	};

	const isAttendanceLate = (row: any, ct: 'user' | 'group' | 'schedule'): boolean => {
		if (ct !== 'user') return false;
		const att = row?.attendance;
		return Boolean(att && typeof att === 'object' && !Array.isArray(att) && att.is_late);
	};

	const getOtMinutes = (row: any): number => {
		const att = row?.attendance;
		if (att && typeof att === 'object' && !Array.isArray(att)) {
			const raw = att.ot_mins ?? att.ot_minutes ?? att.overtime_mins ?? att.overtime_minutes;
			const n = Number(raw);
			if (Number.isFinite(n) && n > 0) return n;
		}
		const top = row?.ot_mins ?? row?.ot_minutes;
		const nTop = Number(top);
		if (Number.isFinite(nTop) && nTop > 0) return nTop;
		return 0;
	};

	const buildScheduleEventTitle = (row: any): string => {
		const lines: string[] = [];
		const sd = row?.special_day;
		const hasSpecialDay = sd != null && sd !== '';

		if (hasSpecialDay && typeof sd === 'object') {
			const sdName = String((sd as { name?: string }).name || '').trim();
			if (sdName) lines.push(sdName);
			const shiftLines = shiftLabelsFromShiftsField((sd as { shifts?: unknown }).shifts);
			if (shiftLines.length) lines.push(...shiftLines);
		}

		const sched = row?.schedule;
		if (sched != null && sched !== '') {
			const scheduleName = deriveScheduleTitle(sched);
			if (scheduleName && !lines.includes(scheduleName)) lines.push(scheduleName);
			const shiftSource =
				typeof sched === 'object' && !Array.isArray(sched) ? (sched as { shifts?: unknown }).shifts : sched;
			const shiftLines = shiftLabelsFromShiftsField(shiftSource);
			if (shiftLines.length) lines.push(...shiftLines);
		}

		if (!lines.length) {
			const fallback = deriveShiftLabelFromRow(row);
			if (fallback) lines.push(fallback);
		}

		return lines.join('\n');
	};

	/** Group calendar day rows: scheduled / leave counts from `schedule_summary` (row or each `schedule[]` item). */
	const getGroupDayScheduleCounts = (row: any): { scheduled: number; leave: number } | null => {
		const pick = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
		const fromSummary = (sum: any): { sch: number; leave: number } | null => {
			if (!sum || typeof sum !== 'object') return null;
			const s = pick(sum.scheduled);
			const l = pick(sum.leave);
			if (s === null && l === null) return null;
			return { sch: s ?? 0, leave: l ?? 0 };
		};

		const top = fromSummary(row?.schedule_summary);
		if (top) {
			return { scheduled: top.sch, leave: top.leave };
		}

		if (!Array.isArray(row?.schedule)) return null;
		let sch = 0;
		let leave = 0;
		let found = false;
		for (const item of row.schedule) {
			const a = fromSummary(item?.schedule_summary);
			if (a) {
				sch += a.sch;
				leave += a.leave;
				found = true;
			}
		}
		if (!found) return null;
		return { scheduled: sch, leave };
	};

	const pushAttendanceDayEvents = (
		events: any[],
		row: any,
		d: Dayjs,
		calendarType: 'user' | 'group' | 'schedule',
	) => {
		const start = d.toDate();
		const end = d.endOf('day').toDate();
		if (isAttendanceDeleted(row)) {
			events.push({
				title: ATTENDANCE_REMOVED_META.label,
				start,
				end,
				color: ATTENDANCE_REMOVED_META.color,
				resource: { kind: 'status' as const, status: 'ATTENDANCE_REMOVED' },
			});
			return;
		}
		const dayStatus = resolveMainDayStatus(row);
		const statusMeta = getStatusMeta(dayStatus);
		if (!statusMeta) return;
		let title = statusMeta.label;
		const workedTime = getWorkedTimeFromAttendance(row?.attendance);
		if (workedTime) {
			title = `${title}\n${workedTime}`;
		}
		if (calendarType === 'group') {
			const counts = getGroupDayScheduleCounts(row);
			if (counts) {
				title = `${title}\nScheduled: ${counts.scheduled}\nOn leave: ${counts.leave}`;
			}
		}
		events.push({
			title,
			start,
			end,
			color: statusMeta.color,
			resource: { kind: 'status' as const, status: dayStatus },
		});
	};

	const SHIFT_EVENT_COLOR = '#495057';

	const pushShiftDayEvents = (events: any[], row: any, d: Dayjs) => {
		const shiftLabel = buildScheduleEventTitle(row);
		if (!shiftLabel) return;
		events.push({
			title: shiftLabel,
			start: d.toDate(),
			end: d.endOf('day').toDate(),
			color: SHIFT_EVENT_COLOR,
			resource: { kind: 'shift' as const },
		});
	};

	const pushLeaveDayEvents = (
		events: any[],
		row: any,
		d: Dayjs,
		ct: 'user' | 'group' | 'schedule',
	) => {
		const leaveRequests = Array.isArray(row?.leave_requests) ? row.leave_requests : [];
		const lines: string[] = [];

		if (ct === 'user') {
			const attStatus = resolveAttendanceStatus(row);
			const dayStatus = resolveMainDayStatus(row);
			const attMeta = getStatusMeta(attStatus);
			// Skip when attendance.status duplicates the day-level status (shown by Status event).
			const isDuplicateDayStatus =
				attStatus != null &&
				dayStatus != null &&
				normalizeStatusKey(attStatus) === normalizeStatusKey(dayStatus);
			if (attMeta && !isDuplicateDayStatus) {
				let label = attMeta.label;
				if (isAttendanceLate(row, ct)) label = `${label} (Late)`;
				lines.push(label);
			}
		}

		if (leaveRequests.length) {
			const requestLabels = leaveRequests
				.map((lr: any) => String(lr?.leave_type?.name || lr?.name || 'Leave').trim())
				.filter(Boolean);
			if (requestLabels.length) lines.push(requestLabels.join(', '));
		}

		const isLeaveDay = normalizeStatusKey(resolveMainDayStatus(row)) === 'LEAVE';
		if (isLeaveDay && !leaveRequests.length && !lines.length) {
			lines.push(getStatusMeta('LEAVE')?.label || 'On Leave');
		}

		if (ct !== 'user') {
			const dayStatus = resolveMainDayStatus(row);
			const isLeaveStatus = normalizeStatusKey(dayStatus) === 'LEAVE';
			if (!leaveRequests.length && !isLeaveStatus) return;
			if (!lines.length) {
				const statusMeta = getStatusMeta(dayStatus);
				lines.push(
					leaveRequests.length
						? leaveRequests
								.map((lr: any) => String(lr?.leave_type?.name || lr?.name || 'Leave').trim())
								.filter(Boolean)
								.join(', ')
						: statusMeta?.label || 'On Leave',
				);
			}
		}

		if (!lines.length) return;

		events.push({
			title: lines.join('\n'),
			start: d.toDate(),
			end: d.endOf('day').toDate(),
			color: LEAVE_EVENT_COLOR,
			resource: { kind: 'leave' as const },
		});
	};

	const pushOtDayEvents = (events: any[], row: any, d: Dayjs) => {
		const otPayload =
			row?.overtime ??
			row?.ot ??
			row?.ot_hours ??
			row?.overtime_hours ??
			row?.ot_summary ??
			null;
		const otMins = getOtMinutes(row);
		const hasDirectOt =
			otPayload != null &&
			otPayload !== '' &&
			!(Array.isArray(otPayload) && otPayload.length === 0);
		const hasOt = otMins > 0 || hasDirectOt;
		if (!hasOt) return;
		const title = otMins > 0 ? `OT ${otMins} min` : 'Overtime';
		events.push({
			title,
			start: d.toDate(),
			end: d.endOf('day').toDate(),
			color: OT_EVENT_COLOR,
			resource: { kind: 'ot' as const },
		});
	};

	const rowsFromCalendarResponse = (data: any): any[] => {
		if (Array.isArray(data?.days)) return data.days;
		if (Array.isArray(data?.results)) return data.results;
		return [];
	};

	const toDateParam = (d: Date) => {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	};

	const fetchCalendarDetail = async (date: Date) => {
		if (resolvedEntityId == null || resolvedEntityId === '') return null;
		const idParamKeyByType: Record<'user' | 'group' | 'schedule', string> = {
			user: 'user',
			group: 'group',
			schedule: 'schedule',
		};
		const idParamKey = idParamKeyByType[calendarType];
		const dateParam = toDateParam(date);
		setDetailLoadingDate(dateParam);
		try {
			const response = await authAxios.get('/api/hr/attendance/calendar-detail/', {
				params: {
					calendar_type: calendarType,
					[idParamKey]: resolvedEntityId,
					date: dateParam,
				},
			});
			return response?.data ?? null;
		} catch (error) {
			showErrorNotification(error);
			return null;
		} finally {
			setDetailLoadingDate(null);
		}
	};

	const handleDateClick = async (date: Date) => {
		if (!onDateClick) return;
		onDateClick(date, null, { loading: true });
		const detail = await fetchCalendarDetail(date);
		onDateClick(date, detail ?? null, { loading: false });
	};

	const pushEventsForTab = (
		events: any[],
		row: any,
		d: Dayjs,
		ct: 'user' | 'group' | 'schedule',
		tab: string,
	) => {
		if (tab === 'All' || tab === 'Status') {
			pushAttendanceDayEvents(events, row, d, ct);
		}
		if (tab === 'All' || tab === 'Schedule') {
			pushShiftDayEvents(events, row, d);
		}
		if (tab === 'All' || tab === 'Leave') {
			pushLeaveDayEvents(events, row, d, ct);
		}
		if (tab === 'All' || tab === 'OT') {
			pushOtDayEvents(events, row, d);
		}
	};

	const buildEvents = (rows: any[], ct: 'user' | 'group' | 'schedule') => {
		const events: any[] = [];

		rows.forEach((row) => {
			if (!isMatchingUser(row)) return;

			if (isAttendanceDayRow(row)) {
				const d = dayjs(row.date).startOf('day');
				if (!d.isValid()) return;
				if (d.isBefore(monthBounds.start, 'day') || d.isAfter(monthBounds.end, 'day')) return;
				pushEventsForTab(events, row, d, ct, effectiveTab);
				return;
			}

			const startDate = dayjs(row?.start_date);
			const endDate = dayjs(row?.end_date);
			const applicableDays: string[] = Array.isArray(row?.applicable_days) ? row.applicable_days : [];
			if (!startDate.isValid() || !endDate.isValid() || startDate.isAfter(endDate)) return;

			const eventStart = startDate.isAfter(monthBounds.start) ? startDate : monthBounds.start;
			const eventEnd = endDate.isBefore(monthBounds.end) ? endDate : monthBounds.end;

			let currentDate = eventStart;
			while (currentDate.isBefore(eventEnd) || currentDate.isSame(eventEnd, 'day')) {
				if (isApplicableDay(currentDate, applicableDays)) {
					pushEventsForTab(events, row, currentDate, ct, effectiveTab);
				}
				currentDate = currentDate.add(1, 'day');
			}
		});

		return events;
	};

	const calendarEvents = useMemo(
		() => buildEvents(calendarRows, calendarType),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[calendarRows, effectiveTab, monthBounds, calendarType],
	);

	useEffect(() => {
		if (resolvedEntityId == null || resolvedEntityId === '') {
			setCalendarRows([]);
			setLoading(false);
			if (!initialLoadNotifiedRef.current) {
				initialLoadNotifiedRef.current = true;
				onInitialLoadComplete?.();
			}
			return undefined;
		}
		let cancelled = false;
		setLoading(true);
		const year = selectedMonth.year();
		const month = selectedMonth.month() + 1;
		const idParamKeyByType: Record<'user' | 'group' | 'schedule', string> = {
			user: 'user',
			group: 'group',
			schedule: 'schedule',
		};
		const idParamKey = idParamKeyByType[calendarType];
		authAxios
			.get('/api/hr/attendance/calendar/', {
				params: {
					calendar_type: calendarType,
					[idParamKey]: resolvedEntityId,
					year,
					month,
				},
			})
			.then((response) => {
				if (cancelled) return;
				const rows = rowsFromCalendarResponse(response?.data);
				setCalendarRows(rows);
			})
			.catch((error) => {
				if (!cancelled) {
					showErrorNotification(error);
					setCalendarRows([]);
				}
			})
			.finally(() => {
				if (cancelled) return;
				setLoading(false);
				if (!initialLoadNotifiedRef.current) {
					initialLoadNotifiedRef.current = true;
					onInitialLoadComplete?.();
				}
			});
		return () => {
			cancelled = true;
		};
	}, [selectedYearMonth]);

	return (
		<div>
			{showTopControls && (
				<div className='d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3'>
					<div style={{ maxWidth: '280px' }}>
						<input
							type='month'
							value={selectedMonth.format('YYYY-MM')}
							onChange={(e) => {
								if (e.target.value) setSelectedMonth(dayjs(e.target.value));
							}}
							className='form-control'
						/>
					</div>
					{showViewFilter && (
						<div className='position-relative' style={{ minHeight: 42, minWidth: 280 }}>
							<ButtonFiltter
								FilterStatus={calendarFilterOptions}
								activeTab={activeTab}
								setActiveTab={setActiveTab}
								styles={{ position: 'relative', top: 'unset', left: 'unset' }}
							/>
						</div>
					)}
				</div>
			)}
			<div className='position-relative schedule-calendar' style={{ minHeight: height }}>
				{loading ? (
					hideLoadingIndicator ? (
						<div style={{ height }} aria-hidden />
					) : (
						<div
							className='d-flex justify-content-center align-items-center'
							style={{ minHeight: height }}>
							<CustomSpinner />
						</div>
					)
				) : (
					<CustomCalendar
						events={calendarEvents}
						date={selectedMonth.toDate()}
						height={height}
						onNavigate={(date) => setSelectedMonth(dayjs(date))}
						onDateClick={handleDateClick}
						eventPropGetter={(event: any) => {
							if (event?.resource?.kind === 'shift') {
								return {
									className: 'rbc-event--shift-card',
									style: {
										backgroundColor: 'transparent',
										border: 'none',
										boxShadow: 'none',
										padding: '2px 3px',
									},
								};
							}
							const accent = event?.color ?? SCHEDULE_EVENT_COLOR;
							return {
								style: calendarEventStyleFromColor(accent),
							};
						}}
					/>
				)}
				{detailLoadingDate && !onDateClick && (
					<div className='small text-muted mt-2'>Loading details for {detailLoadingDate}...</div>
				)}
			</div>
		</div>
	);
};

ReusableScheduleCalendar.defaultProps = {
	calendarType: 'user',
	entityId: undefined,
	userId: undefined,
	height: '85vh',
	hideLoadingIndicator: true,
};

export default ReusableScheduleCalendar;

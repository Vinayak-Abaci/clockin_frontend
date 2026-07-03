import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import Chip from '@mui/material/Chip';
import Select from 'react-select';
import Swal from 'sweetalert2';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../bootstrap/Modal';
import Button from '../../../bootstrap/Button';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BrowseGalleryIcon from '@mui/icons-material/BrowseGallery';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentIcon from '@mui/icons-material/Comment';
import { useSelector } from 'react-redux';
import AuthContext from '../../../../contexts/authContext';
import AcceptAndRejectButton from '../../../CustomComponent/Buttons/AcceptAndRejectButton';
import { authAxios, authAxiosFileUpload } from '../../../../axiosInstance';
import { buildLeaveRequestFormData } from '../../../../pages/LeaveManagement/LeaveRequest/AddLeaveRequest';
import LeaveRequestField from '../../../../pages/LeaveManagement/LeaveRequest/LeaveRequestField';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import useSelectStyles from '../../../../hooks/useSelectStyle';
import { buttonColor } from '../../../../helpers/constants';
import { buildLocalIsoTimestamp, toLocalOffsetIsoString } from '../../../../helpers/buildLocalIsoTimestamp';
import AttendanceEventsTimeline from './AttendanceEventsTimeline';
import {
	ATTENDANCE_REMOVED_META,
	attendanceDeletedByLine,
	isAttendanceDeleted,
} from '../../../../pages/Attendance/attendanceStatusUtils';
import {
	shiftLabelsFromShiftsField,
	summarizeShiftLabels,
} from '../../../../pages/Schedule/scheduleShiftUtils';

type UserCalendarDetailModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	selectedDate: Date | null;
	/** Target user id for the modal (used for PATCH operations like Change Schedule). */
	userId?: string | number | null;
	/** Response body from GET /api/hr/attendance/calendar-detail/ */
	detail: any | null;
	/** True while calendar-detail request is in flight */
	loading?: boolean;
	/** Notify parent that user data was updated so it can refresh. */
	onUserUpdated?: () => void;
};

type ModalTab = 'details' | 'events' | 'comments';

type CommandItem = {
	id: number;
	command: string;
	user: number;
	command_by?: number | Record<string, unknown> | string;
	schedule_date: string;
	command_datetime: string;
};

const formatCommandAuthor = (commandBy: unknown): string | null => {
	if (commandBy == null || commandBy === '') return null;
	if (typeof commandBy === 'string') {
		const s = commandBy.trim();
		return s || null;
	}
	if (typeof commandBy === 'number' && !Number.isNaN(commandBy)) {
		return `User #${commandBy}`;
	}
	if (typeof commandBy === 'object') {
		const o = commandBy as Record<string, unknown>;
		const first = String(o.first_name || '').trim();
		const last = String(o.last_name || '').trim();
		const full = [first, last].filter(Boolean).join(' ');
		if (full) return full;
		const email = String(o.email || '').trim();
		if (email) return email;
		if (o.id != null && o.id !== '') return `User #${o.id}`;
	}
	return null;
};

const MODAL_TABS: { id: ModalTab; label: string }[] = [
	{ id: 'details', label: 'Details' },
	{ id: 'events', label: 'Events' },
	{ id: 'comments', label: 'Comments' },
];

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

/** Display API day_type values (e.g. SPECIAL_SCHEDULE) without underscores, title-cased. */
const formatDayTypeLabel = (raw: unknown): string => {
	if (raw == null || raw === '') return '';
	const s = String(raw).replace(/_/g, ' ').trim();
	if (!s) return '';
	return s
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
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

const resolveMainDayStatus = (detail: any): string | undefined => {
	const dayStatus = detail?.status;
	return dayStatus != null && String(dayStatus).trim() !== '' ? String(dayStatus) : undefined;
};

const resolveAttendanceStatus = (detail: any): string | undefined => {
	const att = detail?.attendance;
	if (!att || typeof att !== 'object' || Array.isArray(att)) return undefined;
	const attStatus = att.status;
	return attStatus != null && String(attStatus).trim() !== '' ? String(attStatus) : undefined;
};

const formatShiftList = (raw: unknown): string => {
	if (raw == null) return '';
	if (typeof raw === 'string') return raw.trim();
	const fromMap = shiftLabelsFromShiftsField(raw);
	if (fromMap.length) return summarizeShiftLabels(fromMap, 2).replace(/\n/g, ', ');
	if (!Array.isArray(raw)) return '';
	const parts = raw
		.map((s) => {
			if (typeof s === 'string') return s.trim();
			if (s && typeof s === 'object') {
				const o = s as Record<string, unknown>;
				return String(
					o.full_name ||
					o.display_name ||
					o.name ||
					o.shift_name ||
					(o.shift_details as { name?: string })?.name ||
					(o.shift_details as { shift_name?: string })?.shift_name ||
					'',
				).trim();
			}
			return '';
		})
		.filter(Boolean);
	return parts.length ? parts.join(', ') : '';
};

const formatScheduleSourceLabel = (source: unknown): string => {
	const map: Record<string, string> = {
		USER: 'User Specific',
		GROUP: 'Group Specific',
	};

	return map[String(source || '').toUpperCase()] || 'Default';
};

const formatScheduleSummary = (schedule: any): string => {
	if (!schedule) return '';

	// HANDLE ARRAY
	if (Array.isArray(schedule)) {
		return schedule
			.map((item) => {
				const name = item?.name || 'Schedule';

				return `${name} • ${formatScheduleSourceLabel(
					item?.schedule_source,
				)}`;
			})
			.join(', ');
	}

	// HANDLE OBJECT
	const name = schedule?.name || 'Schedule';

	return `${name} • ${formatScheduleSourceLabel(
		schedule?.schedule_source,
	)}`;
};

const formatSpecialDayLines = (sd: unknown): string[] => {
	if (sd == null || sd === '') return [];
	if (Array.isArray(sd)) {
		const lines: string[] = [];
		for (const item of sd) {
			if (item != null && typeof item === 'object') {
				lines.push(...formatSpecialDayLines(item));
			} else if (item != null && item !== '') {
				lines.push(String(item));
			}
		}
		return lines.length ? lines : [];
	}
	if (typeof sd !== 'object') return [String(sd)];
	const o = sd as Record<string, unknown>;
	const lines: string[] = [];
	if (o.name != null) lines.push(String(o.name));
	if (o.day_type != null) lines.push(`Type: ${formatDayTypeLabel(o.day_type)}`);
	const shifts = formatShiftList(o.shifts);
	if (shifts) lines.push(`Shifts: ${shifts}`);
	return lines.length ? lines : ['—'];
};

const toYmd = (d: Date | null) => {
	if (!d) return '';
	return dayjs(d).format('YYYY-MM-DD');
};

const isOtAttendanceKey = (key: string) => /(^|_)(ot|overtime)($|_)/i.test(key);

const collectOtAttendanceEntries = (attendance: unknown): [string, unknown][] => {
	if (attendance == null || typeof attendance !== 'object' || Array.isArray(attendance)) return [];
	return Object.entries(attendance as Record<string, unknown>).filter(([k, v]) => {
		if (!isOtAttendanceKey(k)) return false;
		if (/ot_mins|ot_minutes|overtime_mins/i.test(k)) {
			const n = Number(v);
			return Number.isFinite(n) && n > 0;
		}
		return v != null && v !== '' && v !== 0;
	});
};

/** Supports plain array or paginated `{ results: [...] }` from `/api/hr/attendance/`. */
const attendanceRowsFromResponse = (res: any): any[] => {
	const d = res?.data;
	if (Array.isArray(d)) return d;
	if (d && Array.isArray(d.results)) return d.results;
	return [];
};

const attendanceRowUserId = (row: any): number | null => {
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

const pickAttendanceRowForUser = (
	rows: any[],
	userId: string | number | null | undefined,
): any | null => {
	if (!rows?.length) return null;
	const n = userId != null && userId !== '' ? Number(userId) : Number.NaN;
	if (!Number.isNaN(n)) {
		const hit = rows.find((r) => attendanceRowUserId(r) === n);
		if (hit) return hit;
	}
	return rows[0] ?? null;
};

/** Matches `AddEventForm` / attendance-events API: CLOCK_IN, CLOCK_OUT. */
const getSuggestedAttendanceEventType = (currentClockInStatus: string | null | undefined): 'CLOCK_IN' | 'CLOCK_OUT' => {
	const key = normalizeStatusKey(currentClockInStatus ?? undefined);
	if (key === 'CLOCK_IN') return 'CLOCK_OUT';
	if (key === 'CLOCK_OUT') return 'CLOCK_IN';
	return 'CLOCK_IN';
};

const eventTypeFromRecord = (eventType: unknown): 'CLOCK_IN' | 'CLOCK_OUT' => {
	const key = normalizeStatusKey(eventType != null ? String(eventType) : undefined);
	return key === 'CLOCK_OUT' ? 'CLOCK_OUT' : 'CLOCK_IN';
};

const promptAttendanceEventForm = async ({
	title,
	defaultDate,
	defaultTime,
	defaultEventType,
	confirmText = 'Submit',
}: {
	title: string;
	defaultDate: string;
	defaultTime: string;
	defaultEventType: 'CLOCK_IN' | 'CLOCK_OUT';
	confirmText?: string;
}): Promise<{ date: string; time: string; eventType: string } | null> => {
	const result = await Swal.fire({
		title,
		html: `
			<div class="d-flex flex-column gap-2 text-start">
				<label for="swal-attendance-date" class="small text-muted">Date</label>
				<input id="swal-attendance-date" type="date" class="swal2-input m-0" value="${defaultDate}" />
				<label for="swal-attendance-time" class="small text-muted mt-2">Time</label>
				<input id="swal-attendance-time" type="time" class="swal2-input m-0" value="${defaultTime}" />
				<label for="swal-attendance-event-type" class="small text-muted mt-2">Event type</label>
				<select id="swal-attendance-event-type" class="swal2-input m-0 form-select">
					<option value="CLOCK_IN" ${defaultEventType === 'CLOCK_IN' ? 'selected' : ''}>Clock in</option>
					<option value="CLOCK_OUT" ${defaultEventType === 'CLOCK_OUT' ? 'selected' : ''}>Clock out</option>
				</select>
			</div>
		`,
		showCancelButton: true,
		confirmButtonText: confirmText,
		cancelButtonText: 'Cancel',
		confirmButtonColor: buttonColor[1],
		cancelButtonColor: buttonColor[0],
		focusConfirm: false,
		preConfirm: () => {
			const dateInput = document.getElementById('swal-attendance-date') as HTMLInputElement | null;
			const timeInput = document.getElementById('swal-attendance-time') as HTMLInputElement | null;
			const typeSelect = document.getElementById('swal-attendance-event-type') as HTMLSelectElement | null;
			const date = dateInput?.value?.trim() ?? '';
			const time = timeInput?.value?.trim() ?? '';
			const eventType = typeSelect?.value?.trim() ?? '';
			if (!date || !time) {
				Swal.showValidationMessage('Please select both date and time.');
				return null;
			}
			if (!eventType) {
				Swal.showValidationMessage('Please select an event type.');
				return null;
			}
			if (eventType !== 'CLOCK_IN' && eventType !== 'CLOCK_OUT') {
				Swal.showValidationMessage('Invalid event type.');
				return null;
			}
			return { date, time, eventType };
		},
	});

	if (!result.isConfirmed || !result.value) {
		return null;
	}
	return result.value as { date: string; time: string; eventType: string };
};

const getUserDisplayName = (detail: any, userData: any, userId: string | number | null | undefined): string => {
	const directCandidates = [
		detail?.user_details?.name,
		detail?.user_details?.full_name,
		detail?.user_details?.preferred_name,
		detail?.user_details?.display_name,
		detail?.user?.name,
		detail?.user?.full_name,
		detail?.user?.preferred_name,
		detail?.name,
	]
		.map((v) => (v == null ? '' : String(v).trim()))
		.filter(Boolean);
	if (directCandidates.length > 0) return directCandidates[0];

	const fullNameParts = [
		detail?.user_details?.first_name,
		detail?.user_details?.last_name,
		detail?.user?.first_name,
		detail?.user?.last_name,
	]
		.map((v) => (v == null ? '' : String(v).trim()))
		.filter(Boolean);
	if (fullNameParts.length >= 2) return `${fullNameParts[0]} ${fullNameParts[1]}`;

	if (Number(userData?.id) === Number(userId)) {
		const me =
			[userData?.preferred_name, userData?.first_name, userData?.last_name]
				.map((v: unknown) => (v == null ? '' : String(v).trim()))
				.filter(Boolean)
				.join(' ') || userData?.name || userData?.email;
		if (me && String(me).trim()) return String(me).trim();
	}

	if (userId != null && String(userId).trim() !== '') return `User ${userId}`;
	return 'User';
};

const renderOtEligibleChip = (otEligible: unknown) => {
	if (otEligible == null) return null;
	if (otEligible === true || otEligible === 'true' || otEligible === 1 || otEligible === '1') {
		return (
			<Chip
				label='OT eligible'
				size='small'
				sx={{ fontWeight: 700, bgcolor: '#e8f7ee', color: '#198754' }}
			/>
		);
	}
	return (
		<Chip
			label='OT not eligible'
			size='small'
			variant='outlined'
			sx={{ fontWeight: 700, borderColor: '#ced4da', color: '#6c757d' }}
		/>
	);
};

const UserCalendarDetailModal = ({
	isOpen,
	setIsOpen,
	selectedDate,
	userId,
	detail,
	loading = false,
	onUserUpdated,
}: UserCalendarDetailModalProps) => {
	const dateLabel = useMemo(() => {
		if (!selectedDate) return '—';
		return dayjs(selectedDate).format('dddd, MMMM D, YYYY');
	}, [selectedDate]);

	const { userData } = useContext(AuthContext);
	const apiDate = detail?.date != null ? String(detail.date).slice(0, 10) : toYmd(selectedDate);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle === 'Self' ? 'Self' : 'Admin';
	const isAdmin = userData?.user_type === 'Admin' && mode === 'Admin';
	const canPunchClock =
		userId != null &&
		userId !== '' &&
		(isAdmin || Number(userData?.id) === Number(userId));
	const isFutureDay = useMemo(() => {
		if (!apiDate) return false;
		return dayjs(apiDate).startOf('day').isAfter(dayjs().startOf('day'));
	}, [apiDate]);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const reactSelectStyle = useSelectStyles(false);

	const attendanceDeleted = isAttendanceDeleted(detail);
	const mainDayStatus = resolveMainDayStatus(detail);
	const attendanceDayStatus = resolveAttendanceStatus(detail);
	const statusMeta = attendanceDeleted
		? ATTENDANCE_REMOVED_META
		: getStatusMeta(mainDayStatus);
	const attendanceStatusMeta = attendanceDeleted ? null : getStatusMeta(attendanceDayStatus);
	const isLate =
		!attendanceDeleted &&
		Boolean(
			detail?.attendance &&
				typeof detail.attendance === 'object' &&
				!Array.isArray(detail.attendance) &&
				detail.attendance.is_late,
		);
	const statusLabel = attendanceDeleted
		? ATTENDANCE_REMOVED_META.label
		: statusMeta?.label ?? '—';
	const attendanceStatusLabel = attendanceStatusMeta?.label
		? isLate
			? `${attendanceStatusMeta.label} (Late)`
			: attendanceStatusMeta.label
		: null;
	const scheduleShiftText = useMemo(() => {
		const sched = detail?.schedule;
		if (sched == null || typeof sched !== 'object' || Array.isArray(sched)) return '';
		return formatShiftList((sched as { shifts?: unknown }).shifts);
	}, [detail?.schedule]);
	const attendanceDeletedNote = attendanceDeletedByLine(detail);
	const canManageAttendance = canPunchClock && !attendanceDeleted;
	const userDisplayName = useMemo(
		() => getUserDisplayName(detail, userData, userId),
		[detail, userData, userId],
	);

	const scheduleText = formatScheduleSummary(detail?.schedule);
	const specialLines = formatSpecialDayLines(detail?.special_day);
	const scheduleObj = detail?.schedule != null && typeof detail.schedule === 'object' && !Array.isArray(detail.schedule) ? detail.schedule : null;

	const leaveList = Array.isArray(detail?.leave_requests) ? detail.leave_requests : [];

	const otMinutes = useMemo(() => {
		const att = detail?.attendance;
		if (!att || typeof att !== 'object' || Array.isArray(att)) return 0;
		const n = Number(att.ot_mins ?? att.ot_minutes ?? att.overtime_mins);
		return Number.isFinite(n) && n > 0 ? n : 0;
	}, [detail?.attendance]);
	const otAttendanceEntries = collectOtAttendanceEntries(detail?.attendance);
	const directOtPayload =
		detail?.overtime ??
		detail?.ot ??
		detail?.ot_hours ??
		detail?.overtime_hours ??
		detail?.ot_summary ??
		null;

	const [scheduleEditMode, setScheduleEditMode] = useState(false);
	const [scheduleOptions, setScheduleOptions] = useState<{ label: string; value: number }[]>([]);
	const [scheduleOptionsLoading, setScheduleOptionsLoading] = useState(false);
	const [attendanceLoading, setAttendanceLoading] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
	const [attendanceEvents, setAttendanceEvents] = useState<any[]>([]);
	const [clockActionLoading, setClockActionLoading] = useState(false);
	const [selectedScheduleOption, setSelectedScheduleOption] = useState<
		{ label: string; value: number } | null
	>(null);
	const [scheduleSaving, setScheduleSaving] = useState(false);
	const [leaveApplyMode, setLeaveApplyMode] = useState(false);
	const [leaveApplySaving, setLeaveApplySaving] = useState(false);
	const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
	const [leaveTypeOptions, setLeaveTypeOptions] = useState<{ label: string; value: number }[]>([]);

	const {
		register: leaveRegister,
		handleSubmit: handleLeaveSubmit,
		control: leaveControl,
		getValues: leaveGetValues,
		setValue: leaveSetValue,
		watch: leaveWatch,
		reset: leaveReset,
		formState: { errors: leaveErrors },
	} = useForm({
		defaultValues: {
			leave_type: null as { label: string; value: number } | null,
			from_date: '',
			to_date: '',
			from_session: null as { label: string; value: string } | null,
			to_session: null as { label: string; value: string } | null,
			reason: '',
		},
	});

	const canApplyLeave =
		!attendanceDeleted &&
		Boolean(userId) &&
		Boolean(apiDate) &&
		(isAdmin || Number(userData?.id) === Number(userId));

	const close = () => setIsOpen(false);

	useEffect(() => {
		if (!isOpen) {
			setLeaveApplyMode(false);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!leaveApplyMode || !isOpen) return undefined;
		let cancelled = false;
		setLeaveTypesLoading(true);
		authAxios
			.get('/api/hr/leave-types/?paginate=off')
			.then((res) => {
				if (cancelled) return;
				const list = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				setLeaveTypeOptions(
					list.map((item: any) => ({
						label: item?.name || item?.code || `Leave Type ${item?.id}`,
						value: item?.id,
					})),
				);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setLeaveTypesLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [leaveApplyMode]);

	const openLeaveApply = () => {
		const day = apiDate || dayjs().format('YYYY-MM-DD');
		leaveReset({
			leave_type: null,
			from_date: day,
			to_date: day,
			from_session: { label: 'FULL', value: 'FULL' },
			to_session: { label: 'FULL', value: 'FULL' },
			reason: '',
		});
		setLeaveApplyMode(true);
	};

	const submitLeaveApplication = (data: any) => {
		if (!userId) {
			showErrorNotification('Missing user id');
			return;
		}
		setLeaveApplySaving(true);
		const formData = buildLeaveRequestFormData(data);
		const targetUserId = Number(userId);
		const isForOtherUser =
			!Number.isNaN(targetUserId) && Number(userData?.id) !== targetUserId;
		if (isForOtherUser) {
			formData.append('user', String(targetUserId));
		}
		authAxiosFileUpload
			.post('/api/hr/leave-requests/', formData)
			.then(() => {
				showSuccessNotification('Leave request submitted');
				setLeaveApplyMode(false);
				onUserUpdated?.();
			})
			.catch(showErrorNotification)
			.finally(() => setLeaveApplySaving(false));
	};

	const [specialPeriodsList, setSpecialPeriodsList] = useState<any[]>([]);
	const [specialPeriodsLoading, setSpecialPeriodsLoading] = useState(false);

	const [activeTab, setActiveTab] = useState<ModalTab>('details');
	const [commands, setCommands] = useState<CommandItem[]>([]);
	const [commandsLoading, setCommandsLoading] = useState(false);
	const [commentText, setCommentText] = useState('');
	const [commentSaving, setCommentSaving] = useState(false);

	const currentScheduleId = useMemo(() => {
		const s = detail?.schedule;
		if (s != null && typeof s === 'object' && !Array.isArray(s)) {
			const id = (s as any)?.id ?? (s as any)?.pk;
			return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
		}
		if (Array.isArray(s) && s.length > 0) {
			const first = s[0] as any;
			const id = first?.id ?? first?.pk ?? first?.schedule_id;
			if (id != null && !Number.isNaN(Number(id))) return Number(id);
		}
		return null;
	}, [detail?.schedule]);

	useEffect(() => {
		if (!isOpen || !apiDate) return undefined;
		let cancelled = false;
		setSpecialPeriodsLoading(true);
		authAxios
			.get('api/hr/special-periods/', { params: { date: apiDate, paginate: 'off' } })
			.then((res: any) => {
				if (cancelled) return;
				const raw = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				setSpecialPeriodsList(raw);
			})
			.catch((err: any) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setSpecialPeriodsLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, apiDate]);

	useEffect(() => {
		if (!scheduleEditMode) return undefined;
		let cancelled = false;
		setScheduleOptionsLoading(true);
		authAxios
			.get(`api/hr/schedules/?paginate=off&date=${apiDate}`)
			.then((res: any) => {
				if (cancelled) return;
				const raw = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				const opts = raw.map((item: any) => ({
					label: item?.name || `Schedule ${item?.id}`,
					value: Number(item?.id),
				}));
				setScheduleOptions(opts);
				if (currentScheduleId != null) {
					const match = opts.find(
						(o: any) => Number(o.value) === Number(currentScheduleId),
					);
					if (match) setSelectedScheduleOption(match);
				}
			})
			.catch((err: any) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setScheduleOptionsLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scheduleEditMode]);

	useEffect(() => {
		if (!isOpen) {
			setScheduleEditMode(false);
			setSelectedScheduleOption(null);
			setScheduleSaving(false);
			setSpecialPeriodsList([]);
			setSelectedStatus(null);
			setAttendanceEvents([]);
			setClockActionLoading(false);
			setActiveTab('details');
			setCommands([]);
			setCommentText('');
			setCommentSaving(false);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || activeTab !== 'comments' || !userId || !apiDate) return undefined;
		let cancelled = false;
		setCommandsLoading(true);
		authAxios
			.get('api/hr/commands/', { params: { user: userId, date: apiDate } })
			.then((res: any) => {
				if (cancelled) return;
				const raw = res?.data;
				const list = Array.isArray(raw) ? raw : raw?.results || [];
				setCommands(list);
			})
			.catch((err: any) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setCommandsLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, activeTab, userId, apiDate]);

	const handleScheduleSave = () => {
		if (userId == null || userId === '') {
			showErrorNotification('Missing user id');
			return;
		}
		if (selectedScheduleOption?.value == null) {
			showErrorNotification('Please select a schedule');
			return;
		}
		setScheduleSaving(true);
		authAxios
			.patch(`api/hr/accounts/${userId}/`, {
				schedules: [Number(selectedScheduleOption.value)],
			})
			.then(() => {
				showSuccessNotification('Schedule updated');
				onUserUpdated?.();
			})
			.catch((err) => {
				showErrorNotification(err);
			})
			.finally(() => {
				setScheduleSaving(false);
			});
	};

	const hasOtScheduleFlag = scheduleObj && 'ot_eligible' in scheduleObj;
	const hasDirectOt = directOtPayload != null && directOtPayload !== '';
	const hasOtAttendance = otMinutes > 0 || otAttendanceEntries.length > 0;
	const showOtEmpty = !hasOtScheduleFlag && !hasDirectOt && !hasOtAttendance;
	const otEntries = useMemo(() => {
		if (!hasDirectOt) return [];
		return Array.isArray(directOtPayload) ? directOtPayload : [directOtPayload];
	}, [directOtPayload, hasDirectOt]);

	const pickOtRequestId = (payload: any): number | null => {
		const candidates = [payload?.id, payload?.pk, payload?.overtime_id, payload?.request_id];
		for (const candidate of candidates) {
			const n = Number(candidate);
			if (!Number.isNaN(n)) return n;
		}
		return null;
	};

	useEffect(() => {
		if (!isOpen || !apiDate || !userId) return;

		let cancelled = false;

		setAttendanceLoading(true);

		authAxios
			.get(`/api/hr/attendance/?date=${apiDate}&user=${userId}&paginate=off`)
			.then((res: any) => {
				if (cancelled) return;

				const list = attendanceRowsFromResponse(res);
				const matchedAttendance = pickAttendanceRowForUser(list, userId);

				const rawClock = matchedAttendance?.current_clockin_status;
				setSelectedStatus(
					rawClock != null && String(rawClock).trim() !== '' ? String(rawClock) : null,
				);
				setAttendanceEvents(
					Array.isArray(matchedAttendance?.events) ? matchedAttendance.events : [],
				);
			})
			.catch((err) => {
				if (!cancelled) {
					showErrorNotification(err);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setAttendanceLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, apiDate, userId]);

	const isClockedIn = normalizeStatusKey(selectedStatus ?? undefined) === 'CLOCK_IN';

	const refreshAttendanceForDay = async () => {
		if (!apiDate || !userId) return;
		const res = await authAxios.get(`/api/hr/attendance/?date=${apiDate}&user=${userId}&paginate=off`);
		const list = attendanceRowsFromResponse(res);
		const row = pickAttendanceRowForUser(list, userId);
		const rawClock = row?.current_clockin_status;
		setSelectedStatus(
			rawClock != null && String(rawClock).trim() !== '' ? String(rawClock) : null,
		);
		setAttendanceEvents(Array.isArray(row?.events) ? row.events : []);
	};

	const handleAttendanceEventPunch = async () => {
		if (!canManageAttendance || !userId || isFutureDay) return;
		setClockActionLoading(true);
		try {
			await authAxios.post('/api/hr/attendance-events/', {
				timestamp: toLocalOffsetIsoString(new Date()),
				user: Number(userId),
				event_type: isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN',
			});
			showSuccessNotification(isClockedIn ? 'Clock out recorded.' : 'Clock in recorded.');
			await refreshAttendanceForDay();
			onUserUpdated?.();
		} catch (e) {
			showErrorNotification(e);
		} finally {
			setClockActionLoading(false);
		}
	};

	const handleMarkAttendanceEvent = async () => {
		if (!canManageAttendance || !userId || isFutureDay) return;
		const form = await promptAttendanceEventForm({
			title: 'Mark attendance event',
			defaultDate: apiDate || dayjs().format('YYYY-MM-DD'),
			defaultTime: dayjs().format('HH:mm'),
			defaultEventType: getSuggestedAttendanceEventType(selectedStatus),
		});
		if (!form) return;

		setClockActionLoading(true);
		try {
			await authAxios.post('/api/hr/attendance-events/', {
				timestamp: buildLocalIsoTimestamp(form.date, form.time),
				user: Number(userId),
				event_type: form.eventType,
			});
			showSuccessNotification('Attendance event marked.');
			await refreshAttendanceForDay();
			onUserUpdated?.();
		} catch (e) {
			showErrorNotification(e);
		} finally {
			setClockActionLoading(false);
		}
	};

	const handleEditAttendanceEvent = async (event: any) => {
		if (!canManageAttendance || !userId || isFutureDay) return;
		const eventId = event?.id;
		if (eventId == null) {
			showErrorNotification('Cannot edit this event');
			return;
		}
		const ts = event?.timestamp ? dayjs(event.timestamp) : dayjs(apiDate || undefined);
		const form = await promptAttendanceEventForm({
			title: 'Edit attendance event',
			defaultDate: ts.isValid() ? ts.format('YYYY-MM-DD') : apiDate || dayjs().format('YYYY-MM-DD'),
			defaultTime: ts.isValid() ? ts.format('HH:mm') : dayjs().format('HH:mm'),
			defaultEventType: eventTypeFromRecord(event?.event_type),
			confirmText: 'Save',
		});
		if (!form) return;

		setClockActionLoading(true);
		try {
			await authAxios.patch(`/api/hr/attendance-events/${eventId}/`, {
				timestamp: buildLocalIsoTimestamp(form.date, form.time),
				user: Number(userId),
				event_type: form.eventType,
			});
			showSuccessNotification('Attendance event updated.');
			await refreshAttendanceForDay();
			onUserUpdated?.();
		} catch (e) {
			showErrorNotification(e);
		} finally {
			setClockActionLoading(false);
		}
	};

	const handleDeleteAttendanceEvent = async (event: any) => {
		if (!canManageAttendance || isFutureDay) return;
		const eventId = event?.id;
		if (eventId == null) {
			showErrorNotification('Cannot delete this event');
			return;
		}
		const result = await Swal.fire({
			title: 'Delete attendance event?',
			text: 'This event will be removed permanently.',
			icon: 'warning',
			showCancelButton: true,
			iconColor: buttonColor[0],
			confirmButtonColor: buttonColor[0],
			cancelButtonColor: buttonColor[1],
			confirmButtonText: 'Delete',
		});
		if (!result.isConfirmed) return;

		setClockActionLoading(true);
		try {
			await authAxios.delete(`/api/hr/attendance-events/${eventId}/`);
			showSuccessNotification('Attendance event deleted.');
			await refreshAttendanceForDay();
			onUserUpdated?.();
		} catch (e) {
			showErrorNotification(e);
		} finally {
			setClockActionLoading(false);
		}
	};

	const clockChipLabel =
		selectedStatus != null && String(selectedStatus).trim() !== ''
			? String(selectedStatus).replace(/_/g, ' ')
			: 'Not available';

	const fetchCommands = () => {
		if (!userId || !apiDate) return Promise.resolve();
		return authAxios
			.get('api/hr/commands/', { params: { user: userId, date: apiDate } })
			.then((res: any) => {
				const raw = res?.data;
				const list = Array.isArray(raw) ? raw : raw?.results || [];
				setCommands(list);
			});
	};

	const handleAddComment = () => {
		const text = commentText.trim();
		if (!text) {
			showErrorNotification('Enter a comment');
			return;
		}
		if (!userId || !apiDate) {
			showErrorNotification('Missing user or date');
			return;
		}
		setCommentSaving(true);
		authAxios
			.post('api/hr/commands/', {
				command: text,
				user: Number(userId),
				schedule_date: apiDate,
			})
			.then(() => {
				showSuccessNotification('Comment added');
				setCommentText('');
				return fetchCommands();
			})
			.catch(showErrorNotification)
			.finally(() => setCommentSaving(false));
	};

	const formatSpecialPeriodLabel = (sp: any) =>
		sp?.name || sp?.title || sp?.label || (sp?.id != null ? `Period ${sp.id}` : 'Special period');

	const leaveApplyModalTitle = apiDate
		? `Apply for leave — ${dayjs(apiDate).format('MMM D, YYYY')}`
		: 'Apply for leave';

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				size='lg'
				isScrollable
				isCentered
				isStaticBackdrop>
			<ModalHeader className='p-0 user-calendar-day-modal-header' setIsOpen={setIsOpen}>
				<div className='w-100'>
					<div className='px-4 pt-4 pb-1 pe-5'>
						<ModalTitle id='user-calendar-day-modal'>
							<div className='text-warning fw-semibold fs-5'>{dateLabel}</div>
							<div className='text-muted small fw-normal mt-1'>{userDisplayName}</div>
						</ModalTitle>
					</div>
					<div className='d-flex w-100 gap-2 px-4 pb-3 mt-3' role='tablist'>
						{MODAL_TABS.map((tab) => (
							<Button
								key={tab.id}
								className='flex-fill calendar-day-modal-tab-btn'
								color='warning'
								isLight={activeTab !== tab.id}
								role='tab'
								aria-selected={activeTab === tab.id}
								onClick={() => setActiveTab(tab.id)}>
								{tab.label}
							</Button>
						))}
					</div>
				</div>
			</ModalHeader>
			<ModalBody className='px-4 pb-4 pt-3'>
				{loading ? (
					<div className='d-flex flex-column align-items-center justify-content-center gap-3 py-5'>
						<CustomSpinner />
						<div className='text-muted small'>Loading day details…</div>
					</div>
				) : (
					<>
						{activeTab === 'details' && (
							<>
								<div className='d-flex justify-content-between align-items-center px-3 py-2 mb-3 rounded-3 user-calendar-day-status-bar'>
									<div className='w-100 d-flex align-items-center gap-2 justify-content-between'>
										<div className='d-flex-col align-items-center gap-4 justify-content-between'>
											<div className='d-flex align-items-center gap-2'>
												<span className='text-muted small'>Status:</span>
												<Chip
													label={statusLabel || 'Not Available'}
													size='small'
													sx={{
														fontWeight: 700,
														bgcolor: `${statusMeta?.color ?? '#6c757d'}22`,
														color: statusMeta?.color ?? '#495057',
													}}
												/>
											</div>
											<div className='fw-semibold mt-2'>
												{scheduleText || 'Schedule not found'}
											</div>
											{scheduleShiftText ? (
												<div className='small text-muted mt-1'>{scheduleShiftText}</div>
											) : null}
											{attendanceDeletedNote && (
												<div className='small text-muted fst-italic mt-1'>
													{attendanceDeletedNote}
												</div>
											)}
										</div>
										<div className='d-flex align-items-center gap-2'>
											<span className='text-muted small'>Current Status:</span>
											<Chip
												label={attendanceDeleted ? '—' : clockChipLabel}
												size='small'
												color={attendanceDeleted ? 'default' : isClockedIn ? 'success' : 'default'}
												sx={{ fontWeight: 700 }}
											/>
											{canManageAttendance && (
												<Button
													size='sm'
													color='secondary'
													isLight
													isDisable={
														attendanceLoading || clockActionLoading || isFutureDay
													}
													onClick={handleAttendanceEventPunch}>
													{clockActionLoading
														? 'Saving…'
														: isClockedIn
															? 'Clock out'
															: 'Clock in'}
												</Button>
											)}
										</div>
									</div>
								</div>

								<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel mb-3'>
									<div className='d-flex justify-content-between align-items-start mb-2'>
										<div className='fw-semibold text-warning d-flex align-items-center gap-1'>
											<CalendarTodayIcon fontSize='small' />
											Schedule
										</div>
										{isAdmin && !scheduleEditMode && !attendanceDeleted && (
											<Button
												size='sm'
												color='secondary'
												isLight
												onClick={() => setScheduleEditMode(true)}>
												Change schedule
											</Button>
										)}
									</div>
									{scheduleEditMode ? (
										<>
											<Select
												styles={reactSelectStyle}
												options={scheduleOptions}
												value={selectedScheduleOption}
												onChange={(opt: any) => setSelectedScheduleOption(opt)}
												isLoading={scheduleOptionsLoading}
												isClearable
												placeholder='Select a schedule…'
											/>
											<div className='d-flex gap-2 mt-3 justify-content-end'>
												<Button
													size='sm'
													color='dark'
													isLight
													isDisable={scheduleSaving}
													onClick={() => {
														setScheduleEditMode(false);
														setSelectedScheduleOption(null);
													}}>
													Cancel
												</Button>
												<Button
													size='sm'
													color='warning'
													isDisable={scheduleSaving || scheduleOptionsLoading}
													onClick={handleScheduleSave}>
													{scheduleSaving ? 'Saving…' : 'Save'}
												</Button>
											</div>
										</>
									) : (
										<>
											<div className='text-muted small'>{scheduleText || 'Schedule not found'}</div>
											{scheduleShiftText ? (
												<div className='small text-muted mt-2'>{scheduleShiftText}</div>
											) : null}
										</>
									)}
								</div>

								{specialLines.length > 0 && (
									<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel mb-3'>
										<div className='fw-semibold text-warning mb-2 d-flex align-items-center gap-1'>
											<BrowseGalleryIcon fontSize='small' />
											Special day
										</div>
										{specialLines.map((line) => (
											<div key={line} className='small text-muted'>
												{line}
											</div>
										))}
									</div>
								)}

								<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel mb-3'>
									<div className='fw-semibold text-warning mb-2'>Special periods</div>
									{specialPeriodsLoading ? (
										<div className='text-muted small'>Loading…</div>
									) : specialPeriodsList.length ? (
										<ul className='ps-3 mb-0 small'>
											{specialPeriodsList.map((sp: any) => (
												<li key={sp?.id ?? formatSpecialPeriodLabel(sp)} className='mb-1'>
													{formatSpecialPeriodLabel(sp)}
												</li>
											))}
										</ul>
									) : (
										<div className='text-muted small'>No special periods on this day</div>
									)}
								</div>

								<div className='row g-3'>
									<div className='col-12 col-md-6'>
										<div className='p-3 rounded-3 border h-100 shadow-sm user-calendar-day-panel'>
											<div className='d-flex justify-content-between align-items-center mb-2'>
												<div className='fw-semibold text-warning'>
													<HistoryToggleOffIcon fontSize='small' /> Leave
												</div>
												{canApplyLeave && (
													<Button
														size='sm'
														color='secondary'
														isLight
														onClick={openLeaveApply}>
														+ Apply
													</Button>
												)}
											</div>
											{attendanceStatusLabel ? (
												<div className='d-flex align-items-center gap-2 mb-2'>
													<span className='text-muted small'>Attendance:</span>
													<Chip
														label={attendanceStatusLabel}
														size='small'
														sx={{
															fontWeight: 700,
															bgcolor: `${attendanceStatusMeta?.color ?? '#6c757d'}22`,
															color: attendanceStatusMeta?.color ?? '#495057',
														}}
													/>
												</div>
											) : null}
											{leaveList.length ? (
												<ul className='ps-3 mb-0 mt-2'>
													{leaveList.map((lr: any) => (
														<li key={lr?.id} className='mb-2'>
															<div className='d-flex justify-content-between align-items-start gap-2'>
																<div>
																	<div className='fw-semibold'>
																		{lr?.leave_type?.name || 'Leave'}
																	</div>
																	<div className='text-muted small'>
																		{lr?.from_date} → {lr?.to_date}
																	</div>
																</div>
																{isAdmin && lr?.id != null && (
																	<AcceptAndRejectButton
																		id={lr.id}
																		tableRef={null}
																		url='api/hr/leave-requests/'
																	/>
																)}
															</div>
														</li>
													))}
												</ul>
											) : !attendanceStatusLabel ? (
												<div className='text-muted small'>No leave on this day</div>
											) : null}
										</div>
									</div>

									<div className='col-12 col-md-6'>
										<div className='p-3 rounded-3 border h-100 shadow-sm user-calendar-day-panel'>
											<div className='fw-semibold text-warning mb-2'>
												<AccessTimeIcon fontSize='small' /> Overtime
											</div>
											{otMinutes > 0 && (
												<div className='small mb-2'>
													<span className='fw-semibold'>Recorded OT:</span> {otMinutes} min
												</div>
											)}
											{hasOtScheduleFlag && (
												<div className='mb-2'>
													{renderOtEligibleChip(scheduleObj?.ot_eligible)}
												</div>
											)}
											{hasDirectOt ? (
												<div className='small d-flex flex-column gap-2'>
													{otEntries.map((otItem: any, idx: number) => {
														const otRequestId = pickOtRequestId(otItem);
														const itemKey =
															otRequestId != null
																? String(otRequestId)
																: `ot-${idx}-${Object.keys(otItem || {}).join('-')}`;
														return (
															<div key={itemKey} className='border rounded-2 p-2'>
																{Object.entries(otItem || {}).map(([k, v]) => (
																	<div
																		key={`${itemKey}-${k}`}
																		className='d-flex justify-content-between'>
																		<span className='text-muted'>{k}</span>
																		<span>{String(v)}</span>
																	</div>
																))}
																{isAdmin && otRequestId != null && (
																	<div className='d-flex justify-content-end mt-2'>
																		<AcceptAndRejectButton
																			id={otRequestId}
																			tableRef={null}
																			url='api/hr/overtime/'
																		/>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											) : showOtEmpty ? (
												<span className='text-muted small'>No OT data</span>
											) : (
												<div className='small d-flex flex-column gap-1'>
													{otAttendanceEntries.map(([k, v]) => (
														<div key={k} className='d-flex justify-content-between'>
															<span className='text-muted'>{k}</span>
															<span>{String(v)}</span>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								</div>
							</>
						)}

						{activeTab === 'events' && (
							<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel'>
								<div className='d-flex justify-content-between align-items-center mb-2'>
									<div className='fw-semibold text-warning d-flex align-items-center gap-1'>
										<AccessTimeIcon fontSize='small' />
										Attendance events
									</div>
									{canManageAttendance && (
										<Button
											size='sm'
											color='secondary'
											isLight
											isDisable={attendanceLoading || clockActionLoading || isFutureDay}
											onClick={handleMarkAttendanceEvent}>
											Mark event
										</Button>
									)}
								</div>
								{attendanceDeleted && (
									<p className='small text-muted mb-2 fst-italic'>
										{attendanceDeletedNote || ATTENDANCE_REMOVED_META.label}
									</p>
								)}
								{attendanceLoading ? (
									<div className='text-muted small'>Loading events…</div>
								) : attendanceEvents.length === 0 ? (
									<div className='text-muted small'>No clock events for this day.</div>
								) : (
									<AttendanceEventsTimeline
										events={attendanceEvents}
										maxHeight='min(24rem, 50vh)'
										showActions={canManageAttendance}
										actionDisabled={attendanceLoading || clockActionLoading || isFutureDay}
										onEdit={handleEditAttendanceEvent}
										onDelete={handleDeleteAttendanceEvent}
									/>
								)}
							</div>
						)}

						{activeTab === 'comments' && (
							<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel'>
								<div className='fw-semibold text-warning mb-3 d-flex align-items-center gap-1'>
									<CommentIcon fontSize='small' />
									Comments
								</div>
								{commandsLoading ? (
									<div className='d-flex justify-content-center py-4'>
										<CustomSpinner />
									</div>
								) : commands.length === 0 ? (
									<div className='text-muted small mb-3'>No comments for this day.</div>
								) : (
									<ul className='list-unstyled mb-3 d-flex flex-column gap-2'>
										{commands.map((cmd) => {
											const authorLabel = formatCommandAuthor(cmd.command_by);
											return (
												<li
													key={cmd.id}
													className='border rounded-2 p-3 user-calendar-day-comment-item'>
													<div className='fw-semibold'>{cmd.command}</div>
													<div className='text-muted small mt-1'>
														{cmd.command_datetime
															? dayjs(cmd.command_datetime).format('MMM D, YYYY h:mm A')
															: '—'}
														{authorLabel && (
															<span className='ms-2'>· By {authorLabel}</span>
														)}
													</div>
												</li>
											);
										})}
									</ul>
								)}
								{isAdmin && (
									<>
										<label className='form-label small fw-semibold mb-1' htmlFor='calendar-comment'>
											Add comment
										</label>
										<textarea
											id='calendar-comment'
											className='form-control mb-2'
											rows={3}
											value={commentText}
											placeholder='e.g. Mark leave for tomorrow'
											onChange={(e) => setCommentText(e.target.value)}
										/>
										<div className='d-flex justify-content-end'>
											<Button
												size='sm'
												color='warning'
												isDisable={commentSaving || !commentText.trim()}
												onClick={handleAddComment}>
												{commentSaving ? 'Saving…' : 'Add comment'}
											</Button>
										</div>
									</>
								)}
							</div>
						)}
					</>
				)}
			</ModalBody>
			<ModalFooter className='px-4 pb-4'>
				<Button color='dark' isLight onClick={close}>
					Close
				</Button>
			</ModalFooter>
			</Modal>

			<Modal
				isOpen={leaveApplyMode}
				setIsOpen={setLeaveApplyMode}
				size='lg'
				isScrollable
				isCentered>
				<ModalHeader className='p-4' setIsOpen={setLeaveApplyMode}>
					<ModalTitle id='user-calendar-leave-apply'>{leaveApplyModalTitle}</ModalTitle>
				</ModalHeader>
				<ModalBody className='px-4 pb-2'>
					{leaveTypesLoading ? (
						<CustomSpinner />
					) : (
						<form id='user-calendar-leave-apply-form' onSubmit={handleLeaveSubmit(submitLeaveApplication)}>
							<LeaveRequestField
								register={leaveRegister}
								errors={leaveErrors}
								control={leaveControl}
								getValues={leaveGetValues}
								setValue={leaveSetValue}
								watch={leaveWatch}
								leaveTypeOptions={leaveTypeOptions}
							/>
						</form>
					)}
				</ModalBody>
				<ModalFooter className='px-4 pb-4'>
					<Button
						color='secondary'
						isLight
						isDisable={leaveApplySaving}
						onClick={() => setLeaveApplyMode(false)}>
						Cancel
					</Button>
					<Button
						color='dark'
						isDisable={leaveApplySaving || leaveTypesLoading}
						onClick={handleLeaveSubmit(submitLeaveApplication)}>
						{leaveApplySaving ? 'Submitting…' : 'Submit'}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default UserCalendarDetailModal;

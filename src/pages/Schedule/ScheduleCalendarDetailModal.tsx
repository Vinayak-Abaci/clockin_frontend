import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Chip from '@mui/material/Chip';
import Select from 'react-select';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../components/bootstrap/Modal';
import Button from '../../components/bootstrap/Button';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import useSelectStyles from '../../hooks/useSelectStyle';
import { shiftsArrayFromShiftsField } from './scheduleShiftUtils';

type ScheduleCalendarDetailModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	selectedDate: Date | null;
	/** Schedule template id (schedule calendar); omit for group calendar. */
	scheduleId?: string | number | null;
	/** Group id when `calendarType` is `group`. */
	groupId?: string | number | null;
	calendarType?: 'schedule' | 'group';
	detail: any | null;
	loading?: boolean;
	onChanged?: () => void;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
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

const formatDayTypeLabel = (raw: unknown): string => {
	if (raw == null || raw === '') return '';
	const s = String(raw).replace(/_/g, ' ').trim();
	if (!s) return '';
	return s
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

const normalizeStatusKey = (status: unknown) =>
	String(status || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_');

const getStatusMeta = (status: unknown) => {
	const key = normalizeStatusKey(status);
	if (!key) return null;
	return STATUS_META[key] || { label: key.replace(/_/g, ' '), color: '#0d6efd' };
};

const formatTime = (raw?: string) => {
	if (!raw) return '—';
	const [h, m] = String(raw).split(':');
	if (h == null) return '—';
	return `${String(h).padStart(2, '0')}:${String(m ?? '00').padStart(2, '0')}`;
};

const collectShifts = (detail: any | null): any[] => {
	if (!detail) return [];
	const candidates: any[] = [];
	if (Array.isArray(detail?.shifts)) {
		candidates.push(...detail.shifts);
	} else {
		candidates.push(...shiftsArrayFromShiftsField(detail?.shifts));
	}
	const sched = detail?.schedule;
	if (Array.isArray(sched)) {
		for (const item of sched) {
			if (item && typeof item === 'object' && Array.isArray(item.shifts)) {
				candidates.push(...item.shifts);
			}
		}
	} else if (sched && typeof sched === 'object') {
		if (Array.isArray(sched.shifts)) {
			candidates.push(...sched.shifts);
		} else {
			candidates.push(...shiftsArrayFromShiftsField(sched.shifts));
		}
	}
	if (Array.isArray(detail?.special_day)) {
		for (const sd of detail.special_day) {
			if (sd && typeof sd === 'object' && Array.isArray(sd.shifts)) {
				candidates.push(...sd.shifts);
			}
		}
	} else if (detail?.special_day && typeof detail.special_day === 'object') {
		if (Array.isArray(detail.special_day.shifts)) {
			candidates.push(...detail.special_day.shifts);
		} else {
			candidates.push(...shiftsArrayFromShiftsField(detail.special_day.shifts));
		}
	}
	const seen = new Set<string>();
	return candidates.filter((s: any) => {
		const key = `${s?.id ?? ''}|${s?.name ?? s?.shift_name ?? ''}|${s?.start_time ?? ''}|${s?.end_time ?? ''}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

type ShiftDetailRow = {
	shift_name?: string;
	scheduled?: number;
	worked?: number;
	leave?: number;
	off?: number;
	start_time?: string;
	end_time?: string;
	/** Group calendar-detail: users working this shift */
	working_users?: any[];
};

const formatWorkingUserLabel = (u: any): string => {
	if (u == null) return '';
	if (typeof u === 'string') return u.trim();
	const name = u?.name || u?.full_name;
	if (name && String(name).trim()) return String(name).trim();
	const parts = [u?.first_name, u?.last_name].filter(Boolean);
	if (parts.length) return parts.join(' ');
	if (u?.email) return String(u.email);
	if (u?.id != null) return `User ${u.id}`;
	return '';
};

/** API returns `shift_details` for schedule calendar-detail; fall back to raw shifts with times. */
const getShiftDisplayRows = (detail: any | null): ShiftDetailRow[] => {
	if (!detail) return [];
	if (Array.isArray(detail.shift_details) && detail.shift_details.length > 0) {
		return detail.shift_details.map((r: any) => ({
			shift_name: r?.shift_name || r?.name,
			scheduled: r?.scheduled,
			worked: r?.worked,
			leave: r?.leave,
			off: r?.off,
			start_time: r?.start_time,
			end_time: r?.end_time,
			working_users: Array.isArray(r?.working_users) ? r.working_users : undefined,
		}));
	}
	return collectShifts(detail).map((s: any) => ({
		shift_name: s?.name || s?.shift_name,
		start_time: s?.start_time,
		end_time: s?.end_time,
	}));
};

type ScheduleSummaryCounts = {
	scheduled?: number;
	worked?: number;
	leave?: number;
	off?: number;
};

type ScheduleEntryDisplay = {
	id?: number;
	name: string;
	/** Max OT hours per day when set on schedule */
	otHours?: number | string | null;
	schedule_summary?: ScheduleSummaryCounts | null;
	/** From `special_day` on calendar-detail — shown under Schedule(s) with the template/context row. */
	rowKind?: 'schedule' | 'special_period';
};

const pickScheduleSummary = (raw: unknown): ScheduleSummaryCounts | null => {
	if (raw == null || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	const n = (k: string) => {
		const v = o[k];
		return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
	};
	const scheduled = n('scheduled');
	const worked = n('worked');
	const leave = n('leave');
	const off = n('off');
	if (
		scheduled === undefined &&
		worked === undefined &&
		leave === undefined &&
		off === undefined
	) {
		return null;
	}
	return { scheduled, worked, leave, off };
};

const getScheduleEntries = (detail: any | null): ScheduleEntryDisplay[] => {
	if (!detail) return [];

	let base: ScheduleEntryDisplay[] = [];

	if (Array.isArray(detail.schedule) && detail.schedule.length > 0) {
		base = detail.schedule.map((s: any) => ({
			id: s?.id != null ? Number(s.id) : undefined,
			name: s?.name || `Schedule ${s?.id ?? ''}`,
			otHours: s?.ot_hours,
			schedule_summary: pickScheduleSummary(s?.schedule_summary),
			rowKind: 'schedule',
		}));
	} else if (detail.schedule_context && typeof detail.schedule_context === 'object') {
		const sc = detail.schedule_context;
		base = [
			{
				id: sc?.id != null ? Number(sc.id) : undefined,
				name: sc?.name || `Schedule ${sc?.id ?? ''}`,
				otHours: (sc as any)?.ot_hours,
				schedule_summary: pickScheduleSummary((sc as any)?.schedule_summary),
				rowKind: 'schedule',
			},
		];
	}

	const specials: ScheduleEntryDisplay[] = [];
	if (Array.isArray(detail.special_day)) {
		for (const sd of detail.special_day) {
			if (!sd || sd?.is_deleted === true) continue;
			const n = sd?.name != null ? String(sd.name).trim() : '';
			if (!n) continue;
			specials.push({
				id: sd?.id != null ? Number(sd.id) : undefined,
				name: n,
				otHours: undefined,
				schedule_summary: null,
				rowKind: 'special_period',
			});
		}
	}

	return [...base, ...specials];
};

const formatLeaveStatusLabel = (raw: unknown) =>
	formatDayTypeLabel(String(raw || '').replace(/_/g, ' '));

const ScheduleCalendarDetailModal = ({
	isOpen,
	setIsOpen,
	selectedDate,
	scheduleId,
	groupId,
	calendarType = 'schedule',
	detail,
	loading = false,
	onChanged,
}: ScheduleCalendarDetailModalProps) => {
	const dateLabel = useMemo(
		() => (selectedDate ? dayjs(selectedDate).format('dddd, MMMM D, YYYY') : '—'),
		[selectedDate],
	);
	const apiDate = useMemo(
		() => (selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : ''),
		[selectedDate],
	);

	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const reactSelectStyle = useSelectStyles(false);

	const statusMeta = getStatusMeta(detail?.status);
	const statusLabel = statusMeta?.label ?? 'Not Available';
	const shiftRows = useMemo(() => getShiftDisplayRows(detail), [detail]);
	const scheduleEntries = useMemo(() => getScheduleEntries(detail), [detail]);

	const leaveList = Array.isArray(detail?.leave_requests) ? detail.leave_requests : [];

	const [editMode, setEditMode] = useState(false);
	const [scheduleOptions, setScheduleOptions] = useState<{ label: string; value: number }[]>([]);
	const [scheduleOptionsLoading, setScheduleOptionsLoading] = useState(false);
	const [specialPeriodOptions, setSpecialPeriodOptions] = useState<{ label: string; value: number }[]>([]);
	const [specialPeriodOptionsLoading, setSpecialPeriodOptionsLoading] = useState(false);
	const [selectedScheduleOption, setSelectedScheduleOption] = useState<
		{ label: string; value: number } | null
	>(null);
	const [selectedSpecialPeriodOption, setSelectedSpecialPeriodOption] = useState<
		{ label: string; value: number }[]
	>([]);
	const [saving, setSaving] = useState(false);

	const excludedScheduleIdList = useMemo(() => {
		const ids = new Set<number>();
		if (calendarType === 'schedule' && scheduleId != null && scheduleId !== '') {
			const n = Number(scheduleId);
			if (!Number.isNaN(n)) ids.add(n);
		}
		if (Array.isArray(detail?.schedule)) {
			for (const s of detail.schedule) {
				const n = Number(s?.id);
				if (!Number.isNaN(n)) ids.add(n);
			}
		}
		const sc = detail?.schedule_context;
		if (sc?.id != null) {
			const n = Number(sc.id);
			if (!Number.isNaN(n)) ids.add(n);
		}
		return Array.from(ids).sort((a, b) => a - b);
	}, [calendarType, scheduleId, detail?.schedule, detail?.schedule_context]);

	useEffect(() => {
		if (!editMode) return undefined;
		if (calendarType !== 'group') return undefined;
		let cancelled = false;
		setScheduleOptionsLoading(true);
		authAxios
			.get('api/hr/schedules/?paginate=off')
			.then((res: any) => {
				if (cancelled) return;
				const raw = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				const opts = raw
					.filter((item: any) => !excludedScheduleIdList.includes(Number(item?.id)))
					.map((item: any) => ({
						label: item?.name || `Schedule ${item?.id}`,
						value: Number(item?.id),
					}));
				setScheduleOptions(opts);
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
	}, [editMode, excludedScheduleIdList, calendarType]);

	useEffect(() => {
		if (!editMode || calendarType !== 'schedule' || !apiDate) return undefined;
		let cancelled = false;
		setSpecialPeriodOptionsLoading(true);
		authAxios
			.get('api/hr/special-periods/', { params: { date: apiDate, paginate: 'off' } })
			.then((res: any) => {
				if (cancelled) return;
				const raw = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				const opts = raw.map((item: any) => ({
					label: item?.name || `Special period ${item?.id}`,
					value: Number(item?.id),
				}));
				setSpecialPeriodOptions(opts);
			})
			.catch((err: any) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setSpecialPeriodOptionsLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editMode, calendarType, apiDate]);

	useEffect(() => {
		if (!isOpen) {
			setEditMode(false);
			setSelectedScheduleOption(null);
			setSelectedSpecialPeriodOption([]);
			setSpecialPeriodOptions([]);
			setSaving(false);
		}
	}, [isOpen]);

	const close = () => setIsOpen(false);

	const handleSave = () => {
		if (!apiDate) {
			showErrorNotification('Missing date');
			return;
		}
		if (calendarType === 'schedule') {
			if (scheduleId == null || scheduleId === '') {
				showErrorNotification('Missing schedule');
				return;
			}
			const specialPeriodIds = selectedSpecialPeriodOption
				.map((opt) => Number(opt?.value))
				.filter((n) => !Number.isNaN(n));
			if (specialPeriodIds.length === 0) {
				showErrorNotification('Please select at least one special period');
				return;
			}
			setSaving(true);
			authAxios
				.patch(`api/hr/schedules/${scheduleId}/`, {
					special_periods: specialPeriodIds,
				})
				.then(() => {
					showSuccessNotification('Special schedule added');
					setEditMode(false);
					setSelectedSpecialPeriodOption([]);
					onChanged?.();
				})
				.catch((err: any) => {
					showErrorNotification(err);
				})
				.finally(() => {
					setSaving(false);
				});
			return;
		}
		if (calendarType === 'group' && (groupId == null || groupId === '')) {
			showErrorNotification('Missing group');
			return;
		}
		if (selectedScheduleOption?.value == null) {
			showErrorNotification('Please select a schedule');
			return;
		}
		const payload: Record<string, unknown> = {
			name: `Override on ${apiDate}`,
			from_date: apiDate,
			end_date: apiDate,
			day_type: 'SPECIAL_SCHEDULE',
			notes: '',
			schedule: Number(selectedScheduleOption.value),
			is_deleted: false,
		};
		if (calendarType === 'group') {
			payload.user = null;
			payload.group_ids = [Number(groupId)];
		}
		setSaving(true);
		authAxios
			.post('api/hr/special-periods/', payload)
			.then(() => {
				showSuccessNotification('Schedule updated for the day');
				setEditMode(false);
				onChanged?.();
			})
			.catch((err: any) => {
				showErrorNotification(err);
			})
			.finally(() => {
				setSaving(false);
			});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isScrollable isCentered>
			<ModalHeader className='p-4 border-bottom' setIsOpen={setIsOpen}>
				<ModalTitle id='schedule-day-modal'>
					<div className='text-warning fw-semibold mt-1'>{dateLabel}</div>
					{detail?.group?.name != null && String(detail.group.name).trim() !== '' && (
						<div className='text-muted small fw-normal mt-1'>Group : {String(detail.group.name)}</div>
					)}
				</ModalTitle>
			</ModalHeader>
			<ModalBody className='px-4 pb-4'>
				{loading ? (
					<div className='d-flex flex-column align-items-center justify-content-center gap-3 py-5'>
						<CustomSpinner />
						<div className='text-muted small'>Loading day details…</div>
					</div>
				) : (
					<>
						<div className='d-flex justify-content-between align-items-center px-3 py-2 mb-3 rounded-3 user-calendar-day-status-bar'>
							<div className='d-flex align-items-center gap-2'>
								<span className='text-muted small'>Status:</span>
								<Chip
									label={statusLabel}
									size='small'
									sx={{
										fontWeight: 700,
										bgcolor: `${statusMeta?.color ?? '#6c757d'}22`,
										color: statusMeta?.color ?? '#495057',
									}}
								/>
							</div>
						</div>

						<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel'>
							<div className='d-flex justify-content-between mb-2'>
								<div className='fw-semibold mb-2 text-warning'>
									<CalendarTodayIcon fontSize='small' /> Schedule
								</div>
								{!editMode && calendarType === 'schedule' && (
									<Button
										size='sm'
										color='secondary'
										isLight
										onClick={() => setEditMode(true)}>
										Add Special Schedule
									</Button>
								)}
							</div>
							{editMode ? (
								<div className='mb-2'>
									<div className='text-muted small mb-1'>
										{calendarType === 'schedule'
											? 'Pick special period for this date'
											: 'Pick another schedule'}
									</div>
									{calendarType === 'schedule' ? (
										<Select
											styles={reactSelectStyle}
											options={specialPeriodOptions}
											isMulti
											value={selectedSpecialPeriodOption}
											onChange={(opt: any) =>
												setSelectedSpecialPeriodOption(
													Array.isArray(opt) ? opt : [],
												)
											}
											isLoading={specialPeriodOptionsLoading}
											isClearable
											placeholder='Select special periods…'
										/>
									) : (
										<Select
											styles={reactSelectStyle}
											options={scheduleOptions}
											value={selectedScheduleOption}
											onChange={(opt: any) => setSelectedScheduleOption(opt)}
											isLoading={scheduleOptionsLoading}
											isClearable
											placeholder='Select a schedule…'
										/>
									)}
									<div className='d-flex gap-2 mt-3 justify-content-end'>
										<Button
											size='sm'
											color='dark'
											isLight
											isDisable={saving}
											onClick={() => {
												setEditMode(false);
												setSelectedScheduleOption(null);
												setSelectedSpecialPeriodOption([]);
											}}>
											Cancel
										</Button>
										<Button
											size='sm'
											color='warning'
											isDisable={
												saving ||
												(calendarType === 'schedule'
													? specialPeriodOptionsLoading ||
														selectedSpecialPeriodOption.length === 0
													: scheduleOptionsLoading ||
														selectedScheduleOption?.value == null)
											}
											onClick={handleSave}>
											{saving
												? 'Saving…'
												: calendarType === 'schedule'
												? 'Add Special Schedule'
												: 'Save Schedule'}
										</Button>
									</div>
								</div>
							) : (
								<>
									<div className='mb-3'>
										<div className='text-muted small'>Schedule(s)</div>
										{scheduleEntries.length ? (
											<ul className='list-unstyled mb-0 small'>
												{scheduleEntries.map((e, i) => {
													const sum = e.schedule_summary;
													const hasSummary =
														sum != null &&
														[sum.scheduled, sum.worked, sum.leave, sum.off].some(
															(v) => v != null,
														);
													const rowKey =
														e.rowKind === 'special_period' && e.id != null
															? `sp-${e.id}`
															: e.id ?? `${e.name}-${i}`;
													return (
														<li key={rowKey} className='mb-2'>
															<div>
																<span className='fw-semibold'>{e.name}</span>
																{e.otHours != null &&
																	String(e.otHours).trim() !== '' &&
																	Number(e.otHours) > 0 && (
																	<Chip
																		label={`Max OT: ${e.otHours}h/day`}
																		size='small'
																		sx={{
																			ml: 1,
																			fontWeight: 700,
																			bgcolor: '#e8f7ee',
																			color: '#198754',
																		}}
																	/>
																)}
															</div>
															{hasSummary && sum && (
																<div className='text-muted small mt-1'>
																	<span className='me-2'>
																		Scheduled: {sum.scheduled ?? '—'}
																	</span>
																	<span className='me-2'>Worked: {sum.worked ?? '—'}</span>
																	<span className='me-2'>Leave: {sum.leave ?? '—'}</span>
																	<span>Off: {sum.off ?? '—'}</span>
																</div>
															)}
														</li>
													);
												})}
											</ul>
										) : (
											<span className='text-muted'>No schedule found</span>
										)}
									</div>

									{leaveList.length > 0 && (
										<div className='border-top pt-3 mb-3'>
											<div className='fw-semibold mb-2 text-warning'>Leave requests</div>
											<ul className='ps-3 mb-0 small'>
												{leaveList.map((lr: any, i: number) => {
													const lt = lr?.leave_type;
													const typeLabel =
														(lt && typeof lt === 'object' && (lt.name || lt.code)) ||
														(typeof lt === 'string' ? lt : null) ||
														'Leave';
													const st = lr?.status != null ? formatLeaveStatusLabel(lr.status) : '—';
													return (
														<li key={lr?.id ?? `leave-${i}`} className='mb-2'>
															<span className='fw-semibold'>{String(typeLabel)}</span>
															<span className='text-muted ms-2'>
																<Chip
																	label={st}
																	size='small'
																	sx={{
																		fontWeight: 600,
																		height: 22,
																		fontSize: '0.7rem',
																	}}
																/>
															</span>
														</li>
													);
												})}
											</ul>
										</div>
									)}

								</>
							)}
						</div>

						{!editMode && (
							<div className='p-3 rounded-3 border shadow-sm user-calendar-day-panel mt-3'>
								<div className='fw-semibold mb-2 text-warning d-flex align-items-center gap-1'>
									<AccessTimeIcon fontSize='small' />
									Shifts
								</div>
								{shiftRows.length ? (
									<ul className='list-unstyled mb-0 small'>
										{shiftRows.map((row, i) => {
											const hasStats = [row.scheduled, row.worked, row.leave, row.off].some(
												(v) => v != null,
											);
											const hasTimes = row.start_time || row.end_time;
											const workingLabels = (row.working_users || [])
												.map(formatWorkingUserLabel)
												.filter(Boolean);
											return (
												<li
													key={`${row.shift_name ?? 'shift'}-${i}`}
													className='mb-2 pb-2 border-bottom border-light'>
													<div className='fw-semibold'>
														{row.shift_name || `Shift ${i + 1}`}
														{hasTimes && (
															<span className='text-muted fw-normal ms-2'>
																{formatTime(row.start_time)} – {formatTime(row.end_time)}
															</span>
														)}
													</div>
													{hasStats && (
														<div className='text-muted'>
															<span className='me-2'>Scheduled: {row.scheduled ?? '—'}</span>
															<span className='me-2'>Worked: {row.worked ?? '—'}</span>
															<span className='me-2'>Leave: {row.leave ?? '—'}</span>
															<span>Off: {row.off ?? '—'}</span>
														</div>
													)}
													{workingLabels.length > 0 && (
														<div className='text-muted small mt-1'>
															<span className='fw-semibold me-1'>Working:</span>
															{workingLabels.join(', ')}
														</div>
													)}
												</li>
											);
										})}
									</ul>
								) : (
									<span className='text-muted small'>No shifts on this day</span>
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
	);
};

export default ScheduleCalendarDetailModal;

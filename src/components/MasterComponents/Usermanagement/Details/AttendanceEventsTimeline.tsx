import React, { useMemo } from 'react';
import { Tooltip } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import Icon from '../../../icon/Icon';
import Button from '../../../bootstrap/Button';
import Moments from '../../../../helpers/Moment';
import useDarkMode from '../../../../hooks/useDarkMode';
import { formatMinutesToHms } from '../../../../pages/Attendance/attendanceStatusUtils';

const formatEnteredBy = (enteredBy: unknown): string | null => {
	if (enteredBy == null) return null;
	if (typeof enteredBy === 'string') {
		const s = enteredBy.trim();
		return s || null;
	}
	if (typeof enteredBy === 'object' && !Array.isArray(enteredBy)) {
		const o = enteredBy as Record<string, unknown>;
		const first = String(o.first_name || '').trim();
		const last = String(o.last_name || '').trim();
		const full = [first, last].filter(Boolean).join(' ').trim();
		if (full) return full;
		return String(o.name || o.email || o.preferred_name || o.id || '').trim() || null;
	}
	return String(enteredBy).trim() || null;
};

const normalizeEventTypeKey = (ev: any) =>
	String(ev?.event_type || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_');

const isEventDeleted = (data: any): boolean => {
	const v = data?.is_deleted;
	return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
};

const eventTypeLabel = (data: any): string =>
	normalizeEventTypeKey(data).replace(/_/g, ' ') || '—';

const statusDisplayTextForTimeline = (data: any) => {
	if (isEventDeleted(data)) return 'Removed';
	return eventTypeLabel(data);
};

const timestampForTimeline = (data: any): string | null => {
	if (isEventDeleted(data)) {
		const at = data?.deleted_at;
		return at != null && String(at).trim() !== '' ? String(at) : null;
	}
	const at = data?.timestamp;
	return at != null && String(at).trim() !== '' ? String(at) : null;
};

const formatWorkedMinsTillNow = (data: any): string | null => {
	const raw = data?.worked_mins_till_now ?? data?.worked_minutes_till_now;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return null;
	return formatMinutesToHms(n);
};

const remarksDisplayForTimeline = (data: any, showWorkedMinsTillNow = false) => {
	if (isEventDeleted(data)) {
		const typeLabel = eventTypeLabel(data);
		const deletedBy = formatEnteredBy(data?.deleted_by);
		const eventPrefix = typeLabel !== '—' ? `${typeLabel} ` : 'Event ';
		return deletedBy
			? `${eventPrefix}removed by ${deletedBy}`
			: `${eventPrefix}removed`;
	}
	const method =
		data?.method != null && String(data.method).trim() !== ''
			? String(data.method).trim()
			: null;
	const primaryDetail = showWorkedMinsTillNow
		? formatWorkedMinsTillNow(data)
		: (() => {
				const entered = formatEnteredBy(data?.entered_by);
				return entered ? `Entered by ${entered}` : null;
			})();
	const descParts = [primaryDetail, method ? `Method: ${method}` : null].filter(Boolean);
	return descParts.join(' · ') || '—';
};

/** Hex for `TimelineContent` (matches your `TimeLineColor` pattern). */
const ATTENDANCE_TIMELINE_HEX: Record<string, string> = {
	CLOCK_IN: '#198754',
	CLOCK_OUT: '#0d6efd',
};

const timelineHexForEvent = (ev: any): string => {
	const key = normalizeEventTypeKey(ev);
	const base = ATTENDANCE_TIMELINE_HEX[key] || '#6c757d';
	return isEventDeleted(ev) ? '#6c757d' : base;
};

/** Fixed width for the dot/connector column so it lines up vertically. */
const TIMELINE_SEPARATOR_COL_WIDTH = 28;

export type AttendanceEventsTimelineProps = {
	events: any[];
	/** CSS value for scroll area max height (default fits typical modal body). */
	maxHeight?: string;
	showActions?: boolean;
	actionDisabled?: boolean;
	/** When true, shows worked_mins_till_now (e.g. `07h`) instead of entered_by. */
	showWorkedMinsTillNow?: boolean;
	onEdit?: (event: any) => void;
	onDelete?: (event: any) => void;
};

const DEFAULT_TIMELINE_SCROLL_MAX_HEIGHT = 'min(20rem, 42vh)';

const AttendanceEventsTimeline = ({
	events,
	maxHeight = DEFAULT_TIMELINE_SCROLL_MAX_HEIGHT,
	showActions = false,
	actionDisabled = false,
	showWorkedMinsTillNow = false,
	onEdit,
	onDelete,
}: AttendanceEventsTimelineProps) => {
	const { darkModeStatus } = useDarkMode();

	/** Preserve API response order (no client-side sort by timestamp). */
	const items = useMemo(
		() => (Array.isArray(events) ? events.filter((e) => e != null) : []),
		[events],
	);

	/** Width in `ch` for status column: bold labels are wider than `ch` (width of "0"), so scale + pad. */
	const statusColumnWidthCh = useMemo(() => {
		let maxChars = 8;
		for (const data of items) {
			const s = statusDisplayTextForTimeline(data);
			for (const line of s.split(/\n/)) {
				maxChars = Math.max(maxChars, Array.from(line).length);
			}
		}
		const scaled = Math.ceil(maxChars * 1.35) + 10;
		return Math.min(Math.max(scaled, 16), 80);
	}, [items]);

	if (!items.length) {
		return null;
	}

	const textMain = darkModeStatus ? '#fff' : '#000';

	return (
		<div
			dir='ltr'
			style={{
				width: '100%',
				marginTop: 15,
				maxHeight,
				minHeight: 0,
				overflowY: 'auto',
				overflowX: 'hidden',
				overscrollBehavior: 'contain',
			}}>
			<Timeline position='left' sx={{ p: 0, m: 0 }}>
				{items.map((data, index) => {
					const key = data?.id ?? `${data?.event_type}-${data?.timestamp}-${index}`;
					const deleted = isEventDeleted(data);
					const desc = remarksDisplayForTimeline(data, showWorkedMinsTillNow);
					const statusText = statusDisplayTextForTimeline(data);
					const statusColor = timelineHexForEvent(data);
					const displayTimestamp = timestampForTimeline(data);
					const canActOnEvent = showActions && data?.id != null && !deleted;

					return (
						<TimelineItem key={key}>
							<TimelineOppositeContent color='text.secondary' sx={{ m: 0, flex: 1, minWidth: 0, py: 0.5 }}>
								<div className='row g-1 align-items-center mx-0'>
									<div
										className='col-4 small'
										style={{
											color: textMain,
											lineHeight: 1.25,
										}}>
										{displayTimestamp ? Moments(displayTimestamp, 'datetime') : '—'}
									</div>
									<div
										className='col-1 px-0 small text-center'
										style={{ color: textMain, lineHeight: 1.25 }}>
										•
									</div>
									<div className={canActOnEvent ? 'col-5' : 'col-7'}>
										<p
											className='mb-0'
											style={{
												fontWeight: 700,
												color: textMain,
												fontStyle: 'italic',
												lineHeight: 1.25,
											}}>
											{desc}
										</p>
									</div>
									{canActOnEvent && (
										<div className='col-2 d-flex justify-content-end gap-1'>
											<Tooltip arrow title='Edit' placement='top'>
												<Button
													isOutline={false}
													color='warning'
													isLight
													size='sm'
													icon='Edit'
													isDisable={actionDisabled}
													onClick={() => onEdit?.(data)}
												/>
											</Tooltip>
											<Tooltip arrow title='Delete' placement='top'>
												<Button
													isOutline={false}
													color='danger'
													isLight
													size='sm'
													icon='Delete'
													isDisable={actionDisabled}
													onClick={() => onDelete?.(data)}
												/>
											</Tooltip>
										</div>
									)}
								</div>
							</TimelineOppositeContent>

							<TimelineSeparator
								sx={(theme) => ({
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'flex-start',
									flex: '0 0 auto',
									flexShrink: 0,
									width: TIMELINE_SEPARATOR_COL_WIDTH,
									minWidth: TIMELINE_SEPARATOR_COL_WIDTH,
									mx: 1,
									pt: theme.spacing(0.5),
								})}>
								<Icon
									icon='Circle'
									size='lg'
									style={{ color: statusColor, display: 'block', lineHeight: 0 }}
								/>
								{index < items.length - 1 ? <TimelineConnector /> : null}
							</TimelineSeparator>

							<TimelineContent
								className='timeline-content-custom'
								sx={{
									m: 0,
									p: 0,
									pt: 0.5,
									pb: 0.5,
									pl: 1,
									pr: 0,
									boxSizing: 'border-box',
									flex: `0 0 ${statusColumnWidthCh}ch`,
									flexGrow: 0,
									flexShrink: 0,
									width: `${statusColumnWidthCh}ch`,
									minWidth: `${statusColumnWidthCh}ch`,
									maxWidth: `${statusColumnWidthCh}ch`,
									fontWeight: 600,
									color: `${statusColor} !important`,
									direction: 'ltr',
									textAlign: 'end',
									whiteSpace: 'nowrap',
									overflow: 'visible',
									lineHeight: 1.2,
									'&.timeline-content-custom': {
										direction: 'ltr !important',
										textAlign: 'end !important',
									},
								}}>
								{statusText}
							</TimelineContent>
						</TimelineItem>
					);
				})}
			</Timeline>
		</div>
	);
};

export default AttendanceEventsTimeline;

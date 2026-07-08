import React, { useRef } from 'react';
import dayjs from 'dayjs';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { statusColorLightBackground, WORKED_TIME_DISPLAY_LINE_RE } from '../../pages/Attendance/attendanceStatusUtils';

const localizer = dayjsLocalizer(dayjs);

const weekdayLabel = (date: Date) => dayjs(date).format('ddd').toUpperCase();

const MonthDayHeader = ({ label }: { label: string }) => (
	<span className='rbc-month-day-name'>{String(label || '').toUpperCase()}</span>
);

type CustomCalendarProps = {
	events: any[];
	date: Date;
	/** Merged with default month styles (e.g. pointerEvents). */
	eventPropGetter?: (event: any) => { className?: string; style?: React.CSSProperties };
	onNavigate?: (date: Date) => void;
	/**
	 * Fires when user clicks an empty day cell (month view slot) or an event.
	 * Used by parent screens to open date-specific actions.
	 */
	onDateClick?: (date: Date) => void;
	height?: string;
	startAccessor?: string;
	endAccessor?: string;
	toolbar?: boolean;
};

const CustomCalendar = ({
	events,
	date,
	eventPropGetter: eventPropGetterProp,
	onNavigate,
	onDateClick,
	height = '85vh',
	startAccessor = 'start',
	endAccessor = 'end',
	toolbar = false,
}: CustomCalendarProps) => {
	const lastDateClickRef = useRef<{ key: string; at: number } | null>(null);

	/** Normalize to the calendar day in local time (avoids UTC shift from RBC / ISO dates). */
	const emitDateClick = (rawDate: Date) => {
		if (!rawDate || Number.isNaN(rawDate.getTime())) return;
		const normalized = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
		const key = dayjs(normalized).format('YYYY-MM-DD');
		const now = Date.now();
		if (
			lastDateClickRef.current?.key === key &&
			now - lastDateClickRef.current.at < 250
		) {
			return;
		}
		lastDateClickRef.current = { key, at: now };
		onDateClick?.(normalized);
	};

	const DayCellWrapper = ({ children, value }: any) => {
		if (!React.isValidElement(children)) return children;

		const originalOnClick = (children.props as any)?.onClick;
		return React.cloneElement(children as React.ReactElement<any>, {
			onClick: (event: any) => {
				originalOnClick?.(event);
				if (value) emitDateClick(value);
			},
		});
	};

	const EventContent = ({ event }: any) => {
		const text = String(event?.title || '');
		const lines = text.split('\n').filter(Boolean);
		const [primary, ...detailLines] = lines;

		if (event?.resource?.kind === 'shift') {
			const accent = String(event?.color || '#495057');
			return (
				<span
					className='rbc-shift-event-card'
					title={text.replace(/\n/g, ' ')}
					style={{
						background: statusColorLightBackground(accent, '28'),
						color: accent,
					}}>
					{primary && <span className='rbc-shift-event-card__name'>{primary}</span>}
					{detailLines.map((line, index) => (
						<span key={index} className='rbc-shift-event-card__detail'>
							{line}
						</span>
					))}
				</span>
			);
		}

		const workedLineIndex = detailLines.findIndex(
			(line) =>
				WORKED_TIME_DISPLAY_LINE_RE.test(line.trim()) ||
				/^Worked:/i.test(line.trim()),
		);
		const workedLine = workedLineIndex >= 0 ? detailLines[workedLineIndex] : null;
		const otherDetails =
			workedLineIndex >= 0
				? detailLines.filter((_, index) => index !== workedLineIndex)
				: detailLines;

		return (
			<span className='rbc-status-event-card' title={text.replace(/\n/g, ' ')}>
				{(primary || workedLine) && (
					<span className='rbc-status-event-card__row'>
						{primary && <span className='rbc-status-event-card__primary'>{primary}</span>}
						{workedLine && (
							<span className='rbc-status-event-card__worked'>{workedLine}</span>
						)}
					</span>
				)}
				{otherDetails.map((line, index) => (
					<span key={index} className='rbc-status-event-card__detail'>
						{line}
					</span>
				))}
			</span>
		);
	};

	return (
		<div
			className={`schedule-calendar-grid${onDateClick ? ' schedule-calendar-grid--clickable' : ''}`}
			style={{ height, width: '100%' }}>
			<Calendar
				localizer={localizer}
				toolbar={toolbar}
				events={events}
				startAccessor={startAccessor}
				endAccessor={endAccessor}
				views={[Views.MONTH]}
				defaultView={Views.MONTH}
				date={date}
				onNavigate={onNavigate}
				formats={{
					weekdayFormat: (d: Date) => weekdayLabel(d),
				}}
				components={{
					month: {
						header: MonthDayHeader,
					},
					dateCellWrapper: DayCellWrapper,
					event: EventContent,
				}}
				/**
				 * "ignoreEvents" allows selecting/clicking the day cell even when events exist.
				 * This keeps the default month grid structure/styles intact.
				 */
				selectable='ignoreEvents'
				onSelectSlot={(slotInfo: any) => {
					if (slotInfo?.start) {
						emitDateClick(slotInfo.start);
					}
				}}
				onSelectEvent={(event: any) => {
					if (event?.start) {
						emitDateClick(event.start);
					}
				}}
				/**
				 * When date clicks are enabled, events are interactive; otherwise clicks pass through to the day cell.
				 */
				eventPropGetter={(event: any) => {
					const custom = eventPropGetterProp?.(event) || {};
					return {
						...custom,
						style: {
							...(custom.style || {}),
							pointerEvents: onDateClick ? 'auto' : 'none',
							cursor: onDateClick ? 'pointer' : undefined,
						},
					};
				}}
				/**
				 * Date-number click in month cell triggers drilldown path.
				 * Capture it so modal opens for both day-cell and day-number clicks.
				 */
				onDrillDown={(drillDate: Date) => {
					if (drillDate) {
						emitDateClick(drillDate);
					}
				}}
			/>
		</div>
	);
};

CustomCalendar.defaultProps = {
	eventPropGetter: undefined,
	onNavigate: undefined,
	onDateClick: undefined,
	height: '85vh',
	startAccessor: 'start',
	endAccessor: 'end',
	toolbar: false,
};

export default CustomCalendar;

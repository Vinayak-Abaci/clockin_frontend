import React from 'react';
import dayjs from 'dayjs';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { statusColorLightBackground } from '../../pages/Attendance/attendanceStatusUtils';

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
	/** Normalize to the calendar day in local time (avoids UTC shift from RBC / ISO dates). */
	const emitDateClick = (rawDate: Date) => {
		if (!rawDate || Number.isNaN(rawDate.getTime())) return;
		const normalized = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
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
		const detail = detailLines.join(' · ');

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
					{detail && <span className='rbc-shift-event-card__detail'>{detail}</span>}
				</span>
			);
		}
		return (
			<span className='rbc-status-event-card' title={text.replace(/\n/g, ' ')}>
				{primary && <span className='rbc-status-event-card__primary'>{primary}</span>}
				{detail && <span className='rbc-status-event-card__detail'>{detail}</span>}
			</span>
		);
	};

	return (
		<div className='schedule-calendar-grid' style={{ height, width: '100%' }}>
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
				/**
				 * Keep events visible but let day-cell clicks pass through.
				 * This ensures dates stay clickable even when cells are filled by schedules.
				 */
				eventPropGetter={(event: any) => {
					const custom = eventPropGetterProp?.(event) || {};
					return {
						...custom,
						style: {
							pointerEvents: 'none',
							...(custom.style || {}),
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

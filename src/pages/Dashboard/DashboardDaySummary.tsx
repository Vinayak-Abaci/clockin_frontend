import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import dayjs from 'dayjs';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { authAxios } from '../../axiosInstance';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import { pagesNotInSideBar } from '../../routes/RoutesMenu';
import {
	ATTENDANCE_STATUS_META,
	getAttendanceStatusMeta,
	normalizeAttendanceStatusKey,
} from '../Attendance/attendanceStatusUtils';
import DashboardClockedUsersRow, {
	clockedUsersFromCounts,
	type ClockCountsWithUsers,
} from './DashboardClockedUsersRow';
import {
	DASHBOARD_ATTENDANCE_THEME,
	dashboardStatStyle,
	type DashboardTone,
} from './dashboardTheme';

const dashboardStatusChipSx = (status: string | undefined) => {
	const key = normalizeAttendanceStatusKey(status);
	const colorMap: Record<string, { color: string; bg: string }> = {
		PRESENT: {
			color: DASHBOARD_ATTENDANCE_THEME.present.color,
			bg: DASHBOARD_ATTENDANCE_THEME.present.bg,
		},
		ABSENT: {
			color: DASHBOARD_ATTENDANCE_THEME.absent.color,
			bg: DASHBOARD_ATTENDANCE_THEME.absent.bg,
		},
		LEAVE: {
			color: DASHBOARD_ATTENDANCE_THEME.leave.color,
			bg: DASHBOARD_ATTENDANCE_THEME.leave.bg,
		},
		SCHEDULED: {
			color: DASHBOARD_ATTENDANCE_THEME.clockIn.color,
			bg: DASHBOARD_ATTENDANCE_THEME.clockIn.bg,
		},
	};
	const themed = colorMap[key];
	if (themed) {
		return { fontWeight: 600, bgcolor: themed.bg, color: themed.color };
	}
	const meta = getAttendanceStatusMeta(status);
	return {
		fontWeight: 600,
		bgcolor: meta?.color ? `${meta.color}22` : 'rgba(var(--bs-secondary-rgb), 0.12)',
		color: meta?.color ?? 'var(--bs-secondary-color)',
	};
};

type StatusCounts = {
	PRESENT?: number;
	ABSENT?: number;
	LEAVE?: number;
};

type ClockCounts = ClockCountsWithUsers;

export type DashboardGroupDetail = {
	group_id: number;
	group_name: string;
	total_employees: number;
	counts: StatusCounts;
	clock_counts?: ClockCounts;
};

export type DashboardScheduleSummary = {
	schedule_id: number;
	schedule_name: string;
	status: string;
	total_employees: number;
	counts: StatusCounts;
	clock_counts: ClockCounts;
	group_details?: DashboardGroupDetail[];
};

export type DashboardShiftDetail = {
	start_time: string;
	end_time: string;
};

export type DashboardScheduleDetail = {
	schedule_id: number;
	schedule_name: string;
	status: string;
	direct_employees: number;
	group_details: DashboardGroupDetail[];
	total_employees: number;
	shift_details: DashboardShiftDetail[];
	counts: StatusCounts;
	clock_counts: ClockCounts;
};

export type DashboardDaySummary = {
	date: string;
	timezone?: string;
	total_schedules: number;
	total_employees: number;
	total_counts: StatusCounts;
	total_clock_counts: ClockCounts;
	schedules?: DashboardScheduleSummary[];
	schedule_detail?: DashboardScheduleDetail;
};

type Props = {
	/** When set, fetches `/api/hr/dashboard/day-summary/?schedule={id}` and shows group/shift breakdown. */
	scheduleId?: string;
};

const countValue = (counts: StatusCounts | undefined, key: keyof StatusCounts) => {
	const v = counts?.[key];
	return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
};

const clockValue = (counts: ClockCounts | undefined, key: keyof ClockCounts) => {
	const v = counts?.[key];
	return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
};

const formatShiftRange = (shift: DashboardShiftDetail) => {
	const start = String(shift.start_time || '').trim().slice(0, 5) || '—';
	const end = String(shift.end_time || '').trim().slice(0, 5) || '—';
	return `${start} – ${end}`;
};

type StatCardConfig = {
	label: string;
	value: number;
	tone: DashboardTone;
	icon: React.ReactNode;
	tooltip: string;
};

const StatCard = ({ label, value, tone, icon, tooltip }: StatCardConfig) => (
	<Tooltip title={tooltip} arrow placement='top'>
		<div
			className='hr-dashboard__stat-card w-100'
			style={{ ...dashboardStatStyle(tone), cursor: 'help' }}>
			<div className='hr-dashboard__stat-icon'>{icon}</div>
			<div className='hr-dashboard__stat-value'>{value}</div>
			<div className='hr-dashboard__stat-label'>{label}</div>
		</div>
	</Tooltip>
);

type ProgressRowProps = {
	label: string;
	value: number;
	total: number;
	tone: DashboardTone;
};

const ProgressRow = ({ label, value, total, tone }: ProgressRowProps) => {
	const pct = total > 0 ? Math.round((value / total) * 100) : 0;
	return (
		<div className='hr-dashboard__progress-row'>
			<div className='hr-dashboard__progress-head'>
				<span style={{ color: tone.color }}>{label}</span>
				<span className='text-muted'>
					{value} <span className='fw-normal'>({pct}%)</span>
				</span>
			</div>
			<div className='hr-dashboard__progress-track'>
				<div
					className='hr-dashboard__progress-fill'
					style={{ width: `${pct}%`, backgroundColor: tone.fill }}
				/>
			</div>
		</div>
	);
};

const buildStatCards = (
	summary: DashboardDaySummary,
	totalCounts: StatusCounts | undefined,
	totalClock: ClockCounts | undefined,
	includeSchedulesStat: boolean,
): StatCardConfig[] => {
	const present = countValue(totalCounts, 'PRESENT');
	const absent = countValue(totalCounts, 'ABSENT');
	const leave = countValue(totalCounts, 'LEAVE');

	const cards: StatCardConfig[] = [
		{
			label: 'Present',
			value: present,
			tone: DASHBOARD_ATTENDANCE_THEME.present,
			icon: <CheckCircleOutlineIcon />,
			tooltip: 'Employees marked present for today based on their attendance status.',
		},
		{
			label: 'Absent',
			value: absent,
			tone: DASHBOARD_ATTENDANCE_THEME.absent,
			icon: <CancelOutlinedIcon />,
			tooltip: 'Employees marked absent today who were scheduled or expected to work.',
		},
		{
			label: 'On leave',
			value: leave,
			tone: DASHBOARD_ATTENDANCE_THEME.leave,
			icon: <EventBusyOutlinedIcon />,
			tooltip: 'Employees on approved leave for today.',
		},
		{
			label: 'Clocked in',
			value: clockValue(totalClock, 'clocked_in'),
			tone: DASHBOARD_ATTENDANCE_THEME.clockIn,
			icon: <LoginOutlinedIcon />,
			tooltip: 'Employees who have clocked in today and are currently active or still in.',
		},
		{
			label: 'Clocked out',
			value: clockValue(totalClock, 'clocked_out'),
			tone: DASHBOARD_ATTENDANCE_THEME.clockOut,
			icon: <LogoutOutlinedIcon />,
			tooltip: 'Employees who have recorded a clock-out for today.',
		},
	];

	if (includeSchedulesStat) {
		cards.push({
			label: 'Schedules',
			value: summary.total_schedules,
			tone: DASHBOARD_ATTENDANCE_THEME.schedules,
			icon: <CalendarMonthOutlinedIcon />,
			tooltip: 'Total number of schedules active for today.',
		});
	}

	return cards;
};

type MetricPill = { label: string; value: number; modifier?: string };

const MetricPillsGrid = ({ pills }: { pills: MetricPill[] }) => (
	<div className='row g-2 mb-3'>
		{pills.map(({ label, value, modifier }) => (
			<div key={label} className='col-4'>
				<div
					className={classNames(
						'hr-dashboard__metric-pill',
						modifier && `hr-dashboard__metric-pill--${modifier}`,
					)}>
					<span>{value}</span>
					<small>{label}</small>
				</div>
			</div>
		))}
	</div>
);

const attendanceMetricPills = (
	totalEmployees: number,
	counts: StatusCounts | undefined,
	clockCounts: ClockCounts | undefined,
	includeClock = true,
): MetricPill[] => {
	const pills: MetricPill[] = [
		{ label: 'Staff', value: totalEmployees },
		{ label: 'Present', value: countValue(counts, 'PRESENT'), modifier: 'success' },
		{ label: 'Absent', value: countValue(counts, 'ABSENT'), modifier: 'danger' },
		{ label: 'Leave', value: countValue(counts, 'LEAVE'), modifier: 'info' },
	];
	if (includeClock) {
		pills.push(
			{ label: 'In', value: clockValue(clockCounts, 'clocked_in'), modifier: 'warning' },
			{ label: 'Out', value: clockValue(clockCounts, 'clocked_out'), modifier: 'primary' },
		);
	}
	return pills;
};

const OVERALL_VIEW_KEY = 'overall';

type ScheduleDashboardCardProps = {
	row: DashboardScheduleSummary;
	scheduleDetailTo: (id: number) => string;
	groupDetailTo: (id: number) => string;
};

const ScheduleDashboardCard = ({
	row,
	scheduleDetailTo,
	groupDetailTo,
}: ScheduleDashboardCardProps) => {
	const [selectedKey, setSelectedKey] = useState<string>(OVERALL_VIEW_KEY);
	const [groupsOpen, setGroupsOpen] = useState(false);
	const groups = Array.isArray(row.group_details) ? row.group_details : [];
	const statusMeta = getAttendanceStatusMeta(row.status);
	const isOverall = selectedKey === OVERALL_VIEW_KEY;
	const selectedGroup = isOverall
		? null
		: groups.find((g) => String(g.group_id) === selectedKey) ?? null;

	const pills = attendanceMetricPills(
		isOverall ? row.total_employees ?? 0 : selectedGroup?.total_employees ?? 0,
		isOverall ? row.counts : selectedGroup?.counts,
		isOverall ? row.clock_counts : selectedGroup?.clock_counts,
	);

	const viewLink = !isOverall && selectedGroup?.group_id != null
		? { to: groupDetailTo(selectedGroup.group_id), label: 'View group' }
		: row.schedule_id != null
			? { to: scheduleDetailTo(row.schedule_id), label: 'View schedule' }
			: null;

	return (
		<div className='hr-dashboard__schedule-card'>
			<div className='d-flex justify-content-between align-items-start gap-2 mb-2'>
				<h3 className='hr-dashboard__schedule-name text-warning mb-0'>
					{row.schedule_name || '—'}
				</h3>
				<Chip
					size='small'
					label={statusMeta?.label || row.status || '—'}
					sx={{
						flexShrink: 0,
						...dashboardStatusChipSx(row.status),
					}}
				/>
			</div>

			<MetricPillsGrid pills={pills} />

			<DashboardClockedUsersRow
				users={clockedUsersFromCounts(
					isOverall ? row.clock_counts : selectedGroup?.clock_counts,
				)}
			/>

			{groups.length > 0 ? (
				<div className='hr-dashboard__group-picker mt-3'>
					<button
						type='button'
						className='hr-dashboard__group-toggle'
						onClick={() => setGroupsOpen((open) => !open)}
						aria-expanded={groupsOpen}
						aria-controls={`schedule-groups-panel-${row.schedule_id}`}>
						<span className='hr-dashboard__group-toggle-label'>
							{isOverall
								? 'View by group'
								: `Group: ${selectedGroup?.group_name ?? 'Selected'}`}
						</span>
						{groupsOpen ? (
							<ExpandLessIcon fontSize='small' />
						) : (
							<ExpandMoreIcon fontSize='small' />
						)}
					</button>
					{groupsOpen ? (
						<div
							id={`schedule-groups-panel-${row.schedule_id}`}
							className='hr-dashboard__group-select-panel'>
							<select
								id={`schedule-group-${row.schedule_id}`}
								className='hr-dashboard__group-select'
								value={selectedKey}
								onChange={(e) => setSelectedKey(e.target.value)}>
								<option value={OVERALL_VIEW_KEY}>Overall (all groups)</option>
								{groups.map((g) => (
									<option key={g.group_id} value={String(g.group_id)}>
										{g.group_name || `Group ${g.group_id}`}
									</option>
								))}
							</select>
						</div>
					) : null}
				</div>
			) : null}

			{viewLink ? (
				<Link to={viewLink.to} className='hr-dashboard__view-link'>
					{viewLink.label}
					<ArrowForwardIcon sx={{ fontSize: '1rem' }} />
				</Link>
			) : null}
		</div>
	);
};

const DashboardDaySummary = ({ scheduleId }: Props) => {
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [summary, setSummary] = useState<DashboardDaySummary | null>(null);
	const [loading, setLoading] = useState(true);

	const isScheduleView = Boolean(scheduleId);
	const scheduleDetail = summary?.schedule_detail;

	const dateLabel = useMemo(() => {
		const dateStr = summary?.date ?? dayjs().format('YYYY-MM-DD');
		const parsed = dayjs(dateStr);
		return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY') : dateStr;
	}, [summary?.date]);

	const fetchSummary = useCallback(() => {
		let cancelled = false;
		setLoading(true);
		const params = scheduleId ? { schedule: scheduleId } : undefined;
		authAxios
			.get<DashboardDaySummary>('/api/hr/dashboard/day-summary/', { params })
			.then((res) => {
				if (!cancelled) setSummary(res.data ?? null);
			})
			.catch((err) => {
				if (!cancelled) {
					setSummary(null);
					showErrorRef.current(err);
				}
			})
			.finally(() => {
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [scheduleId]);

	useEffect(() => {
		const cleanup = fetchSummary();
		return cleanup;
	}, [fetchSummary]);

	const scheduleDetailTo = (id: number) =>
		pagesNotInSideBar.ScheduleTemplateDetail.path.replace(':id', encodeURIComponent(String(id)));

	const groupDetailTo = (id: number) =>
		pagesNotInSideBar.GroupTemplateDetail.path.replace(':id', encodeURIComponent(String(id)));

	if (loading && !summary) {
		return (
			<div className='d-flex justify-content-center py-5'>
				<AbaciLoader />
			</div>
		);
	}

	const totalCounts = summary?.total_counts;
	const totalClock = summary?.total_clock_counts;
	const schedules = Array.isArray(summary?.schedules) ? summary.schedules : [];

	const present = countValue(totalCounts, 'PRESENT');
	const absent = countValue(totalCounts, 'ABSENT');
	const leave = countValue(totalCounts, 'LEAVE');
	const attendanceTotal = present + absent + leave;

	const statCards = summary
		? buildStatCards(summary, totalCounts, totalClock, !isScheduleView)
		: [];

	const shiftChips = Array.isArray(scheduleDetail?.shift_details)
		? scheduleDetail.shift_details
		: [];
	const groupDetails = Array.isArray(scheduleDetail?.group_details)
		? scheduleDetail.group_details
		: [];

	return (
		<div className={classNames('hr-dashboard', isScheduleView && 'hr-dashboard--schedule')}>
			<div className='hr-dashboard__hero mb-4'>
				<div className='row align-items-center'>
					<div className='col-md-8'>
						<span className='hr-dashboard__hero-badge'>
							{isScheduleView ? "Today's attendance" : "Today's overview"}
						</span>
						<h1 className='hr-dashboard__hero-title'>
							{isScheduleView && scheduleDetail?.schedule_name
								? scheduleDetail.schedule_name
								: dateLabel}
						</h1>
						{isScheduleView ? (
							<>
								<p className='hr-dashboard__hero-meta mb-1'>{dateLabel}</p>
								{summary?.timezone ? (
									<p className='hr-dashboard__hero-meta mb-2'>{summary.timezone}</p>
								) : null}
								{scheduleDetail?.status ? (
									<Chip
										size='small'
										label={
											getAttendanceStatusMeta(scheduleDetail.status)?.label ||
											scheduleDetail.status
										}
										sx={{ ...dashboardStatusChipSx(scheduleDetail.status), mb: 1 }}
									/>
								) : null}
								{shiftChips.length > 0 ? (
									<div className='hr-dashboard__shift-list'>
										{shiftChips.map((shift, i) => (
											<span key={i} className='hr-dashboard__shift-chip'>
												<AccessTimeIcon sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
												{formatShiftRange(shift)}
											</span>
										))}
									</div>
								) : null}
							</>
						) : summary?.timezone ? (
							<p className='hr-dashboard__hero-meta mb-0'>{summary.timezone}</p>
						) : null}
					</div>
					<div className='col-md-4 hr-dashboard__hero-stat'>
						<div className='hr-dashboard__hero-stat-value'>
							{summary?.total_employees ?? '—'}
						</div>
						<div className='hr-dashboard__hero-stat-label'>
							<GroupsOutlinedIcon
								sx={{ fontSize: '1rem', verticalAlign: 'text-bottom', mr: 0.5 }}
							/>
							{isScheduleView ? (
								<>
									employees on this schedule
									{(scheduleDetail?.direct_employees ?? 0) > 0 && (
										<span className='d-block small mt-1 opacity-75'>
											{scheduleDetail?.direct_employees} direct (non-group)
										</span>
									)}
								</>
							) : (
								<>
									employees across {summary?.total_schedules ?? 0} schedule
									{summary?.total_schedules === 1 ? '' : 's'}
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{summary ? (
				<>
					<div className='row g-3 mb-4'>
						{statCards.map((stat) => (
							<div
								key={stat.label}
								className={classNames(
									'col-6',
									isScheduleView ? 'col-md-4 col-xl' : 'col-md-4 col-xl-2',
								)}>
								<StatCard {...stat} />
							</div>
						))}
					</div>

					{/* <div className='row g-3 mb-4'>
						<div className='col-lg-7'>
							<div className='hr-dashboard__panel'>
								<div className='hr-dashboard__panel-title'>Attendance breakdown</div>
								<ProgressRow
									label={ATTENDANCE_STATUS_META.PRESENT.label}
									value={present}
									total={attendanceTotal}
									tone={DASHBOARD_ATTENDANCE_THEME.present}
								/>
								<ProgressRow
									label={ATTENDANCE_STATUS_META.ABSENT.label}
									value={absent}
									total={attendanceTotal}
									tone={DASHBOARD_ATTENDANCE_THEME.absent}
								/>
								<ProgressRow
									label={ATTENDANCE_STATUS_META.LEAVE.label}
									value={leave}
									total={attendanceTotal}
									tone={DASHBOARD_ATTENDANCE_THEME.leave}
								/>
							</div>
						</div>
						<div className='col-lg-5'>
							<div className='hr-dashboard__panel'>
								<div className='hr-dashboard__panel-title'>Clock activity</div>
								<div className='hr-dashboard__clock-pill hr-dashboard__clock-pill--in'>
									<div className='hr-dashboard__clock-pill-row'>
										<span className='d-flex align-items-center gap-2'>
											<LoginOutlinedIcon fontSize='small' />
											Clocked in
										</span>
										<span className='hr-dashboard__clock-pill-value'>
											{clockValue(totalClock, 'clocked_in')}
										</span>
									</div>
									<DashboardClockedUsersRow users={clockedUsersFromCounts(totalClock)} />
								</div>
								<div className='hr-dashboard__clock-pill hr-dashboard__clock-pill--out'>
									<div className='hr-dashboard__clock-pill-row'>
										<span className='d-flex align-items-center gap-2'>
											<LogoutOutlinedIcon fontSize='small' />
											Clocked out
										</span>
										<span className='hr-dashboard__clock-pill-value'>
											{clockValue(totalClock, 'clocked_out')}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div> */}

					{isScheduleView && scheduleDetail ? (
						<>
							<div className='hr-dashboard__section-title'>
								<GroupsOutlinedIcon fontSize='small' />
								Groups on this schedule
							</div>
							{groupDetails.length === 0 ? (
								<p className='text-muted'>No groups assigned to this schedule today.</p>
							) : (
								<div className='row g-3 mb-4'>
									{groupDetails.map((group) => (
										<div key={group.group_id} className='col-12 col-md-6 col-xl-4'>
											<div className='hr-dashboard__schedule-card'>
												<h3 className='hr-dashboard__schedule-name text-warning mb-3'>
													{group.group_name || '—'}
												</h3>
												<MetricPillsGrid
													pills={attendanceMetricPills(
														group.total_employees ?? 0,
														group.counts,
														group.clock_counts,
														false,
													)}
												/>
												<DashboardClockedUsersRow
													users={clockedUsersFromCounts(group.clock_counts)}
												/>
												{group.group_id != null ? (
													<Link
														to={groupDetailTo(group.group_id)}
														className='hr-dashboard__view-link'>
														View group
														<ArrowForwardIcon sx={{ fontSize: '1rem' }} />
													</Link>
												) : null}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					) : (
						<>
							<div className='hr-dashboard__section-title'>
								<CalendarMonthOutlinedIcon fontSize='small' />
								Schedules today
							</div>
							{schedules.length === 0 ? (
								<p className='text-muted'>No schedules for today.</p>
							) : (
								<div className='row g-3'>
									{schedules.map((row) => (
										<div key={row.schedule_id} className='col-12 col-md-6 col-xl-4'>
											<ScheduleDashboardCard
												row={row}
												scheduleDetailTo={scheduleDetailTo}
												groupDetailTo={groupDetailTo}
											/>
										</div>
									))}
								</div>
							)}
						</>
					)}
				</>
			) : !loading ? (
				<p className='text-muted'>
					{isScheduleView
						? 'No attendance summary for this schedule today.'
						: 'No summary available for today.'}
				</p>
			) : null}
		</div>
	);
};

export default DashboardDaySummary;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../components/bootstrap/Card';
import AbaciLoader from '../../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../../axiosInstance';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { getAttendanceStatusMeta } from '../../Attendance/attendanceStatusUtils';
import {
	DASHBOARD_ATTENDANCE_THEME,
	dashboardStatStyle,
	type DashboardTone,
} from '../../Dashboard/dashboardTheme';
import {
	formatClockinStatusLabel,
	formatSiteAttendanceUserName,
	summaryCount,
	type SiteAttendanceStatusFilter,
	type SiteAttendanceSummary,
} from './siteAttendanceUtils';
import SiteDetailsHeroMeta from './SiteDetails';

type SiteAttendanceResponse = {
	count?: number;
	results?: unknown[];
	site?: { id?: number; name?: string };
	date?: string;
	attendance_summary?: SiteAttendanceSummary;
};

type StatCardConfig = {
	key: Exclude<SiteAttendanceStatusFilter, 'all'>;
	label: string;
	tone: DashboardTone;
	icon: React.ReactNode;
	tooltip: string;
};

const STAT_CARDS: StatCardConfig[] = [
	{
		key: 'scheduled',
		label: 'Scheduled',
		tone: DASHBOARD_ATTENDANCE_THEME.schedules,
		icon: <CalendarMonthOutlinedIcon />,
		tooltip: 'Employees scheduled at this site today.',
	},
	{
		key: 'present',
		label: 'Present',
		tone: DASHBOARD_ATTENDANCE_THEME.present,
		icon: <CheckCircleOutlineIcon />,
		tooltip: 'Employees marked present at this site today.',
	},
	{
		key: 'absent',
		label: 'Absent',
		tone: DASHBOARD_ATTENDANCE_THEME.absent,
		icon: <CancelOutlinedIcon />,
		tooltip: 'Employees marked absent at this site today.',
	},
	{
		key: 'leave',
		label: 'On leave',
		tone: DASHBOARD_ATTENDANCE_THEME.leave,
		icon: <EventBusyOutlinedIcon />,
		tooltip: 'Employees on approved leave at this site today.',
	},
	{
		key: 'clocked_in',
		label: 'Clocked in',
		tone: DASHBOARD_ATTENDANCE_THEME.clockIn,
		icon: <LoginOutlinedIcon />,
		tooltip: 'Employees currently clocked in at this site.',
	},
	{
		key: 'clocked_out',
		label: 'Clocked out',
		tone: DASHBOARD_ATTENDANCE_THEME.clockOut,
		icon: <LogoutOutlinedIcon />,
		tooltip: 'Employees clocked out at this site today.',
	},
];

const statusChipSx = (status: string | undefined) => {
	const meta = getAttendanceStatusMeta(status);
	return {
		fontWeight: 600,
		bgcolor: meta?.color ? `${meta.color}22` : 'rgba(var(--bs-secondary-rgb), 0.12)',
		color: meta?.color ?? 'var(--bs-secondary-color)',
	};
};

type SiteAttendanceSectionProps = {
	siteId?: string;
	site?: Record<string, unknown> | null;
	siteName?: string;
};

const SiteAttendanceSection = ({ siteId, site, siteName }: SiteAttendanceSectionProps) => {
	const tableRef = useRef<any>(null);
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [statusFilter, setStatusFilter] = useState<SiteAttendanceStatusFilter>('all');
	const [summaryMeta, setSummaryMeta] = useState<{
		summary: SiteAttendanceSummary | null;
		date: string | null;
		siteLabel: string;
		totalEmployees: number;
	}>({
		summary: null,
		date: null,
		siteLabel: siteName || '',
		totalEmployees: 0,
	});
	const [metaLoading, setMetaLoading] = useState(true);

	const dateLabel = useMemo(() => {
		const dateStr = summaryMeta.date ?? dayjs().format('YYYY-MM-DD');
		const parsed = dayjs(dateStr);
		return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY') : dateStr;
	}, [summaryMeta.date]);

	const fetchSummaryMeta = useCallback(() => {
		if (!siteId) {
			setSummaryMeta({
				summary: null,
				date: null,
				siteLabel: siteName || '',
				totalEmployees: 0,
			});
			setMetaLoading(false);
			return undefined;
		}

		let cancelled = false;
		setMetaLoading(true);
		authAxios
			.get<SiteAttendanceResponse>(`/api/hr/sites/${siteId}/attendance/`, {
				params: { limit: 1, offset: 0 },
			})
			.then((res) => {
				if (cancelled) return;
				const data = res?.data;
				setSummaryMeta({
					summary: data?.attendance_summary ?? null,
					date: data?.date ?? null,
					siteLabel: data?.site?.name || siteName || '',
					totalEmployees: typeof data?.count === 'number' ? data.count : 0,
				});
			})
			.catch((err) => {
				if (!cancelled) {
					setSummaryMeta({
						summary: null,
						date: null,
						siteLabel: siteName || '',
						totalEmployees: 0,
					});
					showErrorRef.current(err);
				}
			})
			.finally(() => {
				if (!cancelled) setMetaLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [siteId, siteName]);

	useEffect(() => {
		const cleanup = fetchSummaryMeta();
		return cleanup;
	}, [fetchSummaryMeta]);

	useEffect(() => {
		tableRef.current?.onQueryChange?.();
	}, [statusFilter, siteId]);

	const handleCardClick = (key: Exclude<SiteAttendanceStatusFilter, 'all'>) => {
		setStatusFilter((prev) => (prev === key ? 'all' : key));
	};

	const columns = useMemo(
		() => [
			{
				title: 'Employee',
				field: 'user',
				sorting: false,
				render: (rowData: any) => formatSiteAttendanceUserName(rowData?.user),
			},
			{
				title: 'Employee code',
				field: 'employee_code',
				sorting: false,
				render: (rowData: any) => rowData?.user?.employee_code || '----',
			},
			{
				title: 'Email',
				field: 'email',
				sorting: false,
				render: (rowData: any) => rowData?.user?.email || '----',
			},
			{
				title: 'Group',
				field: 'scheduling_group',
				sorting: false,
				render: (rowData: any) => rowData?.scheduling_group?.name || '----',
			},
			{
				title: 'Scheduled',
				field: 'is_scheduled',
				sorting: false,
				render: (rowData: any) => (rowData?.is_scheduled ? 'Yes' : 'No'),
			},
			{
				title: 'Attendance',
				field: 'attendance_status',
				sorting: false,
				render: (rowData: any) => {
					const status = rowData?.attendance_status;
					if (!status) return '----';
					const meta = getAttendanceStatusMeta(status);
					return (
						<Chip
							size='small'
							label={meta?.label || status}
							sx={statusChipSx(status)}
						/>
					);
				},
			},
			{
				title: 'Clock status',
				field: 'clockin_status',
				sorting: false,
				render: (rowData: any) => {
					const status = rowData?.clockin_status;
					if (!status) return '----';
					return (
						<Chip
							size='small'
							label={formatClockinStatusLabel(status)}
							sx={statusChipSx(status)}
						/>
					);
				},
			},
			{
				title: 'Remark',
				field: 'remark',
				sorting: false,
				render: (rowData: any) => rowData?.remark || '----',
			},
		],
		[],
	);

	const activeFilterLabel =
		statusFilter === 'all'
			? null
			: STAT_CARDS.find((card) => card.key === statusFilter)?.label ?? statusFilter;

	if (!siteId) return null;

	const heroSiteName =
		site?.name != null ? String(site.name) : summaryMeta.siteLabel || siteName || 'Site';

	return (
		<div className='hr-dashboard hr-dashboard--schedule'>
			<div className='hr-dashboard__hero mb-4'>
				<div className='row align-items-center'>
					<div className='col-md-8'>
						<span className='hr-dashboard__hero-badge'>Today&apos;s attendance</span>
						<h1 className='hr-dashboard__hero-title'>{heroSiteName}</h1>
						<p className='hr-dashboard__hero-meta mb-0'>{dateLabel}</p>
						<SiteDetailsHeroMeta site={site} />
					</div>
					<div className='col-md-4 hr-dashboard__hero-stat'>
						<div className='hr-dashboard__hero-stat-value'>
							{metaLoading ? '—' : summaryMeta.totalEmployees}
						</div>
						<div className='hr-dashboard__hero-stat-label'>
							<GroupsOutlinedIcon
								sx={{ fontSize: '1rem', verticalAlign: 'text-bottom', mr: 0.5 }}
							/>
							employees at this site
						</div>
					</div>
				</div>
			</div>

			{metaLoading && !summaryMeta.summary ? (
				<div className='d-flex justify-content-center py-4'>
					<AbaciLoader />
				</div>
			) : (
				<div className='row g-3 mb-4'>
					{STAT_CARDS.map((stat) => {
						const isActive = statusFilter === stat.key;
						return (
							<div key={stat.key} className='col-6 col-md-4 col-xl'>
								<Tooltip title={stat.tooltip} arrow placement='top'>
									<button
										type='button'
										className={classNames(
											'hr-dashboard__stat-card',
											'hr-dashboard__stat-card--link',
											'w-100',
											isActive && 'hr-dashboard__stat-card--active',
										)}
										style={dashboardStatStyle(stat.tone)}
										onClick={() => handleCardClick(stat.key)}
										aria-pressed={isActive}>
										<div className='hr-dashboard__stat-icon'>{stat.icon}</div>
										<div className='hr-dashboard__stat-value'>
											{summaryCount(summaryMeta.summary, stat.key)}
										</div>
										<div className='hr-dashboard__stat-label'>{stat.label}</div>
									</button>
								</Tooltip>
							</div>
						);
					})}
				</div>
			)}

			<Card>
				<CardHeader>
					<CardLabel icon='Groups' iconColor='warning'>
						<CardTitle tag='div' className='h5 text-warning mb-0'>
							Site attendance
							{activeFilterLabel ? (
								<span className='text-muted fs-6 fw-normal ms-2'>
									· filtered by {activeFilterLabel}
								</span>
							) : null}
						</CardTitle>
					</CardLabel>
				</CardHeader>
				<CardBody className='table-responsive pt-0'>
					<div className='material-table-wrapper'>
						<ThemeProvider theme={theme}>
							<MaterialTable
								key={`${siteId}-${statusFilter}`}
								title=' '
								columns={columns as any}
								tableRef={tableRef}
								data={(query) =>
									new Promise((resolve, reject) => {
										const params: Record<string, string | number> = {
											limit: query.pageSize,
											offset: query.pageSize * query.page,
										};
										if (statusFilter !== 'all') {
											params.status = statusFilter;
										}

										authAxios
											.get<SiteAttendanceResponse>(
												`/api/hr/sites/${siteId}/attendance/`,
												{ params },
											)
											.then((response) => {
												const data = response?.data;
												if (data?.attendance_summary) {
													setSummaryMeta((prev) => ({
														...prev,
														summary: data.attendance_summary ?? null,
														date: data.date ?? prev.date,
														siteLabel:
															data.site?.name || prev.siteLabel || siteName || '',
														totalEmployees:
															statusFilter === 'all' && typeof data.count === 'number'
																? data.count
																: prev.totalEmployees,
													}));
												}
												resolve({
													data: Array.isArray(data?.results) ? data.results : [],
													page: query.page,
													totalCount: data?.count ?? 0,
												});
											})
											.catch((error) => {
												showErrorRef.current(error);
												reject({
													data: [],
													page: query.page,
													totalCount: 0,
												});
											});
									})
								}
								options={{
									headerStyle: headerStyles(),
									rowStyle: rowStyles(),
									debounceInterval: 300,
									filtering: false,
									search: false,
									toolbar: false,
									pageSize: 5,
									pageSizeOptions: [5, 10, 20, 50],
								}}
							/>
						</ThemeProvider>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default SiteAttendanceSection;

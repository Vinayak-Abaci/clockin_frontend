import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { authAxios } from '../../axiosInstance';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import { allRoutesObject } from '../../routes/RoutesMenu';
import { buildLeaveRequestsTablePath } from '../LeaveManagement/LeaveRequest/leaveRequestTableNavigation';
import { statusColorCodes } from '../../helpers/constants';
import {
	DASHBOARD_LEAVE_THEME,
	dashboardStatStyle,
	type DashboardTone,
} from './dashboardTheme';

type LeaveStatusCounts = Record<string, number | undefined>;

export type LeaveTypeSummary = {
	leave_type_id?: number;
	id?: number;
	leave_type_name?: string;
	name?: string;
	total?: number;
	total_requests?: number;
	counts?: LeaveStatusCounts;
};

export type RecentLeaveRequest = {
	id?: number;
	user_name?: string;
	employee_name?: string;
	user?: { name?: string; first_name?: string; last_name?: string };
	leave_type_name?: string;
	leave_type?: { name?: string };
	from_date?: string;
	to_date?: string;
	status?: string;
};

export type LeaveRequestsSummary = {
	year?: number;
	month?: number | null;
	summary?: LeaveStatusCounts & { total?: number; total_requests?: number };
	total_requests?: number;
	total?: number;
	total_counts?: LeaveStatusCounts;
	counts?: LeaveStatusCounts;
	by_leave_type?: LeaveTypeSummary[];
	leave_types?: LeaveTypeSummary[];
	recent_requests?: RecentLeaveRequest[];
	requests?: RecentLeaveRequest[];
};

const SUMMARY_META_KEYS = new Set(['total', 'total_requests']);

const toCount = (value: unknown): number | null => {
	if (typeof value === 'number' && !Number.isNaN(value)) return value;
	if (typeof value === 'bigint') return Number(value);
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

function normalizeStatusKey(status: string) {
	return String(status || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_');
}

const extractStatusCounts = (source: Record<string, unknown>): LeaveStatusCounts => {
	const counts: LeaveStatusCounts = {};
	Object.entries(source).forEach(([key, value]) => {
		if (SUMMARY_META_KEYS.has(key)) return;
		const count = toCount(value);
		if (count == null) return;
		counts[normalizeStatusKey(key)] = count;
	});
	return counts;
};

const normalizeSummaryPayload = (raw: unknown): LeaveRequestsSummary | null => {
	const wrapped = asRecord(raw);
	if (!wrapped) return null;

	const data = asRecord(wrapped.data) ?? wrapped;
	const summaryBlock =
		asRecord(data.summary) ?? asRecord(data.total_counts) ?? asRecord(data.counts);

	const counts: LeaveStatusCounts = summaryBlock ? extractStatusCounts(summaryBlock) : {};
	const nestedCounts = asRecord(data.total_counts) ?? asRecord(data.counts);
	if (nestedCounts && nestedCounts !== summaryBlock) {
		Object.assign(counts, extractStatusCounts(nestedCounts));
	}

	const total =
		toCount(data.total) ??
		toCount(data.total_requests) ??
		(summaryBlock
			? (toCount(summaryBlock.total) ?? toCount(summaryBlock.total_requests))
			: null);

	const typed = data as LeaveRequestsSummary;

	return {
		...typed,
		total: total ?? undefined,
		total_requests: total ?? undefined,
		counts:
			Object.keys(counts).length > 0 ? counts : typed.counts ?? typed.total_counts,
		by_leave_type: typed.by_leave_type ?? typed.leave_types,
		recent_requests: typed.recent_requests ?? typed.requests,
	};
};

const LEAVE_STATUS_ORDER = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

const LEAVE_STATUS_LABELS: Record<string, string> = {
	PENDING: 'Pending',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
	CANCELLED: 'Cancelled',
};

const leaveStatusTheme = (status: string): DashboardTone => {
	const key = String(status || '').trim().toUpperCase();
	const hex = statusColorCodes?.[key];
	const map: Record<string, DashboardTone> = {
		PENDING: DASHBOARD_LEAVE_THEME.pending,
		APPROVED: DASHBOARD_LEAVE_THEME.approved,
		REJECTED: DASHBOARD_LEAVE_THEME.rejected,
		CANCELLED: DASHBOARD_LEAVE_THEME.cancelled,
	};
	if (map[key]) return map[key];
	return {
		color: hex ?? 'var(--bs-secondary-color)',
		bg: hex ? `${hex}22` : 'rgba(var(--bs-secondary-rgb), 0.12)',
		fill: hex ? `${hex}59` : 'rgba(var(--bs-secondary-rgb), 0.35)',
	};
};

const countFromMap = (counts: LeaveStatusCounts | undefined, key: string) => {
	const v = counts?.[key];
	return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
};

const resolveCounts = (data: LeaveRequestsSummary | null) =>
	data?.total_counts ?? data?.counts ?? {};

const resolveTotal = (data: LeaveRequestsSummary | null, counts: LeaveStatusCounts) => {
	if (typeof data?.total_requests === 'number') return data.total_requests;
	if (typeof data?.total === 'number') return data.total;
	return LEAVE_STATUS_ORDER.reduce((sum, key) => sum + countFromMap(counts, key), 0);
};

const resolveLeaveTypes = (data: LeaveRequestsSummary | null): LeaveTypeSummary[] => {
	const list = data?.by_leave_type ?? data?.leave_types;
	return Array.isArray(list) ? list : [];
};

const resolveRecentRequests = (data: LeaveRequestsSummary | null): RecentLeaveRequest[] => {
	const list = data?.recent_requests ?? data?.requests;
	return Array.isArray(list) ? list : [];
};

const leaveTypeName = (row: LeaveTypeSummary) =>
	row.leave_type_name ?? row.name ?? '—';

const leaveTypeTotal = (row: LeaveTypeSummary) => {
	if (typeof row.total === 'number') return row.total;
	if (typeof row.total_requests === 'number') return row.total_requests;
	const counts = row.counts ?? {};
	return LEAVE_STATUS_ORDER.reduce((sum, key) => sum + countFromMap(counts, key), 0);
};

const requestEmployeeName = (row: RecentLeaveRequest) => {
	if (row.user_name) return row.user_name;
	if (row.employee_name) return row.employee_name;
	const u = row.user;
	if (u && typeof u === 'object') {
		const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
		return full || u.name || '—';
	}
	return '—';
};

const requestLeaveTypeName = (row: RecentLeaveRequest) =>
	row.leave_type_name ?? row.leave_type?.name ?? '—';

type StatCardProps = {
	label: string;
	value: number;
	tone: DashboardTone;
	icon: React.ReactNode;
	to?: string;
};

const StatCard = ({ label, value, tone, icon, to }: StatCardProps) => {
	const content = (
		<>
			<div className='hr-dashboard__stat-icon'>{icon}</div>
			<div className='hr-dashboard__stat-value'>{value}</div>
			<div className='hr-dashboard__stat-label'>{label}</div>
		</>
	);

	if (!to) {
		return (
			<div className='hr-dashboard__stat-card' style={dashboardStatStyle(tone)}>
				{content}
			</div>
		);
	}

	return (
		<Link
			to={to}
			className='hr-dashboard__stat-card hr-dashboard__stat-card--link'
			style={dashboardStatStyle(tone)}
			aria-label={`View ${label} in leave requests`}>
			{content}
		</Link>
	);
};

const DashboardLeaveRequestsSummary = () => {
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [summary, setSummary] = useState<LeaveRequestsSummary | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSummary = useCallback(() => {
		let cancelled = false;
		setLoading(true);
		authAxios
			.get<LeaveRequestsSummary>('/api/hr/dashboard/leave-requests-summary/')
			.then((res) => {
				if (!cancelled) setSummary(normalizeSummaryPayload(res.data));
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
	}, []);

	useEffect(() => {
		const cleanup = fetchSummary();
		return cleanup;
	}, [fetchSummary]);

	if (loading && !summary) {
		return (
			<div className='hr-dashboard mt-4'>
				<div className='d-flex justify-content-center py-4'>
					<AbaciLoader />
				</div>
			</div>
		);
	}

	const counts = resolveCounts(summary);
	const total = resolveTotal(summary, counts);
	const leaveTypes = resolveLeaveTypes(summary);
	const recentRequests = resolveRecentRequests(summary);

	const statCards: StatCardProps[] = [
		{
			label: 'Total requests',
			value: total,
			tone: DASHBOARD_LEAVE_THEME.total,
			icon: <PendingActionsOutlinedIcon />,
			to: buildLeaveRequestsTablePath(),
		},
		...LEAVE_STATUS_ORDER.map((key) => ({
			label: LEAVE_STATUS_LABELS[key] ?? key,
			value: countFromMap(counts, key),
			tone: leaveStatusTheme(key),
			icon:
				key === 'APPROVED' ? (
					<CheckCircleOutlineIcon />
				) : key === 'PENDING' ? (
					<PendingActionsOutlinedIcon />
				) : (
					<CancelOutlinedIcon />
				),
			to: buildLeaveRequestsTablePath({ status: key }),
		})),
	];

	return (
		<div className='hr-dashboard mt-4 pt-2'>
			<div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
				<div className='hr-dashboard__section-title mb-0'>
					<EventBusyOutlinedIcon fontSize='small' />
					Leave requests
				</div>
				<Link to={allRoutesObject.LeaveRequests.path} className='hr-dashboard__view-link mt-0'>
					View all
					<ArrowForwardIcon sx={{ fontSize: '1rem' }} />
				</Link>
			</div>

			{summary ? (
				<>
					<div className='hr-dashboard__stat-row'>
						{statCards.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>

					{leaveTypes.length > 0 ? (
						<div className='row g-3 mb-4'>
							<div className='col-12'>
								<div className='hr-dashboard__panel'>
									<div className='hr-dashboard__panel-title'>By leave type</div>
										{leaveTypes.map((row, i) => {
											const typeCounts = row.counts ?? {};
											const typeTotal = leaveTypeTotal(row);
											const pending = countFromMap(typeCounts, 'PENDING');
											return (
												<div
													key={row.leave_type_id ?? row.id ?? i}
													className='hr-dashboard__progress-row'>
													<div className='hr-dashboard__progress-head'>
														<span className='text-warning fw-semibold'>
															{leaveTypeName(row)}
														</span>
														<span className='text-muted'>{typeTotal}</span>
													</div>
													<div className='d-flex flex-wrap gap-2'>
														{pending > 0 ? (
															<Chip
																size='small'
																label={`Pending: ${pending}`}
																sx={{
																	fontWeight: 600,
																	color: leaveStatusTheme('PENDING').color,
																	bgcolor: leaveStatusTheme('PENDING').bg,
																}}
															/>
														) : null}
														{countFromMap(typeCounts, 'APPROVED') > 0 ? (
															<Chip
																size='small'
																label={`Approved: ${countFromMap(typeCounts, 'APPROVED')}`}
																sx={{
																	fontWeight: 600,
																	color: leaveStatusTheme('APPROVED').color,
																	bgcolor: leaveStatusTheme('APPROVED').bg,
																}}
															/>
														) : null}
													</div>
												</div>
											);
										})}
								</div>
							</div>
						</div>
					) : null}

					{recentRequests.length > 0 ? (
						<>
							<div className='hr-dashboard__section-title'>Recent requests</div>
							<div className='hr-dashboard__panel p-0 overflow-hidden'>
								<div className='table-responsive'>
									<table className='table table-modern table-hover mb-0'>
										<thead>
											<tr>
												<th>Employee</th>
												<th>Leave type</th>
												<th>From</th>
												<th>To</th>
												<th>Status</th>
											</tr>
										</thead>
										<tbody>
											{recentRequests.map((row, i) => {
												const statusKey = normalizeStatusKey(row.status ?? '');
												const theme = leaveStatusTheme(statusKey);
												return (
													<tr key={row.id ?? i}>
														<td className='fw-semibold'>{requestEmployeeName(row)}</td>
														<td>{requestLeaveTypeName(row)}</td>
														<td>{row.from_date || '—'}</td>
														<td>{row.to_date || '—'}</td>
														<td>
															<Chip
																size='small'
																label={row.status || '—'}
																sx={{
																	fontWeight: 600,
																	color: theme.color,
																	bgcolor: theme.bg,
																}}
															/>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</>
					) : null}
				</>
			) : !loading ? (
				<p className='text-muted mb-0'>No leave request summary available.</p>
			) : null}
		</div>
	);
};

export default DashboardLeaveRequestsSummary;

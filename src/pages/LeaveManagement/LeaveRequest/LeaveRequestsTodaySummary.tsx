import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { authAxios } from '../../../axiosInstance';
import AbaciLoader from '../../../components/AbaciLoader/AbaciLoader';
import Card, { CardBody, CardHeader } from '../../../components/bootstrap/Card';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { statusColorCodes } from '../../../helpers/constants';
import {
	DASHBOARD_LEAVE_THEME,
	dashboardStatStyle,
	type DashboardTone,
} from '../../Dashboard/dashboardTheme';
import { todayLeaveRequestDateParam } from './leaveRequestTableNavigation';

type StatusCounts = Record<string, number | undefined>;

export type LeaveRequestsTodaySummaryData = {
	date?: string;
	timezone?: string;
	total?: number;
	total_requests?: number;
	total_counts?: StatusCounts;
	counts?: StatusCounts;
	[key: string]: unknown;
};

const META_KEYS = new Set([
	'total',
	'total_requests',
	'date',
	'timezone',
	'total_counts',
	'counts',
	'total_on_leave',
	'on_leave_today',
	'starting_today',
	'ending_today',
]);

const LEAVE_STATUS_ORDER = ['APPLIED', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

const LEAVE_STATUS_LABELS: Record<string, string> = {
	APPLIED: 'Applied',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
	CANCELLED: 'Cancelled',
};

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

const countFromMap = (counts: StatusCounts | undefined, key: string) =>
	toCount(counts?.[key]) ?? 0;

const extractStatusCounts = (source: Record<string, unknown>): StatusCounts => {
	const flat: StatusCounts = {};
	Object.entries(source).forEach(([key, value]) => {
		if (!META_KEYS.has(key)) {
			const count = toCount(value);
			if (count != null) flat[key] = count;
		}
	});
	return flat;
};

const readTotal = (...sources: Array<Record<string, unknown> | null | undefined>): number | null => {
	for (const source of sources) {
		if (!source) continue;
		for (const key of ['total', 'total_requests', 'total_today'] as const) {
			const count = toCount(source[key]);
			if (count != null) return count;
		}
	}
	return null;
};

const normalizeSummaryPayload = (raw: unknown): LeaveRequestsTodaySummaryData | null => {
	const wrapped = asRecord(raw);
	if (!wrapped) return null;

	const data = asRecord(wrapped.data) ?? wrapped;
	const nested = asRecord(data.total_counts) ?? asRecord(data.counts);
	const normalized: LeaveRequestsTodaySummaryData = { ...data };

	if (nested) {
		if (toCount(normalized.total) == null) {
			const nestedTotal = readTotal(nested);
			if (nestedTotal != null) normalized.total = nestedTotal;
		}

		Object.entries(extractStatusCounts(nested)).forEach(([key, value]) => {
			if (toCount(normalized[key]) == null) normalized[key] = value;
		});
	}

	if (toCount(normalized.total) == null) {
		const rootTotal = readTotal(data);
		if (rootTotal != null) normalized.total = rootTotal;
	}

	return normalized;
};

const resolveCounts = (data: LeaveRequestsTodaySummaryData | null): StatusCounts => {
	if (!data) return {};

	const flat = extractStatusCounts(data as Record<string, unknown>);
	const nested = asRecord(data.total_counts) ?? asRecord(data.counts);
	if (!nested) return flat;

	return { ...flat, ...extractStatusCounts(nested) };
};

const resolveTotal = (data: LeaveRequestsTodaySummaryData | null) => {
	if (!data) return 0;
	const nested = asRecord(data.total_counts) ?? asRecord(data.counts);
	return readTotal(data as Record<string, unknown>, nested) ?? 0;
};

const leaveStatusTheme = (status: string): DashboardTone => {
	const key = String(status || '').trim().toUpperCase();
	const hex = statusColorCodes?.[key];
	const map: Record<string, DashboardTone> = {
		APPLIED: DASHBOARD_LEAVE_THEME.pending,
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

const statusIcon = (key: string) => {
	switch (key) {
		case 'APPLIED':
			return <PendingActionsOutlinedIcon />;
		case 'APPROVED':
			return <CheckCircleOutlineIcon />;
		default:
			return <CancelOutlinedIcon />;
	}
};

type StatCardProps = {
	label: string;
	value: number;
	tone: DashboardTone;
	icon: React.ReactNode;
	onClick?: () => void;
	active?: boolean;
};

const StatCard = ({ label, value, tone: cardTone, icon, onClick, active }: StatCardProps) => {
	const content = (
		<>
			<div className='hr-dashboard__stat-icon'>{icon}</div>
			<div className='hr-dashboard__stat-value'>{value}</div>
			<div className='hr-dashboard__stat-label'>{label}</div>
		</>
	);

	const className = classNames('hr-dashboard__stat-card', {
		'hr-dashboard__stat-card--link': onClick,
		'hr-dashboard__stat-card--active': active,
	});

	const style = dashboardStatStyle(cardTone);

	if (onClick) {
		return (
			<button
				type='button'
				className={className}
				style={style}
				onClick={onClick}
				aria-label={`Filter leave requests: ${label}`}
				aria-pressed={active}>
				{content}
			</button>
		);
	}

	return (
		<div className={className} style={style}>
			{content}
		</div>
	);
};

type LeaveRequestsTodaySummaryProps = {
	refreshKey?: number;
	activeStatus?: string | null;
	activeDate?: string | null;
	onCardClick?: (status: string | null) => void;
};

const LeaveRequestsTodaySummary = ({
	refreshKey = 0,
	activeStatus = null,
	activeDate = null,
	onCardClick,
}: LeaveRequestsTodaySummaryProps) => {
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [summary, setSummary] = useState<LeaveRequestsTodaySummaryData | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSummary = useCallback(() => {
		let cancelled = false;
		setLoading(true);

		authAxios
			.get<LeaveRequestsTodaySummaryData>('/api/hr/leave-requests-today-summary/')
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
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const cleanup = fetchSummary();
		return cleanup;
	}, [fetchSummary, refreshKey]);

	if (loading && !summary) {
		return (
			<Card stretch className='mb-3'>
				<CardHeader>
					<div className='hr-dashboard w-100'>
						<div className='hr-dashboard__section-title mb-0'>
							<TodayOutlinedIcon fontSize='small' />
							Today&apos;s leave summary
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<div className='d-flex justify-content-center py-3'>
						<AbaciLoader />
					</div>
				</CardBody>
			</Card>
		);
	}

	if (!summary) return null;

	const counts = resolveCounts(summary);
	const total = resolveTotal(summary);

	const todayDateParam = todayLeaveRequestDateParam();
	const isTodayFilterActive = activeDate === todayDateParam;

	const statCards: StatCardProps[] = [
		{
			label: 'Total',
			value: total,
			tone: DASHBOARD_LEAVE_THEME.total,
			icon: <TodayOutlinedIcon />,
			onClick: onCardClick ? () => onCardClick(null) : undefined,
			active: isTodayFilterActive && !activeStatus,
		},
		...LEAVE_STATUS_ORDER.map((key) => ({
			label: LEAVE_STATUS_LABELS[key],
			value: countFromMap(counts, key),
			tone: leaveStatusTheme(key),
			icon: statusIcon(key),
			onClick: onCardClick ? () => onCardClick(key) : undefined,
			active: isTodayFilterActive && activeStatus === key,
		})),
	];

	const dateLabel = summary.date || 'Today';
	const meta = [dateLabel, summary.timezone].filter(Boolean).join(' · ');

	return (
		<Card stretch className='mb-3'>
			<CardHeader>
				<div className='hr-dashboard w-100'>
					<div className='d-flex flex-wrap justify-content-between align-items-center gap-2'>
						<div className='hr-dashboard__section-title mb-0'>
							<TodayOutlinedIcon fontSize='small' />
							Today&apos;s leave summary
						</div>
						{meta ? (
							<span
								className='small fw-semibold'
								style={{ color: DASHBOARD_LEAVE_THEME.total.color }}>
								{meta}
							</span>
						) : null}
					</div>
				</div>
			</CardHeader>
			<CardBody>
				<div className='hr-dashboard'>
					<div className='hr-dashboard__stat-row mb-0'>
						{statCards.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default LeaveRequestsTodaySummary;

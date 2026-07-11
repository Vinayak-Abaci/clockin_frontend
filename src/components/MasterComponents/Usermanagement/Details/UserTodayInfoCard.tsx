import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { authAxios } from '../../../../axiosInstance';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StatusBadge from '../../../CustomComponent/StatusBadge';

type Props = { userId?: string; fillHeight?: boolean };

const LABEL_ICON_SX = { fontSize: 18, flexShrink: 0, display: 'block' } as const;

const TodayInfoLabel = ({
	icon,
	children,
}: {
	icon?: React.ReactNode;
	children: React.ReactNode;
}) => (
	<div className='d-flex align-items-center gap-2 text-warning fw-semibold fs-6 mb-2'>
		{icon ? (
			<span className='d-inline-flex align-items-center justify-content-center flex-shrink-0'>
				{icon}
			</span>
		) : (
			<span className='flex-shrink-0' style={{ width: 18 }} aria-hidden />
		)}
		<span className='lh-sm'>{children}</span>
	</div>
);

const TodayInfoValue = ({ children }: { children: React.ReactNode }) => (
	<div className='fw-semibold lh-base'>{children}</div>
);

const UserTodayInfoCard = ({ userId, fillHeight = false }: Props) => {
    const [detail, setDetail] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const today = dayjs().format('YYYY-MM-DD');
    const todayLabel = dayjs().format('dddd, MMMM D, YYYY');

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        setLoading(true);
        authAxios
            .get('/api/hr/attendance/calendar-detail/', {
                params: { calendar_type: 'user', user_id: userId, date: today },
            })
            .then((res) => {
                if (!cancelled) setDetail(res?.data ?? null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId, today]);



    return (
        <Card
            className={classNames('w-100', fillHeight && 'h-100 d-flex flex-column')}
            stretch={fillHeight}>
            <CardHeader>
                <CardLabel icon='Today' iconColor='warning'>
                    <CardTitle tag='div' className='h5 text-warning'>
                        {todayLabel}
                    </CardTitle>
                </CardLabel>
            </CardHeader>
            <CardBody className={fillHeight ? 'd-flex flex-column flex-grow-1' : undefined}>
                {loading ? (
                    <div className='d-flex justify-content-center py-4'>
                        <CustomSpinner />
                    </div>
                ) : !detail ? (
                    <p className='text-muted mb-0 small text-center py-4'>
                        No details available for today.
                    </p>
                ) : (
                    <div className='row g-3 align-items-start'>
                        <div className='col-12 col-md-6 col-xl-3 d-flex flex-column'>
                            <TodayInfoLabel>Status</TodayInfoLabel>
                            <TodayInfoValue>
                                <StatusBadge
                                    status={detail?.status || 'Not Available'}
                                    emptyFallback='Not Available'
                                />
                            </TodayInfoValue>
                        </div>
                        <div className='col-12 col-md-6 col-xl-3 d-flex flex-column'>
                            <TodayInfoLabel icon={<CalendarTodayIcon sx={LABEL_ICON_SX} />}>
                                Schedule
                            </TodayInfoLabel>
                            <TodayInfoValue>
                                {Array.isArray(detail?.schedule) && detail.schedule.length > 0 ? (
                                    <ul className='list-unstyled mb-0'>
                                        {detail.schedule.map((s: any, i: number) => (
                                            <li key={i}>
                                                {typeof s === 'string' || typeof s === 'number'
                                                    ? s
                                                    : s?.name ?? s?.shift_name ?? s?.display_name ?? '—'}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    'None'
                                )}
                                {Array.isArray(detail?.special_day) && detail.special_day.length > 0 ? (
                                    <ul className='list-unstyled text-muted small mt-1 mb-0'>
                                        {detail.special_day.map((sd: any, i: number) => (
                                            <li key={i}>
                                                {typeof sd === 'object' ? sd?.name ?? '—' : String(sd)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </TodayInfoValue>
                        </div>
                        <div className='col-12 col-md-6 col-xl-3 d-flex flex-column'>
                            <TodayInfoLabel icon={<HistoryToggleOffIcon sx={LABEL_ICON_SX} />}>
                                Leave
                            </TodayInfoLabel>
                            <TodayInfoValue>
                                {detail?.leave_requests?.length
                                    ? detail.leave_requests
                                          .map((l: any) => l?.leave_type?.name || 'Leave')
                                          .join(', ')
                                    : 'None'}
                            </TodayInfoValue>
                        </div>
                        <div className='col-12 col-md-6 col-xl-3 d-flex flex-column'>
                            <TodayInfoLabel icon={<AccessTimeIcon sx={LABEL_ICON_SX} />}>
                                Overtime
                            </TodayInfoLabel>
                            <TodayInfoValue>
                                {detail?.overtime || detail?.ot ? detail?.overtime || detail?.ot : 'None'}
                            </TodayInfoValue>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UserTodayInfoCard;
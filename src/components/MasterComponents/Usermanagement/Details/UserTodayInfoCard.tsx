import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import Chip from '@mui/material/Chip';
import { authAxios } from '../../../../axiosInstance';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StatusBadge from '../../../CustomComponent/StatusBadge';

type Props = { userId?: string; fillHeight?: boolean };

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
                if (!cancelled) setDetail(res.data);
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
            <CardBody className={fillHeight ? 'd-flex flex-column flex-grow-1 justify-content-center' : undefined}>
                {loading ? (
                    <div className='d-flex justify-content-center py-4'>
                        <CustomSpinner />
                    </div>
                ) : (
                    <div className='row g-3'>
                        <div className='col-12 col-md-3'>
                            <div className='text-warning fw-semibold fs-6 mb-2'>Status</div>
                            <StatusBadge
                                status={detail?.status || 'Not Available'}
                                emptyFallback='Not Available'
                            />
                        </div>
                        <div className='col-12 col-md-3'>
                            <div className='text-warning fw-semibold fs-6 mb-2'>
                                <CalendarTodayIcon fontSize='small' /> Schedule
                            </div>
                            <div className='fw-semibold'>
                                {Array.isArray(detail?.schedule) && detail.schedule.length > 0 ? (
                                    <ul className='mb-0 ps-3 fw-semibold small'>
                                        {detail.schedule.map((s: any, i: number) => (
                                            <li key={i}>
                                                {typeof s === 'string' || typeof s === 'number'
                                                    ? s
                                                    : s?.name ?? s?.shift_name ?? s?.display_name ?? '—'}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className='fw-semibold'>None</div>
                                )}
                                {Array.isArray(detail?.special_day) && detail.special_day.length > 0 && (
                                    <ul className='text-muted small mt-1 mb-0 ps-3'>
                                        {detail.special_day.map((sd: any, i: number) => (
                                            <li key={i}>{typeof sd === 'object' ? sd?.name ?? '—' : String(sd)}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                        </div>
                        <div className='col-12 col-md-3'>
                                <div className='text-warning fw-semibold fs-6 mb-2'>
                                    <HistoryToggleOffIcon fontSize='small' /> Leave
                            </div>
                            <div className='fw-semibold'>
                                {detail?.leave_requests.length
                                    ? detail?.leave_requests.map((l: any) => l?.leave_type?.name || 'Leave').join(', ')
                                    : 'None'}
                            </div>
                        </div>
                        <div className='col-12 col-md-3'>
                            <div className='text-warning fw-semibold fs-6 mb-2'>
                                <AccessTimeIcon fontSize='small' className='text-warning' /> Overtime
                            </div>
                            <div className='fw-semibold'>
                                {detail?.overtime || detail?.ot ? detail?.overtime || detail?.ot : 'None'}
                            </div>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UserTodayInfoCard;
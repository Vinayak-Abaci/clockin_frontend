import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import BackButton from '../../components/CustomComponent/Buttons/BackButton';
import ScheduleDetailSkeleton from '../../components/CustomComponent/Skeleton/ScheduleDetailSkeleton';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import ScheduleDetails from './ScheduleDetails';
import ScheduleShiftsTimeline from './ScheduleShiftsTimeline';
import ScheduleMonthlyCalendarSection from './ScheduleMonthlyCalendarSection';
import DashboardDaySummary from '../Dashboard/DashboardDaySummary';

const ScheduleDetailPage = () => {
	const { id } = useParams();
	const [schedule, setSchedule] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	const fetchSchedule = useCallback(() => {
		if (!id) {
			setSchedule(null);
			setLoading(false);
			return undefined;
		}
		let cancelled = false;
		setLoading(true);
		authAxios
			.get(`api/hr/schedules/${id}/`)
			.then((res) => {
				if (!cancelled) setSchedule(res?.data ?? null);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const cleanup = fetchSchedule();
		return cleanup;
	}, [fetchSchedule]);

	const refreshScheduleQuietly = useCallback(() => {
		if (!id) return;
		authAxios
			.get(`api/hr/schedules/${id}/`)
			.then((res) => setSchedule(res?.data ?? null))
			.catch(showErrorNotification);
	}, []);

	return (
		<PageWrapper title='Schedule details'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h6'>
						Schedule Management
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid' className='position-relative'>
				{loading && <ScheduleDetailSkeleton />}
				<div className={loading ? 'd-none' : undefined}>
					<div className='row'>
						{id ? (
							<div className='col-12 mb-4'>
								<DashboardDaySummary scheduleId={id} />
							</div>
						) : null}
						<div className='col-12 mb-4'>
							<ScheduleDetails
								schedule={schedule}
								scheduleId={id}
								onGroupsChanged={refreshScheduleQuietly}
							/>
						</div>
						<div className='col-12 mb-4'>
							<ScheduleShiftsTimeline shifts={schedule?.shifts} />
						</div>
						<div className='col-12'>
							<ScheduleMonthlyCalendarSection scheduleId={id} />
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ScheduleDetailPage;

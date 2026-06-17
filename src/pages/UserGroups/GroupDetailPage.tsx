import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import BackButton from '../../components/CustomComponent/Buttons/BackButton';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import GroupDetails from './GroupDetails';
import GroupMembersSection from './GroupMembersSection';
import GroupMonthlyCalendarSection from './GroupMonthlyCalendarSection';
import Card, { CardBody, CardHeader, CardLabel, CardTitle as CardTitleH } from '../../components/bootstrap/Card';

const GroupDetailPage = () => {
	const { id } = useParams();
	const [group, setGroup] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		if (!id) {
			setGroup(null);
			setLoading(false);
			return undefined;
		}
		let cancelled = false;
		setLoading(true);
		authAxios
			.get(`api/hr/groups/${id}/`)
			.then((res) => {
				const g = res?.data ?? null;
				if (cancelled) return;
				setGroup(g);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	return (
		<PageWrapper title='Group details'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h6'>
						Monthly Group Schedule
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid' className='position-relative'>
				{loading && (
					<div
						className='d-flex justify-content-center align-items-center py-5'
						style={{ minHeight: '40vh' }}>
						<AbaciLoader />
					</div>
				)}
				{!loading && (
					<div className='row g-4 align-items-stretch'>
						<div className='col-12 col-lg-6 mb-4 mb-lg-0 d-flex'>
							<GroupDetails group={group} />
						</div>
						<div className='col-12 col-lg-6 mb-4 mb-lg-0 d-flex'>
							<GroupMembersSection groupId={id} />
						</div>
						<div className='col-12'>
							<Card className='mb-4'>
								<CardHeader>
									<CardLabel icon='' iconColor='dark'>
										<CardTitleH tag='div' className='h5'>
											Monthly Group Schedule
										</CardTitleH>
									</CardLabel>
								</CardHeader>
								<CardBody>
									<GroupMonthlyCalendarSection groupId={id} height='65vh' />
								</CardBody>
							</Card>
						</div>
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export default GroupDetailPage;

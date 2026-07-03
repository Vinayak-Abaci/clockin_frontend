import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import BackButton from '../../components/CustomComponent/Buttons/BackButton';
import UserDetails from '../../components/MasterComponents/Usermanagement/Details/UserDetails';
import UserScheduleCalendarSection from '../../components/MasterComponents/Usermanagement/Details/UserScheduleCalendarSection';
import UserDetailSkeleton from '../../components/CustomComponent/Skeleton/UserDetailSkeleton';
import UserTodayInfoCard from '../../components/MasterComponents/Usermanagement/Details/UserTodayInfoCard';
import UserDocumentsSection from '../../components/MasterComponents/Usermanagement/Details/UserDocumentsSection';
const UserManagementPage = () => {
	const { id } = useParams();
	const [userReady, setUserReady] = useState(false);

	useEffect(() => {
		setUserReady(false);
	}, [id]);

	const onUserLoadComplete = useCallback(() => setUserReady(true), []);

	/** Only block the page for user profile fetch; calendar shows its own spinner (including month changes). */
	const showPageLoader = Boolean(id) && !userReady;

	return (
		<PageWrapper title='User Details'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h6'>
						User Management
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid' className='position-relative'>
				{showPageLoader && <UserDetailSkeleton />}
				<div className={showPageLoader ? 'd-none' : undefined}>
					<div className='row g-4 align-items-stretch'>
						<div className='col-12 col-lg-6 mb-4 d-flex flex-column'>
							<div className='mb-4'>
								<UserDetails userId={id} onLoadComplete={onUserLoadComplete} />
							</div>
							<div className='flex-grow-1'>
								<UserTodayInfoCard userId={id} fillHeight />
							</div>
						</div>
						{userReady && (
							<div className='col-12 col-lg-6 mb-4 d-flex flex-column'>
								<UserDocumentsSection userId={id} />
							</div>
						)}
						{userReady ? (
							<div className='col-12'>
								<UserScheduleCalendarSection userId={id} />
							</div>
						) : null}
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default UserManagementPage;

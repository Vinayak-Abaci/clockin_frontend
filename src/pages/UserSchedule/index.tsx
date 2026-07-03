import React, { useContext, useMemo } from 'react';
import AuthContext from '../../contexts/authContext';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
// import UserDetails from '../../components/MasterComponents/Usermanagement/Details/UserDetails';
import UserScheduleCalendarSection from '../../components/MasterComponents/Usermanagement/Details/UserScheduleCalendarSection';
import UserScheduleSkeleton from '../../components/CustomComponent/Skeleton/UserScheduleSkeleton';
import UserTodayInfoCard from '../../components/MasterComponents/Usermanagement/Details/UserTodayInfoCard';

const UserSchedulePage = () => {
	const { userData } = useContext(AuthContext);
	const selfId = useMemo(() => {
		const id = userData?.id;
		if (id == null || id === '') return '';
		return String(id);
	}, [userData?.id]);

	if (!selfId) {
		return (
			<PageWrapper title='My schedule'>
				<Page container='fluid'>
					<UserScheduleSkeleton />
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper title='My schedule'>
			<SubHeader>
				<SubHeaderLeft>
					<CardTitle tag='div' className='h6'>
						My schedule
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid'>
				<div className='row'>
					{/* <div className='col-12 mb-4'>
						<UserDetails userId={selfId} onLoadComplete={onUserLoadComplete} />
					</div> */}
					<div className='col-12 mb-4'>
						<UserTodayInfoCard userId={selfId} />
					</div>
					<div className='col-12'>
						<UserScheduleCalendarSection userId={selfId} />
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default UserSchedulePage;

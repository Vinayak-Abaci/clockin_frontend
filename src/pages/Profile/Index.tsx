import React from 'react';
import SubHeader, { SubHeaderLeft, SubheaderSeparator, } from '../../layout/SubHeader/SubHeader';
import Page from '../../layout/Page/Page';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import { CardTitle } from '../../components/bootstrap/Card';
import ProfileAvatar from './ProfileAvatar';
import ProfileLicenseCard from './ProfileLicenseCard';
import MyProfile from './MyProfile';
import ChangePassword from './ChangePassword';
import BackButton from '../../components/CustomComponent/Buttons/BackButton';
// import ActiveDevices from './ActiveDevices';

const Index = () => {

	return (
		<PageWrapper title='My Profile'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h5 prevent-userselect'>
						My Profile
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid'>
				<div className='row g-4'>
					<div className='col-lg-4'>
						<ProfileAvatar />
					</div>
					<div className='col-lg-8'>
						<MyProfile />
					</div>
				</div>
				<div className='row g-4'>
					<div className='col-lg-4'>
						<ProfileLicenseCard />
					</div>
					<div className='col-lg-8'>
						<ChangePassword />
					</div>
				</div>

			</Page>
		</PageWrapper>
	);
};

export default Index;
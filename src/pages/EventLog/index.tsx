import React, { useCallback, useContext, useRef, useState } from 'react';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import AddButton from '../../components/CustomComponent/Buttons/AddButton';
import ExportButton, { EXPORT_VARIANTS } from '../../components/CustomComponent/Buttons/ExportButton';
import EventTable from './EventTable';
import AddEventForm from './AddEventForm';
import AuthContext from '../../contexts/authContext';

const Index = () => {
	const { userData } = useContext(AuthContext);
	const tableRef = useRef();
	const urlBackup = useRef<string | undefined>(undefined);
	const [eventModalShow, setEventModalShow] = useState(false);
	const showAddEvent = userData?.user_type === 'Admin';

	const openAddModal = (state: boolean) => {
		setEventModalShow(state);
	};

	const editModalToggle = useCallback(() => {
		// Reserved if row actions are enabled on the event table.
	}, []);

	return (
		<>
			{eventModalShow && (
				<AddEventForm
					isOpen={eventModalShow}
					setIsOpen={setEventModalShow}
					tableRef={tableRef}
					title='Add event'
				/>
			)}
			<PageWrapper title='Event Log'>
				<SubHeader>
					<SubHeaderLeft>
						<CardTitle tag='div' className='h5'>
							Event log
						</CardTitle>
					</SubHeaderLeft>
					<SubHeaderRight>
						{showAddEvent && <AddButton modalShow={openAddModal} name='Add event' />}
						<ExportButton
							url={urlBackup}
							name='Attendance events'
							variant={EXPORT_VARIANTS.attendanceEvents}
						/>
					</SubHeaderRight>
				</SubHeader>
				<Card stretch>
					<CardHeader borderSize={1}>
						<CardLabel icon='' iconColor='info'>
							<CardTitle tag='div' className='h5'>
								Events
							</CardTitle>
						</CardLabel>
					
					</CardHeader>
					<CardBody className='table-responsive'>
						<EventTable
							tableRef={tableRef}
							urlBackup={urlBackup}
							editModalToggle={editModalToggle}
						/>
					</CardBody>
				</Card>
			</PageWrapper>
		</>
	);
};

export default Index;

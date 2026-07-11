import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Card, { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import AddButton from '../../components/CustomComponent/Buttons/AddButton';
import AuthContext from '../../contexts/authContext';
import { isSelfEquivalentMode } from '../../helpers/roleToggleUtils';
import WfhRequests from './WfhRequest/WfhRequests';
import AddWfhRequest from './WfhRequest/AddWfhRequest';

const WfhRequestsPage = () => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle === 'Self' ? 'Self' : 'Admin';
	const tableRef = useRef(null);
	const urlBackup = useRef('');
	const [searchParams] = useSearchParams();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editId, setEditId] = useState<any>(null);
	const showAddWfhRequest = isSelfEquivalentMode(userData, mode);

	const openAddModal = useCallback(() => {
		setEditId(null);
		setIsFormOpen(true);
	}, []);

	const editModalToggle = useCallback((id: any) => {
		setEditId(id);
		setIsFormOpen(true);
	}, []);

	const closeForm = useCallback((open: boolean) => {
		if (!open) setEditId(null);
		setIsFormOpen(open);
	}, []);

	const statusFilter = useMemo(() => {
		const status = searchParams.get('status')?.trim().toUpperCase();
		return status || null;
	}, [searchParams]);

	return (
		<PageWrapper title='WFH Requests'>
			{isFormOpen && (
				<AddWfhRequest
					isOpen={isFormOpen}
					setIsOpen={closeForm}
					tableRef={tableRef}
					title={editId ? 'Edit WFH Request' : 'Add WFH Request'}
					id={editId}
				/>
			)}
			<SubHeader>
				<SubHeaderLeft>
					<CardTitle tag='div' className='h5'>
						WFH Requests
					</CardTitle>
				</SubHeaderLeft>
				<SubHeaderRight>
					{showAddWfhRequest && (
						<AddButton name='Add WFH Request' modalShow={openAddModal} />
					)}
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<WfhRequests
					tableRef={tableRef}
					urlBackup={urlBackup}
					editModalToggle={editModalToggle}
					statusFilter={statusFilter}
				/>
			</Page>
		</PageWrapper>
	);
};

export default WfhRequestsPage;

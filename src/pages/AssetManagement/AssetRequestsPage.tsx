import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Card, { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import AddButton from '../../components/CustomComponent/Buttons/AddButton';
import AuthContext from '../../contexts/authContext';
import { isUserRole } from '../../helpers/roleToggleUtils';
import AssetRequests from './AssetRequest/AssetRequests';
import AddAssetRequest from './AssetRequest/AddAssetRequest';

const AssetRequestsPage = () => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle === 'Self' ? 'Self' : 'Admin';
	const tableRef = useRef(null);
	const urlBackup = useRef('');
	const [searchParams] = useSearchParams();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editId, setEditId] = useState<any>(null);
	const showAddAssetRequest = isUserRole(userData) || mode === 'Self';

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
		<PageWrapper title='Asset Requests'>
			{isFormOpen && (
				<AddAssetRequest
					isOpen={isFormOpen}
					setIsOpen={closeForm}
					tableRef={tableRef}
					title={editId ? 'Edit Asset Request' : 'Add Asset Request'}
					id={editId}
				/>
			)}
			<SubHeader>
				<SubHeaderLeft>
					<CardTitle tag='div' className='h5'>
						Asset Requests
					</CardTitle>
				</SubHeaderLeft>
				<SubHeaderRight>
					{showAddAssetRequest && (
						<AddButton name='Add Asset Request' modalShow={openAddModal} />
					)}
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<AssetRequests
					tableRef={tableRef}
					urlBackup={urlBackup}
					editModalToggle={editModalToggle}
					statusFilter={statusFilter}
				/>
			</Page>
		</PageWrapper>
	);
};

export default AssetRequestsPage;

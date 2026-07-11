import React, { useContext, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Card, { CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import AddButton from '../../components/CustomComponent/Buttons/AddButton';
import AuthContext from '../../contexts/authContext';
import { isSelfEquivalentMode } from '../../helpers/roleToggleUtils';
import LeaveRequests, { type LeaveTypeTableFilter } from './LeaveRequest/LeaveRequests';
import AddLeaveRequest from './LeaveRequest/AddLeaveRequest';
import {
	leaveRequestUrlFiltersToSearchParams,
	type LeaveRequestUrlFilters,
} from './LeaveRequest/leaveRequestTableNavigation';

const LeaveRequestsPage = () => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle === 'Self' ? 'Self' : 'Admin';
	const tableRef = useRef(null);
	const urlBackup = useRef('');
	const [searchParams, setSearchParams] = useSearchParams();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editId, setEditId] = useState<any>(null);
	const showAddLeaveRequest = isSelfEquivalentMode(userData, mode);

	const openAddModal = () => {
		setEditId(null);
		setIsFormOpen(true);
	};

	const editModalToggle = (id: any) => {
		setEditId(id);
		setIsFormOpen(true);
	};

	const leaveTypeFilter = useMemo((): LeaveTypeTableFilter | null => {
		const id = searchParams.get('leave_type');
		if (!id) return null;
		const parsedId = Number(id);
		if (Number.isNaN(parsedId)) return null;
		const name = searchParams.get('leave_type_name')?.trim();
		return {
			id: parsedId,
			name: name || 'Leave type',
		};
	}, [searchParams]);

	const statusFilter = useMemo(() => {
		const status = searchParams.get('status')?.trim().toUpperCase();
		return status || null;
	}, [searchParams]);

	const dateFilter = useMemo(() => {
		const date = searchParams.get('date')?.trim();
		return date || null;
	}, [searchParams]);

	const syncUrlFilters = (filters: LeaveRequestUrlFilters) => {
		setSearchParams(leaveRequestUrlFiltersToSearchParams(filters), { replace: true });
	};

	return (
		<PageWrapper title='Leave Requests'>
			{isFormOpen && (
				<AddLeaveRequest
					isOpen={isFormOpen}
					setIsOpen={setIsFormOpen}
					tableRef={tableRef}
					title={editId ? 'Edit Leave Request' : 'Add Leave Request'}
					id={editId}
				/>
			)}
			<SubHeader>
				<SubHeaderLeft>
					<CardTitle tag='div' className='h5'>
						Leave Requests
					</CardTitle>
				</SubHeaderLeft>
				<SubHeaderRight>
					{showAddLeaveRequest && (
						<AddButton name='Add Leave Request' modalShow={openAddModal} />
					)}
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<LeaveRequests
					tableRef={tableRef}
					urlBackup={urlBackup}
					editModalToggle={editModalToggle}
					leaveTypeFilter={leaveTypeFilter}
					statusFilter={statusFilter}
					dateFilter={dateFilter}
					onUrlFiltersChange={syncUrlFilters}
				/>
			</Page>
		</PageWrapper>
	);
};

export default LeaveRequestsPage;

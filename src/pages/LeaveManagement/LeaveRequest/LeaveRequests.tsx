import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import { Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSelector } from 'react-redux';
import { authAxios } from '../../../axiosInstance';
import useTablestyle from '../../../hooks/useTablestyles';
import { formatFilters } from '../../../helpers/functions';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { statusColorCodes } from '../../../helpers/constants';
import AuthContext from '../../../contexts/authContext';
import AcceptandRejectBasedOnStatus from '../../../components/CustomComponent/Buttons/AcceptandRejectBasedOnStatus';
import CustomBadge from '../../../components/CustomComponent/CustomBadge';
import EditButton from '../../../components/CustomComponent/Buttons/EditButton';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import LeaveApprovalTimelineModal, {
	type LeaveApprovalTimelineContext,
} from './LeaveApprovalTimelineModal';
import LeaveRequestUploadDocumentModal, {
	type LeaveRequestUploadContext,
} from './LeaveRequestUploadDocumentModal';
import LeaveRequestViewDocumentsModal, {
	type LeaveRequestViewDocumentsContext,
} from './LeaveRequestViewDocumentsModal';
import {
	hasLeaveDocuments,
	resolveLeaveDocumentsFromRow,
} from './leaveRequestDocuments';
import LeaveRequestsTodaySummary from './LeaveRequestsTodaySummary';
import {
	isPrivilegedToggleMode,
	isSelfEquivalentMode,
} from '../../../helpers/roleToggleUtils';
import {
	LEAVE_STATUS_LOOKUP,
	isEditableLeaveRequestStatus,
	isLeaveRequestDocumentUploadAllowed,
	todayLeaveRequestDateParam,
	type LeaveRequestUrlFilters,
} from './leaveRequestTableNavigation';

export type LeaveTypeTableFilter = {
	id: number;
	name: string;
};

function leaveRequestRowStatus(row: any): string | undefined {
	return (
		row?.status ??
		row?.approval_status ??
		row?.state ??
		row?.meta_data?.status ??
		undefined
	);
}

type LeaveRequestsProps = {
	tableRef: React.MutableRefObject<any>;
	urlBackup: React.MutableRefObject<string>;
	editModalToggle: (id: any) => void;
	leaveTypeFilter?: LeaveTypeTableFilter | null;
	statusFilter?: string | null;
	dateFilter?: string | null;
	onUrlFiltersChange?: (filters: LeaveRequestUrlFilters) => void;
};

const parseTableFilters = (
	filters: any[],
	preservedDate: string | null = null,
): LeaveRequestUrlFilters => {
	let status: string | null = null;
	let leaveTypeId: number | null = null;
	let leaveTypeName: string | null = null;

	filters.forEach((item) => {
		const field = item?.column?.field;
		const { value } = item ?? {};

		if (field === 'status' && Array.isArray(value) && value.length > 0) {
			status = String(value[0]).trim().toUpperCase();
			return;
		}

		if (field === 'leave_type' && Array.isArray(value) && value.length > 0) {
			const rawId = value[0];
			const parsedId = Number(rawId);
			if (!Number.isNaN(parsedId)) {
				leaveTypeId = parsedId;
				leaveTypeName =
					item?.column?.lookup?.[rawId] ??
					item?.column?.lookup?.[String(rawId)] ??
					null;
			}
		}
	});

	return { status, leaveTypeId, leaveTypeName, date: preservedDate };
};

const LeaveRequests = ({
	tableRef,
	urlBackup,
	editModalToggle,
	leaveTypeFilter = null,
	statusFilter = null,
	dateFilter = null,
	onUrlFiltersChange,
}: LeaveRequestsProps) => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle === 'Self' ? 'Self' : 'Admin';
	const isPrivilegedMode = isPrivilegedToggleMode(userData, mode);
	const isSelfMode = isSelfEquivalentMode(userData, mode);
	const userIdFilter = isSelfMode && userData?.id ? `user=${userData.id}` : '';
	const scopeFilters = userIdFilter;
	/** Accept/Reject for Admin, Manager, and HR in privileged mode (not Self / user view) */
	const showPrivilegedAcceptReject = isPrivilegedMode;

	const [filterEnabled, setFilterEnabled] = useState(
		Boolean(statusFilter || leaveTypeFilter || dateFilter),
	);
	const [pageSize, setPageSize] = useState(5);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const [timelineOpen, setTimelineOpen] = useState(false);
	const [timelineContext, setTimelineContext] = useState<LeaveApprovalTimelineContext | null>(
		null,
	);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [uploadContext, setUploadContext] = useState<LeaveRequestUploadContext | null>(null);
	const [viewDocsOpen, setViewDocsOpen] = useState(false);
	const [viewDocsContext, setViewDocsContext] = useState<LeaveRequestViewDocumentsContext | null>(
		null,
	);
	const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

	const openApprovalTimeline = useCallback((rowData: any) => {
		setTimelineContext({
			leaveRequestId: rowData?.id,
			employeeName: rowData?.user?.name,
			leaveTypeName: rowData?.leave_type?.name,
			fromDate: rowData?.from_date,
			toDate: rowData?.to_date,
			overallStatus: leaveRequestRowStatus(rowData),
		});
		setTimelineOpen(true);
	}, []);
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();

	const leaveRequestDocuments = useCallback(
		(rowData: any) => resolveLeaveDocumentsFromRow(rowData),
		[],
	);

	const openViewDocuments = useCallback((rowData: any) => {
		setViewDocsContext({
			leaveRequestId: rowData?.id,
			employeeName: rowData?.user?.name,
			leaveTypeName: rowData?.leave_type?.name,
			documents: leaveRequestDocuments(rowData),
		});
		setViewDocsOpen(true);
	}, [leaveRequestDocuments]);

	const openUploadDocument = useCallback((rowData: any) => {
		setUploadContext({
			id: rowData?.id,
			employeeName: rowData?.user?.name,
			leaveTypeName: rowData?.leave_type?.name,
		});
		setUploadOpen(true);
	}, []);

	const refreshTable = useCallback(() => {
		tableRef?.current?.onQueryChange?.();
		setSummaryRefreshKey((key) => key + 1);
	}, [tableRef]);

	useEffect(() => {
		if (statusFilter || leaveTypeFilter || dateFilter) {
			setFilterEnabled(true);
		}
	}, [statusFilter, leaveTypeFilter, dateFilter]);

	const handleTableFilterChange = useCallback(
		(filters: any[]) => {
			onUrlFiltersChange?.(parseTableFilters(filters, dateFilter));
		},
		[onUrlFiltersChange, dateFilter],
	);

	const handleSummaryCardClick = useCallback(
		(status: string | null) => {
			onUrlFiltersChange?.({
				status,
				leaveTypeId: leaveTypeFilter?.id ?? null,
				leaveTypeName: leaveTypeFilter?.name ?? null,
				date: todayLeaveRequestDateParam(),
			});
			setFilterEnabled(true);
		},
		[onUrlFiltersChange, leaveTypeFilter],
	);

	const staticColumns = useMemo(
		() => [
			{
				title: 'Employee Name',
				field: 'user__name',
				render: (rowData: any) => rowData?.user?.name || '----',
			},
			{
				title: 'Leave Type',
				field: leaveTypeFilter ? 'leave_type' : 'leave_type__name',
				...(leaveTypeFilter
					? {
							lookup: { [leaveTypeFilter.id]: leaveTypeFilter.name },
							defaultFilter: [leaveTypeFilter.id],
						}
					: {}),
				render: (rowData: any) =>
					rowData?.leave_type?.name || '----',
			},
			{
				title: 'From Date',
				field: 'from_date',
				render: (rowData: any) => rowData?.from_date || '----',
			},
			{
				title: 'To Date',
				field: 'to_date',
				render: (rowData: any) => rowData?.to_date || '----',
			},
			{
				title: 'From Session',
				field: 'from_session',
				render: (rowData: any) => rowData?.from_session || '----',
			},
			{
				title: 'To Session',
				field: 'to_session',
				render: (rowData: any) => rowData?.to_session || '----',
			},
			{
				title: 'Reason',
				field: 'reason',
				sorting: false,
				render: (rowData: any) => rowData?.reason || '----',
			},
			{
				title: 'Status',
				field: 'status',
				lookup: LEAVE_STATUS_LOOKUP,
				...(statusFilter ? { defaultFilter: [statusFilter] } : {}),
				render: (rowData: any) => {
					const status = leaveRequestRowStatus(rowData);
					if (!status) return '----';
					return (
						<CustomBadge
							color={statusColorCodes?.[String(status).toUpperCase()] || '#E4E4E4'}>
							{status}
						</CustomBadge>
					);
				},
			},
		],
		[leaveTypeFilter, statusFilter],
	);
	
	const showEditLeaveRequest = useCallback(
		(rowData: any) =>
			!isSelfMode || isEditableLeaveRequestStatus(leaveRequestRowStatus(rowData)),
		[isSelfMode],
	);

	const columns = useMemo(() => {
		const actionColumn = {
			title: 'Actions',
			align: 'right',
			removable: false,
			sorting: false,
			grouping: false,
			filtering: false,
			render: (rowData: any) => (
				<div className='d-flex flex-row flex-nowrap gap-1 justify-content-end align-items-center'>
					{showPrivilegedAcceptReject && (
						<AcceptandRejectBasedOnStatus
							id={rowData.id}
							tableRef={tableRef}
							url='/api/hr/leave-requests'
							status={leaveRequestRowStatus(rowData) ?? ''}
							canApprove={rowData?.actions?.can_approve}
							canReject={rowData?.actions?.can_reject}
							canCancel={rowData?.actions?.can_cancel}
						/>
					)}
					{isSelfMode && isEditableLeaveRequestStatus(leaveRequestRowStatus(rowData)) ? (
						<AcceptandRejectBasedOnStatus
							id={rowData.id}
							tableRef={tableRef}
							url='/api/hr/leave-requests'
							status={leaveRequestRowStatus(rowData) ?? ''}
							canApprove={false}
							canReject={false}
							canCancel={rowData?.actions?.can_cancel ?? true}
						/>
					) : null}
					<Tooltip arrow title='View approval status' placement='top'>
						<Button
							type='button'
							color='warning'
							isLight
							size='sm'
							icon='Visibility'
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
								openApprovalTimeline(rowData);
							}}
						/>
					</Tooltip>
					{hasLeaveDocuments(rowData) ? (
						<Tooltip arrow title='View documents' placement='top'>
							<Button
								type='button'
								color='success'
								isLight
								size='sm'
								icon='Description'
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									openViewDocuments(rowData);
								}}
							/>
						</Tooltip>
					) : null}
					{isLeaveRequestDocumentUploadAllowed(leaveRequestRowStatus(rowData)) ? (
						<Tooltip arrow title='Upload document' placement='top'>
							<Button
								type='button'
								color='info'
								isLight
								size='sm'
								icon='Upload'
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									openUploadDocument(rowData);
								}}
							/>
						</Tooltip>
					) : null}
					{showEditLeaveRequest(rowData) ? (
						<EditButton modalShow={editModalToggle} id={rowData.id} />
					) : null}
				</div>
			),
		};
		return [...staticColumns, actionColumn];
	}, [
		staticColumns,
		isSelfMode,
		showPrivilegedAcceptReject,
		showEditLeaveRequest,
		tableRef,
		editModalToggle,
		openUploadDocument,
		openApprovalTimeline,
		openViewDocuments,
	]);

	return (
		<>
			<LeaveApprovalTimelineModal
				isOpen={timelineOpen}
				setIsOpen={setTimelineOpen}
				context={timelineContext}
			/>
			<LeaveRequestViewDocumentsModal
				isOpen={viewDocsOpen}
				setIsOpen={setViewDocsOpen}
				context={viewDocsContext}
				onDocumentsChanged={refreshTable}
			/>
			<LeaveRequestUploadDocumentModal
				isOpen={uploadOpen}
				setIsOpen={setUploadOpen}
				context={uploadContext}
				onUploaded={refreshTable}
			/>
			{isPrivilegedMode ? (
				<LeaveRequestsTodaySummary
					refreshKey={summaryRefreshKey}
					activeStatus={statusFilter}
					activeDate={dateFilter}
					onCardClick={handleSummaryCardClick}
				/>
			) : null}
			<Card stretch>
				<CardBody>
					<div className='material-table-wrapper'>
						<ThemeProvider theme={theme}>
							<MaterialTable
					key={`${sortState.orderBy ?? 'no-order'}-${sortState.orderDirection}-${statusFilter ?? ''}-${leaveTypeFilter?.id ?? ''}-${dateFilter ?? ''}`}
					title=' '
					columns={columns as any}
					tableRef={tableRef}
					onFilterChange={handleTableFilterChange}
					// onChangeRowsPerPage={setPageSize}
					onOrderChange={(orderBy, orderDirection) => {
						setSortState({ orderBy, orderDirection });
					}}
					data={(query) =>
						new Promise((resolve, reject) => {
							let orderBy = '';
							const otherFilters = formatFilters(query.filters);
							if (query.orderBy) {
								orderBy =
									query.orderDirection === 'asc'
										? `&ordering=-${String(query.orderBy?.field)}`
										: `&ordering=${String(query.orderBy?.field)}`;
							}

							const dateParam = dateFilter
								? `&date=${encodeURIComponent(dateFilter)}`
								: '';
							const url = `/api/hr/leave-requests/?${scopeFilters ? `${scopeFilters}&` : ''}limit=${query.pageSize}&offset=${
								query.pageSize * query.page
							}&search=${query.search}${orderBy}${dateParam}&${otherFilters}`;

							urlBackup.current = url;
							authAxios
								.get(url)
								.then((response) => {
									const leaveRequests = response?.data?.results || [];
									resolve({
										data: leaveRequests,
										page: query.page,
										totalCount: response?.data?.count || 0,
									});
								})
								.catch((error) => {
									showErrorNotification(error);
									reject({
										data: [],
										page: query.page,
										totalCount: 0,
									});
								});
						})
					}
					actions={[
						{
							icon: FilterListIcon,
							tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
							isFreeAction: true,
							onClick: () => {
								setFilterEnabled((state) => !state);
							},
						},
					]}
					options={{
						headerStyle: headerStyles(),
						rowStyle: rowStyles(),
						debounceInterval: 500,
						filtering: filterEnabled,
						search: true,
						pageSize,
					}}
							/>
						</ThemeProvider>
					</div>
				</CardBody>
			</Card>
		</>
	);
};

/* eslint-disable react/forbid-prop-types */
LeaveRequests.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
	leaveTypeFilter: PropTypes.shape({
		id: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
	}),
	statusFilter: PropTypes.string,
	dateFilter: PropTypes.string,
	onUrlFiltersChange: PropTypes.func,
};
/* eslint-enable react/forbid-prop-types */

export default LeaveRequests;

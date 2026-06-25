import React, { useCallback, useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import Swal from 'sweetalert2';
import Button from '../../../components/bootstrap/Button';
import StatusBadge from '../../../components/CustomComponent/StatusBadge';
import { authAxios } from '../../../axiosInstance';
import useTablestyle from '../../../hooks/useTablestyles';
import { formatFilters } from '../../../helpers/functions';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Moments from '../../../helpers/Moment';
import { buttonColor } from '../../../helpers/constants';

const RegistrationsTable = ({ tableRef, urlBackup }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const handleRegistrationAction = useCallback(
		(row: any, status: 'APPROVED' | 'REJECTED') => {
			const isReject = status === 'REJECTED';
			const displayName = row?.name || row?.email || 'this registration';

			Swal.fire({
				title: isReject ? 'Reject registration?' : 'Approve registration?',
				text: isReject
					? `Reject ${displayName}?`
					: `Approve ${displayName}?`,
				icon: isReject ? 'warning' : 'question',
				showCancelButton: true,
				confirmButtonColor: buttonColor[isReject ? 0 : 1],
				cancelButtonColor: buttonColor[isReject ? 1 : 0],
				confirmButtonText: isReject ? 'Reject' : 'Approve',
				...(isReject
					? {
							input: 'textarea',
							inputPlaceholder: 'Optional rejection reason',
						}
					: {}),
			}).then((result) => {
				if (!result.isConfirmed || !row?.id) return;

				const payload: Record<string, string> = { status };
				if (isReject && typeof result.value === 'string' && result.value.trim()) {
					payload.rejection_reason = result.value.trim();
				}

				authAxios
					.patch(`api/customers/registrations/${row.id}/`, payload)
					.then((response) => {
						tableRef?.current?.onQueryChange?.();
						const message =
							response?.data?.message ||
							response?.data?.detail ||
							(isReject
								? 'Registration rejected successfully.'
								: 'Registration approved successfully.');
						showSuccessNotification(message);
					})
					.catch((error) => showErrorNotification(error));
			});
		},
		[tableRef, showErrorNotification, showSuccessNotification],
	);

	const columns = useMemo(
		() => [
			{
				title: 'Company',
				field: 'name',
				render: (rowData: any) => rowData?.name || '----',
			},
			{
				title: 'Email',
				field: 'email',
				render: (rowData: any) => rowData?.email || '----',
			},
			{
				title: 'Name',
				field: 'first_name',
				sorting: false,
				render: (rowData: any) =>
					`${rowData?.first_name || ''} ${rowData?.last_name || ''}`.trim() || '----',
			},
			{
				title: 'Country',
				field: 'country',
				render: (rowData: any) => rowData?.country || '----',
			},
			{
				title: 'Timezone',
				field: 'timezone',
				render: (rowData: any) => rowData?.timezone || '----',
			},
			{
				title: 'Domain',
				field: 'domain',
				render: (rowData: any) => rowData?.domain || rowData?.schema_name || '----',
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: any) => (
					<StatusBadge status={rowData?.status} emptyFallback='----' />
				),
			},
			{
				title: 'Reviewed By',
				field: 'reviewed_by_email',
				render: (rowData: any) => rowData?.reviewed_by_email || '----',
			},
			{
				title: 'Submitted',
				field: 'submitted_at',
				filtering: false,
				render: (rowData: any) => Moments(rowData?.submitted_at, 'datetime') || '----',
			},
			{
				title: 'Actions',
				align: 'right' as const,
				removable: false,
				sorting: false,
				grouping: false,
				filtering: false,
				render: (rowData: any) =>
					rowData?.status === 'PENDING'  ? (
						<div className='d-flex gap-2 justify-content-end'>
							<Button
								color='success'
								size='sm'
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									handleRegistrationAction(rowData, 'APPROVED');
								}}>
								Approve
							</Button>
							<Button
								color='danger'
								size='sm'
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									handleRegistrationAction(rowData, 'REJECTED');
								}}>
								Reject
							</Button>
						</div>
					) : null,
			},
		],
		[handleRegistrationAction],
	);

	return (
		<div className='material-table-wrapper'>
			<ThemeProvider theme={theme}>
				<MaterialTable
					key={`${sortState.orderBy ?? 'no-order'}-${sortState.orderDirection}`}
					title=' '
					columns={columns as any}
					tableRef={tableRef}
					//@ts-ignore
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
							const url = `api/customers/registrations/?limit=${query.pageSize}&offset=${
								query.pageSize * query.page
							}&search=${encodeURIComponent(query.search || '')}${orderBy}&${otherFilters}`;

							urlBackup.current = url;
							authAxios
								.get(url)
								.then((response) => {
									resolve({
										data: response?.data?.results || [],
										page: query.page,
										totalCount: response?.data?.count || 0,
									});
								})
								.catch((error) => {
									showErrorNotification(error);
									reject({ data: [], page: query.page, totalCount: 0 });
								});
						})
					}
					actions={[
						{
							icon: FilterListIcon,
							tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
							isFreeAction: true,
							onClick: () => setFilterEnabled((state) => !state),
						},
					]}
					options={{
						headerStyle: headerStyles(),
						rowStyle: rowStyles(),
						actionsColumnIndex: -1,
						debounceInterval: 500,
						filtering: filterEnabled,
						search: true,
						pageSize,
					}}
				/>
			</ThemeProvider>
		</div>
	);
};

/* eslint-disable react/forbid-prop-types */
RegistrationsTable.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default RegistrationsTable;

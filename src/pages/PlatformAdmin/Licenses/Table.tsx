import React, { useCallback, useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import { Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import Swal from 'sweetalert2';
import Badge from '../../../components/bootstrap/Badge';
import Button from '../../../components/bootstrap/Button';
import StatusBadge from '../../../components/CustomComponent/StatusBadge';
import { authAxios } from '../../../axiosInstance';
import useTablestyle from '../../../hooks/useTablestyles';
import { formatFilters } from '../../../helpers/functions';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Moments from '../../../helpers/Moment';
import { buttonColor } from '../../../helpers/constants';

const LicensesTable = ({ tableRef, urlBackup }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const [cancelUpdatingId, setCancelUpdatingId] = useState<number | null>(null);
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const handleCancelLicense = useCallback(
		(row: any) => {
			const displayName =
				row?.plan_name && row?.client_name
					? `${row.plan_name} (${row.client_name})`
					: row?.plan_name || row?.client_name || 'this license';

			Swal.fire({
				title: 'Cancel license?',
				text: `Cancel ${displayName}?`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: buttonColor[0],
				cancelButtonColor: buttonColor[1],
				confirmButtonText: 'Cancel License',
			}).then((result) => {
				if (!result.isConfirmed || !row?.id) return;

				setCancelUpdatingId(row.id);
				authAxios
					.patch(`api/customers/licenses/${row.id}/`, { status: 'CANCELLED' })
					.then((response) => {
						tableRef?.current?.onQueryChange?.();
						const message =
							response?.data?.message ||
							response?.data?.detail ||
							'License cancelled successfully.';
						showSuccessNotification(message);
					})
					.catch((error) => showErrorNotification(error))
					.finally(() => setCancelUpdatingId(null));
			});
		},
		[tableRef, showErrorNotification, showSuccessNotification],
	);

	const columns = useMemo(
		() => [
			{
				title: 'Client',
				field: 'client_name',
				render: (rowData: any) =>
					rowData?.client_name ||
					rowData?.client?.name ||
					rowData?.client?.schema_name ||
					rowData?.client ||
					'----',
			},
			{
				title: 'Plan',
				field: 'plan_name',
				render: (rowData: any) => rowData?.plan_name || '----',
			},
			{
				title: 'Max Users',
				field: 'max_users',
				render: (rowData: any) => rowData?.max_users ?? '----',
			},
			{
				title: 'Start Date',
				field: 'start_date',
				filtering: true,
				type: 'date',
				render: (rowData: any) =>
				  rowData?.start_date ? Moments(rowData.start_date, 'date') : '----',
				filterComponent: (props: any) => (
				  <input
					type='date'
					value={props.columnDef.tableData.filterValue || ''}
					onChange={(e) => props.onFilterChanged(props.columnDef.tableData.id, e.target.value)}
					style={{
					  width: '100%',
					  padding: '4px',
					}}
				  />
				),
			  },
			{
				title: 'Expiry Date',
				field: 'expiry_date',
				filtering: true,
				type: 'date',
				render: (rowData: any) =>
					rowData?.expiry_date ? Moments(rowData.expiry_date, 'date') : '----',
				filterComponent: (props: any) => (
					<input
						type='date'
						value={props.columnDef.tableData.filterValue || ''}
						onChange={(e) => props.onFilterChanged(props.columnDef.tableData.id, e.target.value)}
						style={{
							width: '100%',
							padding: '4px',
						}}
					/>
				),
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: any) => (
					<StatusBadge status={rowData?.status} emptyFallback='----' />
				),
			},
			{
				title: 'Trial',
				field: 'is_trial',
				lookup: {
					true: 'Yes',
					false: 'No',
				},
				render: (rowData: any) => (
					<Badge color={rowData?.is_trial ? 'info' : 'secondary'} isLight>
						{rowData?.is_trial ? 'Yes' : 'No'}
					</Badge>
				),
			},
			{
				title: 'Created By',
				field: 'created_by_email',
				render: (rowData: any) => rowData?.created_by?.first_name  || '----',
			},
			{
				title: 'Created At',
				field: 'created_at',
				filtering: false,
				render: (rowData: any) => Moments(rowData?.created_at, 'datetime') || '----',
			},
			{
				title: 'Modified At',
				field: 'modified_at',
				filtering: false,
				render: (rowData: any) => Moments(rowData?.modified_at, 'datetime') || '----',
			},
			{
				title: 'Actions',
				align: 'right' as const,
				removable: false,
				sorting: false,
				grouping: false,
				filtering: false,
				render: (rowData: any) => {
					const rowStatus = String(rowData?.status || '').toUpperCase();
					if (rowStatus === 'PENDING' || rowStatus === 'ACTIVE') {
						return (
							<div className='d-flex align-items-center justify-content-end gap-2'>
								<Tooltip arrow title='Cancel license' placement='top'>
									<span className='d-inline-flex'>
										<Button
											type='button'
											color='danger'
											isLight
											size='sm'
											icon='Block'
											isDisable={cancelUpdatingId === rowData?.id}
											onClick={(e: React.MouseEvent) => {
												e.preventDefault();
												e.stopPropagation();
												handleCancelLicense(rowData);
											}}
										/>
									</span>
								</Tooltip>
							</div>
						);
					}
					return null;
				},
			},
		],
		[handleCancelLicense, cancelUpdatingId],
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
							const url = `api/customers/licenses/?limit=${query.pageSize}&offset=${
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
LicensesTable.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default LicensesTable;

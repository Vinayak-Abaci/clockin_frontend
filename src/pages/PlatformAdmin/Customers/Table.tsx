import React, { useCallback, useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import Swal from 'sweetalert2';
import Badge from '../../../components/bootstrap/Badge';
import Button from '../../../components/bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import useTablestyle from '../../../hooks/useTablestyles';
import { formatFilters } from '../../../helpers/functions';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Moments from '../../../helpers/Moment';
import { buttonColor } from '../../../helpers/constants';

const statusColor = (status: string) => {
	switch (status) {
		case 'ACTIVE':
			return 'success';
		case 'BLOCKED':
			return 'danger';
		default:
			return 'warning';
	}
};

const CustomersTable = ({ tableRef, urlBackup }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const handleClientStatus = useCallback(
		(row: any, status: 'ACTIVE' | 'BLOCKED') => {
			const isBlock = status === 'BLOCKED';
			const displayName = row?.name || row?.schema_name || row?.primary_domain || 'this customer';

			Swal.fire({
				title: isBlock ? 'Block customer?' : 'Activate customer?',
				text: isBlock
					? `Block ${displayName}? They will not be able to access the platform.`
					: `Activate ${displayName}? They will regain access to the platform.`,
				icon: isBlock ? 'warning' : 'question',
				showCancelButton: true,
				confirmButtonColor: buttonColor[isBlock ? 0 : 1],
				cancelButtonColor: buttonColor[isBlock ? 1 : 0],
				confirmButtonText: isBlock ? 'Block' : 'Activate',
			}).then((result) => {
				if (!result.isConfirmed || !row?.id) return;

				authAxios
					.patch(`api/customers/clients/${row.id}/`, { status })
					.then((response) => {
						tableRef?.current?.onQueryChange?.();
						const message =
							response?.data?.message ||
							response?.data?.detail ||
							(isBlock
								? 'Customer blocked successfully.'
								: 'Customer activated successfully.');
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
				title: 'Schema',
				field: 'schema_name',
				render: (rowData: any) => rowData?.schema_name || '----',
			},
			{
				title: 'Primary Domain',
				field: 'primary_domain',
				render: (rowData: any) => rowData?.primary_domain || '----',
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: any) => (
					<Badge color={statusColor(rowData?.status)} isLight>
						{rowData?.status || '----'}
					</Badge>
				),
			},
			{
				title: 'On Trial',
				field: 'on_trial',
				render: (rowData: any) => (
					<Badge color={rowData?.on_trial ? 'info' : 'secondary'} isLight>
						{rowData?.on_trial ? 'Yes' : 'No'}
					</Badge>
				),
			},
			{
				title: 'Paid Until',
				field: 'paid_until',
				render: (rowData: any) =>
					rowData?.paid_until ? Moments(rowData.paid_until, 'date') : '----',
			},
			{
				title: 'Created',
				field: 'created_on',
				render: (rowData: any) =>
					rowData?.created_on ? Moments(rowData.created_on, 'date') : '----',
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
					if (rowStatus === 'ACTIVE') {
						return (
							<div className='d-flex gap-2 justify-content-end'>
								<Button
									color='danger'
									size='sm'
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										handleClientStatus(rowData, 'BLOCKED');
									}}>
									Block
								</Button>
							</div>
						);
					}
					if (rowStatus === 'BLOCKED') {
						return (
							<div className='d-flex gap-2 justify-content-end'>
								<Button
									color='success'
									size='sm'
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										handleClientStatus(rowData, 'ACTIVE');
									}}>
									Activate
								</Button>
							</div>
						);
					}
					return null;
				},
			},
		],
		[handleClientStatus],
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
							const url = `api/customers/clients/?limit=${query.pageSize}&offset=${
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
CustomersTable.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default CustomersTable;

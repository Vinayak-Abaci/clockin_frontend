import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CustomersTable = ({ tableRef, urlBackup }: any) => {
	const navigate = useNavigate();
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
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

				setStatusUpdatingId(row.id);
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
					.catch((error) => showErrorNotification(error))
					.finally(() => setStatusUpdatingId(null));
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
					<StatusBadge status={rowData?.status} emptyFallback='----' />
				),
			},
			{
				title: 'On Trial',
				field: 'on_trial',
				lookup: {
					true: 'Yes',
					false: 'No',
				},
				render: (rowData: any) => (
					<Badge color={rowData?.on_trial ? 'info' : 'secondary'} isLight>
						{rowData?.on_trial ? 'Yes' : 'No'}
					</Badge>
				),
			},
			{
				title: 'Created By',
				field: 'created_by_email',
				render: (rowData: any) => rowData?.created_by?.first_name || '----',
			},
			{
				title: 'Created At',
				field: 'created_at',
				filtering: false,
				render: (rowData: any) =>
					rowData?.created_at ? Moments(rowData.created_at, 'datetime') : '----',
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
					if (rowStatus === 'ACTIVE' || rowStatus === 'INACTIVE') {
						return (
							<div className='d-flex align-items-center justify-content-end gap-2'>
								<Tooltip arrow title='Block customer' placement='top'>
									<span className='d-inline-flex'>
										<Button
											type='button'
											color='danger'
											isLight
											size='sm'
											icon='Block'
											isDisable={statusUpdatingId === rowData?.id}
											onClick={(e: React.MouseEvent) => {
												e.preventDefault();
												e.stopPropagation();
												handleClientStatus(rowData, 'BLOCKED');
											}}
										/>
									</span>
								</Tooltip>
							</div>
						);
					}
					if (rowStatus === 'BLOCKED') {
						return (
							<div className='d-flex align-items-center justify-content-end gap-2'>
								<Tooltip arrow title='Activate customer' placement='top'>
									<span className='d-inline-flex'>
										<Button
											type='button'
											color='success'
											isLight
											size='sm'
											icon='CheckCircle'
											isDisable={statusUpdatingId === rowData?.id}
											onClick={(e: React.MouseEvent) => {
												e.preventDefault();
												e.stopPropagation();
												handleClientStatus(rowData, 'ACTIVE');
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
		[handleClientStatus, statusUpdatingId],
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
					onRowClick={(_e: React.MouseEvent, rowData: any) => {
						if (rowData?.id != null) navigate(`/customer-details/${rowData.id}`);
					}}
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

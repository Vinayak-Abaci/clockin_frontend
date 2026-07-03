import React, { useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditButton from '../../components/CustomComponent/Buttons/EditButton';
import DeleteButton from '../../components/CustomComponent/Buttons/DeleteButton';
import { authAxios } from '../../axiosInstance';
import useTablestyle from '../../hooks/useTablestyles';
import { formatFilters } from '../../helpers/functions';
import useToasterNotification from '../../hooks/useToasterNotification';

const dayTypeLabelMap: Record<string, string> = {
	HOLIDAY: 'Holiday',
	SPECIAL_SCHEDULE: 'Special schedule',
};

const SpecialDaysTable = ({ tableRef, urlBackup, editModalToggle }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();

	const columns = useMemo(
		() => [
			{
				title: 'Name',
				field: 'name',
				render: (rowData: any) => rowData?.name || '----',
			},
			{
				title: 'Dates',
				field: 'from_date',
				sorting: false,
				render: (rowData: any) => {
					const from = rowData?.from_date || rowData?.date;
					const end = rowData?.end_date || rowData?.date;
					if (from && end) {
						const a = String(from).slice(0, 10);
						const b = String(end).slice(0, 10);
						return a === b ? a : `${a} → ${b}`;
					}
					return rowData?.date || '----';
				},
			},
			{
				title: 'Day Type',
				field: 'day_type',
				render: (rowData: any) => dayTypeLabelMap[rowData?.day_type] || rowData?.day_type || '----',
			},
		
			{
				title: 'Shift',
				field: 'shift_name',
				render: (rowData: any) =>
					rowData?.shift_details?.name ||
					rowData?.shift_details?.shift_name ||
					rowData?.shift_name ||
					'----',
			},
			{
				title: 'Notes',
				field: 'notes',
				sorting: false,
				render: (rowData: any) => rowData?.notes || '----',
			},
			{
				title: 'Actions',
				align: 'right' as const,
				removable: false,
				sorting: false,
				grouping: false,
				filtering: false,
				render: (rowData: any) => (
					<div className='d-flex gap-1 justify-content-end'>
						<EditButton modalShow={editModalToggle} id={rowData?.id} />
						<DeleteButton
							apiEndpoint={`api/hr/special-periods/${rowData?.id}/`}
							tableRef={tableRef}
							text='This special day will be deleted.'
						/>
					</div>
				),
			},
		],
		[editModalToggle, tableRef],
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
					onChangeRowsPerPage={setPageSize}
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
							const url = `/api/hr/special-periods/?limit=${query.pageSize}&offset=${
								query.pageSize * query.page
							}&search=${query.search}${orderBy}&${otherFilters}`;
							urlBackup.current = url;
							authAxios
								.get(url)
								.then((response) => {
									const results = response?.data?.results || [];
									resolve({
										data: results,
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
SpecialDaysTable.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default SpecialDaysTable;

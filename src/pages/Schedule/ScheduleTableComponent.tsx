import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { shiftHoursTargetFromApi } from './ScheduleFields';

const ScheduleTableComponent = ({ tableRef, urlBackup, editModalToggle }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(5);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();
	const navigate = useNavigate();

	const columns = useMemo(
		() => [
			{
				title: 'Name',
				field: 'name',
				render: (rowData: any) => rowData?.name || '----',
			},
			{
				title: 'Priority',
				field: 'priority_choice_number',
				render: (rowData: any) =>
					rowData?.priority_choice_number != null &&
					String(rowData.priority_choice_number).trim() !== ''
						? String(rowData.priority_choice_number)
						: '----',
			},
			{
				title: 'Shift',
				field: 'shift_name',
				render: (rowData: any) => {
					if (Array.isArray(rowData?.shifts) && rowData.shifts.length) {
						const names = rowData.shifts
							.map((shift: any) => shift?.name || shift?.shift_name)
							.filter(Boolean);
						return names.length ? names.join(', ') : '----';
					}
					return rowData?.shift_details?.name || rowData?.shift_details?.shift_name || rowData?.shift_name || '----';
				},
			},
			
			{
				title: 'Start Date',
				field: 'start_date',
				render: (rowData: any) => rowData?.start_date || '----',
			},
			{
				title: 'End Date',
				field: 'end_date',
				render: (rowData: any) => rowData?.end_date || '----',
			},
			{
				title: 'Applicable Days',
				field: 'applicable_days',
				sorting: false,
				render: (rowData: any) =>
					Array.isArray(rowData?.applicable_days) && rowData.applicable_days.length
						? rowData.applicable_days.join(', ')
						: '----',
			},
			{
				title: 'Max OT hrs / day',
				field: 'ot_hours',
				render: (rowData: any) =>
					rowData?.ot_hours != null && String(rowData.ot_hours).trim() !== ''
						? String(rowData.ot_hours)
						: '----',
			},
			{
				title: 'Hours target',
				field: 'shift_hours_target',
				sorting: false,
				render: (rowData: any) => {
					const raw = rowData?.shift_hours_target;
					if (raw == null || String(raw).trim() === '') return '----';
					return shiftHoursTargetFromApi(raw).label;
				},
			},
			{
				title: 'Min. target hrs',
				field: 'minimum_target_hours',
				render: (rowData: any) =>
					rowData?.minimum_target_hours != null &&
					String(rowData.minimum_target_hours).trim() !== ''
						? String(rowData.minimum_target_hours)
						: '----',
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
							apiEndpoint={`api/hr/schedules/${rowData?.id}/`}
							tableRef={tableRef}
							text='This schedule will be deleted.'
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
					onRowClick={(_e, rowData: any) => {
						if (rowData?.id != null) navigate(`/schedule-details/${rowData.id}`);
					}}
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
							const url = `/api/hr/schedules/?limit=${query.pageSize}&offset=${
								query.pageSize * query.page
							}&search=${query.search}${orderBy}&${otherFilters}`;

							urlBackup.current = url;
							authAxios
								.get(url)
								.then((response) => {
									const schedules = response?.data?.results || [];
									resolve({
										data: schedules,
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
ScheduleTableComponent.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default ScheduleTableComponent;

import React, { useCallback, useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Chip from '@mui/material/Chip';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditButton from '../../components/CustomComponent/Buttons/EditButton';
import DeleteButton from '../../components/CustomComponent/Buttons/DeleteButton';
import { authAxios } from '../../axiosInstance';
import useTablestyle from '../../hooks/useTablestyles';
import { formatFilters } from '../../helpers/functions';
import useToasterNotification from '../../hooks/useToasterNotification';
import Moments from '../../helpers/Moment';
import AttendanceEventsTimelineModal, {
	type AttendanceEventsTimelineContext,
} from './AttendanceEventsTimelineModal';
import {
	attendanceRowUserId,
	eventsFromAttendanceRow,
	formatAttendanceUserName,
	formatAttendanceOtTime,
	formatAttendanceWorkedTime,
	getAttendanceStatusMeta,
} from './attendanceStatusUtils';

const getEventTime = (rowData: any, eventType: string) => {
	const event = rowData?.events?.find((item: any) => item?.event_type === eventType);
	const timestamp = event?.timestamp;
	return Moments(timestamp , 'time') || '----';
};

const AttendanceTableComponent = ({ tableRef, urlBackup, editModalToggle }: any) => {
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(5);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const [timelineOpen, setTimelineOpen] = useState(false);
	const [timelineContext, setTimelineContext] = useState<AttendanceEventsTimelineContext | null>(
		null,
	);
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();

	const openEventsTimeline = useCallback((rowData: any) => {
		setTimelineContext({
			attendanceId: rowData?.id,
			userName: formatAttendanceUserName(rowData?.user),
			date: rowData?.date,
			status: rowData?.status,
			events: eventsFromAttendanceRow(rowData),
			userId: attendanceRowUserId(rowData),
		});
		setTimelineOpen(true);
	}, []);

	const columns = useMemo(
		() => [
			{ title: 'Date', field: 'date', render: (rowData: any) => rowData?.date || '----' },
			{ title: 'User', field: 'user__first_name', render: (rowData: any) => `${rowData?.user?.first_name} ${rowData?.user?.last_name}` || '----' },
		
			{
				title: 'Clock In',
				field: 'clock_in',
				render: (rowData: any) => getEventTime(rowData, 'CLOCK_IN'),
			},
			{ title: 'Clock Out', field: 'clock_out', render: (rowData: any) => getEventTime(rowData, 'CLOCK_OUT') },
			{
				title: 'Worked Time',
				field: 'worked_mins',
				render: (rowData: any) => formatAttendanceWorkedTime(rowData),
			},
			{
				title: 'OT',
				field: 'ot_mins',
				render: (rowData: any) => formatAttendanceOtTime(rowData),
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: any) => {
					const status = rowData?.status;
					if (!status) return '----';
					const meta = getAttendanceStatusMeta(status);
					const label = meta?.label || String(status).replace(/_/g, ' ');
					const color = meta?.color ?? '#6c757d';
					return (
						<Chip
							label={label}
							size='small'
							onClick={(e) => {
								e.stopPropagation();
								openEventsTimeline(rowData);
							}}
							sx={{
								fontWeight: 700,
								cursor: 'pointer',
								bgcolor: `${color}22`,
								color,
								'&:hover': { bgcolor: `${color}33` },
							}}
						/>
					);
				},
			},
			{
				title: 'Remarks',
				field: 'remarks',
				sorting: false,
				cellStyle: { maxWidth: 200 },
				render: (rowData: any) => {
					const remarks = rowData?.remarks;
					if (!remarks) return '----';
					return (
						<span
							className='d-inline-block text-truncate w-100'
							style={{ maxWidth: 200, verticalAlign: 'middle' }}
							title={remarks}>
							{remarks}
						</span>
					);
				},
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
							apiEndpoint={`/api/users/clock/portal/${rowData?.id}/`}
							tableRef={tableRef}
							text='This attendance record will be deleted.'
						/>
					</div>
				),
			},
		],
		[editModalToggle, openEventsTimeline, tableRef],
	);

	return (
		<div className='material-table-wrapper'>
			<AttendanceEventsTimelineModal
				isOpen={timelineOpen}
				setIsOpen={setTimelineOpen}
				context={timelineContext}
			/>
			<ThemeProvider theme={theme}>
				<MaterialTable
					key={`${sortState.orderBy ?? 'no-order'}-${sortState.orderDirection}`}
					title=' '
					columns={columns as any}
					tableRef={tableRef}
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
							const url = `/api/hr/attendance/?limit=${query.pageSize}&offset=${
								query.pageSize * query.page
							}&search=${query.search}${orderBy}&${otherFilters}`;

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
AttendanceTableComponent.propTypes = {
	tableRef: PropTypes.object.isRequired,
	urlBackup: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default AttendanceTableComponent;

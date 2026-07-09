import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { authAxios } from '../../axiosInstance';
import {  statusColorCodes,  userTypesToCapital } from '../../helpers/constants';
import useTablestyle from '../../hooks/useTablestyles';
import StatusButton from '../../components/CustomComponent/Buttons/StatusButton';
import CustomBadge from '../../components/CustomComponent/CustomBadge';
import { formatFilters } from '../../helpers/functions';
import useToasterNotification from '../../hooks/useToasterNotification';
import EditButton from '../../components/CustomComponent/Buttons/EditButton';

const SiteManagementTableComponent = (props) => {
	const { tableRef, editModalToggle ,urlBackup,tenant,activeTab} = props;
	const navigate = useNavigate();
	const isInitialRender = useRef(true);
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(5);
	const [sortState, setSortState] = useState({ orderBy: null, orderDirection: 'asc' });
	const { theme, rowStyles, headerStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();



	const staticColumns  = [
	
		{
			title: 'Name',
			field: 'name',
			render: (rowData) => (rowData?.name|| '----'),
		},
		{
			title: 'Type',
			field: 'type',
			render: (rowData) =>rowData?.type||'----',
		},
		{
			title: 'Parent Site',
			field: 'parent_site_name',
			render: (rowData) => (rowData?.parent_site_name || '----'),
		},
	
		{
			title: 'Authority One',
			field: 'authority_one_name',	
			render: (rowData) => (rowData?.authority_one_name || '----'),
		},
		{
			title: 'Authority Two',
			field: 'authority_two_name',
			render: (rowData) => (rowData?.authority_two_name || '----'),
		},
		// {
		// 	title: 'Status',
		// 	field: 'status',
		// 	render: (rowData) =>
		// 		rowData?.meta_data?.status ? (
		// 			<CustomBadge color={statusColorCodes[rowData?.meta_data?.status]}>
		// 				{rowData?.meta_data?.status}
		// 			</CustomBadge>
		// 		) : (
		// 			'----'
		// 		),
		// },
	];

	const actionButtons =[
		{
			title: 'Actions',
			align: 'right',
			removable: false,
			sorting: false,
			grouping: false,
			filtering: false,
			render: (rowData) => (
				<div className='d-flex gap-1 justify-content-end'>
					{/* {rowData?.meta_data?.status !== 'Invited' && (
						<StatusButton
							status={rowData.meta_data.status}
							fieldKey='status'
							tableRef={tableRef}
							api={`api/users/${rowData.id}`}
						/>
					)}

                    {rowData?.meta_data?.status === 'Invited' && (
                         <ResendButton id={rowData.id}/>						
					)} */}
					<EditButton modalShow={editModalToggle} id={rowData.id} />
				</div>
			),
		},
	]

	const columns = useMemo(() => {
        return [...staticColumns , ...actionButtons];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


	
	return (
		 <div className='material-table-wrapper'>
			<ThemeProvider theme={theme}>
				<MaterialTable
					key={`${activeTab}-${tenant?.id || 'no-tenant'}-${sortState.orderBy ?? 'no-order'}-${sortState.orderDirection}`}
					title=' '
					//@ts-ignore
					columns={columns}
					tableRef={tableRef}
					onChangeRowsPerPage={setPageSize}
					onRowClick={(_event, rowData) => {
						if (rowData?.id != null) navigate(`/site-details/${rowData.id}`);
					}}
					onOrderChange={(orderBy, orderDirection) => {
						setSortState({ orderBy, orderDirection });
					}}
					data={(query) => {
						return new Promise((resolve, reject) => {
							let orderBy = '';
							// let usersList = 'Admin,User,Assistant User';
							const otherFilters = formatFilters(query.filters);
							if (query.orderBy) {
								orderBy =
									query.orderDirection === 'asc'
										? `&ordering=-${String(query.orderBy?.field)}`
										: `&ordering=${String(query.orderBy?.field)}`;
							}
                            //  if(isSuperUser){
							// 	usersList='Admin,User,Superuser,Assistant User'
							//  }
							 
							let url = `/api/hr/sites/?limit=${
								query.pageSize
							}&offset=${query.pageSize * query.page}&search=${query.search}${orderBy}&${otherFilters}`;
							
							urlBackup.current = url;
							authAxios
								.get(url)
								.then((response) => {
									const userList = response.data?.results;
									resolve({
										data: userList,
										page: query.page,
										totalCount: response.data?.count,
									});
								})
								.catch((error) => {
									showErrorNotification(error);
									// eslint-disable-next-line prefer-promise-reject-errors
									reject({
										data: [],
										page: query.page,
										totalCount: 0,
									});
								});
						});
					}}
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
						rowStyle: () => ({
							...rowStyles(),
							cursor: 'pointer',
						}),
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
SiteManagementTableComponent.propTypes = {
	tableRef: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
	urlBackup: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default SiteManagementTableComponent;

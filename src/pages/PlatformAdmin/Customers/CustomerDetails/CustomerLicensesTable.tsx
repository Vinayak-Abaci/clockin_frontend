import React, { useMemo } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../../components/bootstrap/Card';
import Badge from '../../../../components/bootstrap/Badge';
import StatusBadge from '../../../../components/CustomComponent/StatusBadge';
import useTablestyle from '../../../../hooks/useTablestyles';
import Moments from '../../../../helpers/Moment';

type CustomerLicense = {
	id?: number;
	plan_name?: string;
	max_users?: number;
	start_date?: string;
	expiry_date?: string;
	status?: string;
	is_trial?: boolean;
	created_by_email?: string;
	created_at?: string;
};

type CustomerLicensesTableProps = {
	licenses?: CustomerLicense[];
};

const CustomerLicensesTable = ({ licenses = [] }: CustomerLicensesTableProps) => {
	const { theme, rowStyles, headerStyles } = useTablestyle();

	const columns = useMemo(
		() => [
			{
				title: 'Plan',
				field: 'plan_name',
				render: (rowData: CustomerLicense) => rowData?.plan_name || '----',
			},
			{
				title: 'Max Users',
				field: 'max_users',
				render: (rowData: CustomerLicense) => rowData?.max_users ?? '----',
			},
			{
				title: 'Start Date',
				field: 'start_date',
				render: (rowData: CustomerLicense) =>
					rowData?.start_date ? Moments(rowData.start_date, 'date') : '----',
			},
			{
				title: 'Expiry Date',
				field: 'expiry_date',
				render: (rowData: CustomerLicense) =>
					rowData?.expiry_date ? Moments(rowData.expiry_date, 'date') : '----',
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: CustomerLicense) => (
					<StatusBadge status={rowData?.status} emptyFallback='----' />
				),
			},
			{
				title: 'Trial',
				field: 'is_trial',
				render: (rowData: CustomerLicense) => (
					<Badge color={rowData?.is_trial ? 'info' : 'secondary'} isLight>
						{rowData?.is_trial ? 'Yes' : 'No'}
					</Badge>
				),
			},
			{
				title: 'Created By',
				field: 'created_by_email',
				render: (rowData: CustomerLicense) => rowData?.created_by_email || '----',
			},
			{
				title: 'Created At',
				field: 'created_at',
				render: (rowData: CustomerLicense) =>
					rowData?.created_at ? Moments(rowData.created_at, 'datetime') : '----',
			},
		],
		[],
	);

	return (
		<Card stretch className='w-100'>
			<CardHeader borderSize={1}>
				<CardLabel icon='CardMembership' iconColor='warning'>
					<CardTitle tag='div' className='h5'>
						Licenses
					</CardTitle>
				</CardLabel>
			</CardHeader>
			<CardBody className='table-responsive pt-0'>
				<div className='material-table-wrapper'>
					<ThemeProvider theme={theme}>
						<MaterialTable
							title=' '
							columns={columns as any}
							data={licenses}
							options={{
								headerStyle: headerStyles(),
								rowStyle: rowStyles(),
								paging: licenses.length > 10,
								pageSize: 10,
								pageSizeOptions: [10, 25, 50],
								search: false,
								filtering: false,
								toolbar: false,
								draggable: false,
								actionsColumnIndex: -1,
							}}
						/>
					</ThemeProvider>
				</div>
			</CardBody>
		</Card>
	);
};

/* eslint-disable react/forbid-prop-types */
CustomerLicensesTable.propTypes = {
	licenses: PropTypes.array,
};
/* eslint-enable react/forbid-prop-types */

CustomerLicensesTable.defaultProps = {
	licenses: [],
};

export default CustomerLicensesTable;

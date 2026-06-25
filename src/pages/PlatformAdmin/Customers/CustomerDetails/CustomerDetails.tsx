import React from 'react';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../../components/bootstrap/Card';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';
import Moments from '../../../../helpers/Moment';
import { TColor } from '../../../../type/color-type';
import { TIcons } from '../../../../type/icons-type';

const statusColor = (status: string) => {
	switch (String(status || '').toUpperCase()) {
		case 'ACTIVE':
			return 'success';
		case 'BLOCKED':
			return 'danger';
		default:
			return 'warning';
	}
};

const licenseStatusColor = (status: string) => {
	switch (String(status || '').toUpperCase()) {
		case 'ACTIVE':
			return 'success';
		case 'EXPIRED':
			return 'danger';
		default:
			return 'warning';
	}
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
	<div className='col-md-6 py-2'>
		<div className='text-muted small mb-1' style={{ fontSize: '0.78rem' }}>
			{label}
		</div>
		<div className='fw-semibold'>{value != null && value !== '' ? value : '—'}</div>
	</div>
);

type DetailSectionProps = {
	icon: TIcons;
	iconColor: TColor;
	title: string;
	children: React.ReactNode;
};

const DetailSection = ({ icon, iconColor, title, children }: DetailSectionProps) => (
	<div className='h-100 border rounded-3 p-3 p-lg-4'>
		<div className='d-flex align-items-center gap-3 mb-3 pb-3 border-bottom'>
			<div
				className='position-relative d-flex align-items-center justify-content-center rounded-3 flex-shrink-0'
				style={{ width: 42, height: 42 }}>
				<div
					className={`position-absolute top-0 start-0 w-100 h-100 rounded-3 bg-${iconColor} opacity-25`}
				/>
				<Icon icon={icon} color={iconColor} size='lg' className='position-relative' />
			</div>
			<h6 className='mb-0 fw-semibold'>{title}</h6>
		</div>
		{children}
	</div>
);

type ActiveLicense = {
	plan_name?: string;
	status?: string;
	is_trial?: boolean;
	max_users?: number;
	start_date?: string;
	expiry_date?: string;
};

type CustomerDetailsProps = {
	customer: Record<string, unknown> | null;
};

const CustomerDetails = ({ customer }: CustomerDetailsProps) => {
	if (!customer) return null;

	const status = String(customer?.status || '');
	const activeLicense = customer?.active_license as ActiveLicense | null | undefined;

	return (
		<Card stretch className='w-100 mb-0 shadow-sm'>
			<CardHeader borderSize={1}>
				<CardLabel icon='Business' iconColor='warning'>
					<CardTitle tag='div' className='h5 mb-0'>
						{String(customer?.name || 'Customer')}
					</CardTitle>
				</CardLabel>
			</CardHeader>
			<CardBody className='pt-3'>
				<div className='row g-4'>
					<div className='col-12 col-lg-6'>
						<DetailSection icon='Business' iconColor='primary' title='Company Details'>
							<div className='row g-1'>
								<DetailRow label='Company Name' value={customer?.name as string} />
								<DetailRow label='Schema' value={customer?.schema_name as string} />
								<DetailRow label='Primary Domain' value={customer?.primary_domain as string} />
								<DetailRow
									label='Status'
									value={
										status ? (
											<Badge color={statusColor(status)} isLight>
												{status}
											</Badge>
										) : undefined
									}
								/>
								<DetailRow
									label='On Trial'
									value={
										<Badge color={customer?.on_trial ? 'info' : 'secondary'} isLight>
											{customer?.on_trial ? 'Yes' : 'No'}
										</Badge>
									}
								/>
								<DetailRow
									label='Paid Until'
									value={
										customer?.paid_until
											? Moments(String(customer.paid_until), 'date')
											: undefined
									}
								/>
								<DetailRow
									label='Created'
									value={
										customer?.created_on
											? Moments(String(customer.created_on), 'date')
											: undefined
									}
								/>
							</div>
						</DetailSection>
					</div>

					<div className='col-12 col-lg-6'>
						<DetailSection icon='CardMembership' iconColor='success' title='Active License'>
							{activeLicense ? (
								<div className='row g-1'>
									<DetailRow label='Plan' value={activeLicense?.plan_name} />
									<DetailRow
										label='License Status'
										value={
											activeLicense?.status ? (
												<Badge color={licenseStatusColor(activeLicense.status)} isLight>
													{activeLicense.status}
												</Badge>
											) : undefined
										}
									/>
									<DetailRow label='Max Users' value={activeLicense?.max_users} />
									<DetailRow
										label='Trial'
										value={
											<Badge color={activeLicense?.is_trial ? 'info' : 'secondary'} isLight>
												{activeLicense?.is_trial ? 'Yes' : 'No'}
											</Badge>
										}
									/>
									<DetailRow
										label='Start Date'
										value={
											activeLicense?.start_date
												? Moments(activeLicense.start_date, 'date')
												: undefined
										}
									/>
									<DetailRow
										label='Expiry Date'
										value={
											activeLicense?.expiry_date
												? Moments(activeLicense.expiry_date, 'date')
												: undefined
										}
									/>
								</div>
							) : (
								<div className='text-muted text-center py-4'>
									<Icon icon='Info' className='mb-2' size='2x' />
									<div>No active license</div>
								</div>
							)}
						</DetailSection>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default CustomerDetails;

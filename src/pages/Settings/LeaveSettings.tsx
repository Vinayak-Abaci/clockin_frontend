import React, { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Spinner } from 'reactstrap';
import Slider from '@mui/material/Slider';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import CheckboxWithLabel from '../../components/CustomComponent/CheckboxWithLabel';
import ReactSelectComponent from '../../components/CustomComponent/Select/ReactSelectComponent';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import usePermissionHook from '../../hooks/userPermissionHook';
import {
	APPROVER_ROLE_OPTIONS,
	buildCompanyHrSettingsPayload,
	COMPANY_HR_SETTINGS_DEFAULTS,
	EXTRA_WORK_COMPENSATION_OPTIONS,
	FISCAL_MONTH_OPTIONS,
	MULTI_SHIFT_PARTIAL_STATUS_OPTIONS,
	toCompanyHrSettingsForm,
	type CompanyHrSettingsFormValues,
	unwrapCompanyHrSettings,
	YEARLY_RESET_BASIS_OPTIONS,
} from './companyHrSettingsUtils';

const SETTINGS_URL = '/api/hr/company-hr-settings/';

const compOffMarks = [
	{ value: 30, label: '30' },
	{ value: 90, label: '90' },
	{ value: 180, label: '180' },
	{ value: 365, label: '365' },
];

const fiscalMonthMarks = FISCAL_MONTH_OPTIONS.map((month) => ({
	value: month.value,
	label: String(month.value),
}));

const LeaveSettings: FC = () => {
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const [pageLoading, setPageLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const canManageSettings = usePermissionHook('manage_general_settings');

	const {
		register,
		reset,
		getValues,
		control,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<CompanyHrSettingsFormValues>({
		defaultValues: COMPANY_HR_SETTINGS_DEFAULTS,
	});

	const yearlyResetBasis = watch('yearly_reset_basis');
	const extraWorkCompensation = watch('extra_work_compensation');
	const compOffExpiryDays = watch('comp_off_expiry_days') ?? 90;
	const fiscalMonth = watch('fiscal_year_start_month') ?? 4;

	const showFiscalMonth = yearlyResetBasis?.value === 'FINANCIAL_YEAR';
	const showCompOffExpiry =
		extraWorkCompensation?.value === 'COMP_OFF' || extraWorkCompensation?.value === 'EMPLOYEE_CHOICE';

	useEffect(() => {
		let cancelled = false;

		authAxios
			.get(SETTINGS_URL)
			.then((res) => {
				if (cancelled) return;
				const settings = unwrapCompanyHrSettings(res.data);
				if (settings) {
					reset(toCompanyHrSettingsForm(settings as Record<string, unknown>));
				}
			})
			.catch((err) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setPageLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const saveSettings = () => {
		const values = getValues();
		if (!values.default_timezone?.trim()) {
			showErrorNotification('Default timezone is required.');
			return;
		}
		if (!values.multi_shift_partial_status?.value || !values.yearly_reset_basis?.value || !values.extra_work_compensation?.value) {
			showErrorNotification('Please fill all required fields.');
			return;
		}

		setSaving(true);
		authAxios
			.patch(SETTINGS_URL, buildCompanyHrSettingsPayload(values))
			.then((res) => {
				const settings = unwrapCompanyHrSettings(res?.data);
				if (settings) {
					reset(toCompanyHrSettingsForm(settings as Record<string, unknown>));
				} else {
					reset(values);
				}
				showSuccessNotification('Settings saved successfully.');
			})
			.catch((err) => {
				showErrorNotification(err);
			})
			.finally(() => {
				setSaving(false);
			});
	};

	if (pageLoading) {
		return (
			<div className='d-flex justify-content-center py-5'>
				<AbaciLoader />
			</div>
		);
	}

	return (
		<Card stretch className='user-select-none shadow-3d-secondary'>
			<CardHeader>
				<CardLabel icon='Settings' iconColor='warning'>
					<CardTitle tag='div' className='h5 text-warning mb-0'>
						Leave Settings
					</CardTitle>
				</CardLabel>
				<CardActions>
					{canManageSettings ? (
						<Button
							color='warning'
							onClick={saveSettings}
							isLight
							icon='Save'
							isDisable={saving || !isDirty}>
							{saving ? <Spinner size='sm' /> : 'Save'}
						</Button>
					) : null}
				</CardActions>
			</CardHeader>
			<CardBody>
				<div className='row g-4'>
					<div className='col-md-6'>
						<ReactSelectComponent
							control={control}
							name='Multi-shift partial status *'
							isMulti={false}
							field_name='multi_shift_partial_status'
							getValues={getValues}
							errors={errors}
							options={MULTI_SHIFT_PARTIAL_STATUS_OPTIONS}
							isRequired
						/>
					</div>

					<div className='col-md-6'>
						<FormGroup label='Default timezone *'>
							<input
								type='text'
								className='form-control'
								style={{ height: '40px' }}
								{...register('default_timezone', { required: true })}
							/>
							{errors.default_timezone ? (
								<span style={{ color: 'red' }}>*This field is required</span>
							) : (
								<p />
							)}
						</FormGroup>
					</div>
					<div className='col-md-6'>
						<ReactSelectComponent
							control={control}
							name='Yearly reset basis *'
							isMulti={false}
							field_name='yearly_reset_basis'
							getValues={getValues}
							errors={errors}
							options={YEARLY_RESET_BASIS_OPTIONS}
							isRequired
						/>
					</div>

					{showFiscalMonth ? (
						<div className='col-md-6'>
							<FormGroup
								label={`Fiscal year start month: ${
									FISCAL_MONTH_OPTIONS.find((m) => m.value === fiscalMonth)?.label ?? fiscalMonth
								}`}>
								<input type='hidden' {...register('fiscal_year_start_month', { min: 1, max: 12 })} />
								<div style={{ padding: '12px 10px' }}>
									<Slider
										sx={{ color: 'warning.main' }}
										aria-label='Fiscal year start month'
										marks={fiscalMonthMarks}
										valueLabelDisplay='on'
										value={fiscalMonth}
										step={1}
										min={1}
										max={12}
										onChange={(_event, value) =>
											setValue('fiscal_year_start_month', value as number, {
												shouldDirty: true,
											})
										}
									/>
								</div>
							</FormGroup>
						</div>
					) : null}

					<div className='col-md-6'>
						<ReactSelectComponent
							control={control}
							name='Extra work compensation *'
							isMulti={false}
							field_name='extra_work_compensation'
							getValues={getValues}
							errors={errors}
							options={EXTRA_WORK_COMPENSATION_OPTIONS}
							isRequired
						/>
					</div>

					{showCompOffExpiry ? (
						<div className='col-md-6'>
							<FormGroup label={`Comp off expiry: ${compOffExpiryDays} days`}>
								<input type='hidden' {...register('comp_off_expiry_days', { min: 1, max: 365 })} />
								<div style={{ padding: '12px 10px' }}>
									<Slider
										sx={{ color: 'warning.main' }}
										aria-label='Comp off expiry days'
										marks={compOffMarks}
										valueLabelDisplay='on'
										value={compOffExpiryDays}
										step={1}
										min={1}
										max={365}
										onChange={(_event, value) =>
											setValue('comp_off_expiry_days', value as number, { shouldDirty: true })
										}
									/>
								</div>
							</FormGroup>
						</div>
					) : null}

					<div className='col-md-6'>
						<ReactSelectComponent
							control={control}
							name='WFH approval'
							isMulti
							field_name='wfh_approval_workflow'
							getValues={getValues}
							errors={errors}
							options={APPROVER_ROLE_OPTIONS}
							isClearable
						/>
					</div>

					<div className='col-md-6'>
						<ReactSelectComponent
							control={control}
							name='Asset approval'
							isMulti
							field_name='asset_approval_workflow'
							getValues={getValues}
							errors={errors}
							options={APPROVER_ROLE_OPTIONS}
							isClearable
						/>
					</div>

					<div className='col-md-6'>
						<CheckboxWithLabel
							control={control}
							name='absent_when_below_minimum'
							label='Mark absent when below minimum hours'
							layout='form-field'
						/>
					</div>

					{/* <div className='col-12'>
						<hr className='my-1 mt-5' />
						<p className='text-warning fs-5 fw-semibold mb-0 mt-5 mb-5'>Attendance GPS</p>
					</div> */}

                 {/* <div className='row'>
					<div className='col-md-6'>
						<FormGroup label='Geofence radius (meters) *'>
							<input
								type='number'
								className='form-control'
								style={{ height: '40px' }}
								min={10}
								max={500}
								step={5}
								{...register('attendance_geofence_radius_meters', {
									required: true,
									valueAsNumber: true,
									min: 10,
									max: 500,
								})}
							/>
							{errors.attendance_geofence_radius_meters ? (
								<span style={{ color: 'red' }}>*Enter a value between 10 and 500</span>
							) : (
								<p />
							)}
						</FormGroup>
					</div>
					</div>
					<div className='col-md-6'>
						<CheckboxWithLabel
							control={control}
							name='attendance_gps_required'
							label='GPS required for attendance'
							layout='form-field'
						/>
					</div>

					<div className='col-md-6'>
						<CheckboxWithLabel
							control={control}
							name='attendance_gps_strict'
							label='Strict GPS validation'
							layout='form-field'
						/>
					</div> */}
				</div>
			</CardBody>
		</Card>
	);
};

export default LeaveSettings;

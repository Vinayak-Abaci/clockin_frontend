export const MULTI_SHIFT_PARTIAL_STATUS_OPTIONS = [
	{ label: 'Present', value: 'PRESENT' },
	{ label: 'Half day', value: 'HALF_DAY' },
	{ label: 'Absent', value: 'ABSENT' },
];

export const YEARLY_RESET_BASIS_OPTIONS = [
	{ label: 'Calendar year', value: 'CALENDAR_YEAR' },
	{ label: 'Financial year', value: 'FINANCIAL_YEAR' },
	{ label: 'Anniversary', value: 'ANNIVERSARY' },
];

export const EXTRA_WORK_COMPENSATION_OPTIONS = [
	{ label: 'None', value: 'NONE' },
	{ label: 'Comp off', value: 'COMP_OFF' },
	{ label: 'OT pay', value: 'OT_PAY' },
	{ label: 'Employee choice', value: 'EMPLOYEE_CHOICE' },
];

export const FISCAL_MONTH_OPTIONS = [
	{ label: 'January', value: 1 },
	{ label: 'February', value: 2 },
	{ label: 'March', value: 3 },
	{ label: 'April', value: 4 },
	{ label: 'May', value: 5 },
	{ label: 'June', value: 6 },
	{ label: 'July', value: 7 },
	{ label: 'August', value: 8 },
	{ label: 'September', value: 9 },
	{ label: 'October', value: 10 },
	{ label: 'November', value: 11 },
	{ label: 'December', value: 12 },
];

export const APPROVER_ROLE_OPTIONS = [
	{ label: 'Reporting Manager', value: 'REPORTING_MANAGER' },
	{ label: 'HR', value: 'HR' },
	{ label: 'Group Contact', value: 'GROUP_CONTACT' },
];

export type SelectOption = { label: string; value: string };

export type ApprovalWorkflowLevel = {
	level: number;
	approver_role: string;
	is_compulsory: boolean;
};

const findStringOption = (options: SelectOption[], value: unknown) =>
	options.find((option) => option.value === String(value ?? '')) ?? null;

const workflowToSelectOptions = (raw: unknown): SelectOption[] => {
	if (!Array.isArray(raw)) return [];
	return [...raw]
		.filter((row) => row && typeof row === 'object')
		.sort((a, b) => Number((a as ApprovalWorkflowLevel).level ?? 0) - Number((b as ApprovalWorkflowLevel).level ?? 0))
		.map((row) => {
			const role = String((row as ApprovalWorkflowLevel).approver_role ?? '')
				.trim()
				.toUpperCase();
			if (!role) return null;
			return (
				findStringOption(APPROVER_ROLE_OPTIONS, role) ?? {
					label: role.replace(/_/g, ' '),
					value: role,
				}
			);
		})
		.filter((option): option is SelectOption => Boolean(option));
};

const selectOptionsToWorkflow = (options: SelectOption[] | null | undefined): ApprovalWorkflowLevel[] => {
	if (!Array.isArray(options)) return [];
	return options
		.map((option, index) => {
			const approver_role = String(option?.value ?? '')
				.trim()
				.toUpperCase();
			if (!approver_role) return null;
			return {
				level: index + 1,
				approver_role,
				is_compulsory: true,
			};
		})
		.filter((row): row is ApprovalWorkflowLevel => Boolean(row));
};

export type CompanyHrSettingsFormValues = {
	multi_shift_partial_status: SelectOption | null;
	absent_when_below_minimum: boolean;
	default_timezone: string;
	yearly_reset_basis: SelectOption | null;
	fiscal_year_start_month: number;
	extra_work_compensation: SelectOption | null;
	comp_off_expiry_days: number;
	attendance_geofence_radius_meters: number;
	attendance_gps_required: boolean;
	attendance_gps_strict: boolean;
	asset_approval_workflow: SelectOption[];
	wfh_approval_workflow: SelectOption[];
};

export const COMPANY_HR_SETTINGS_DEFAULTS: CompanyHrSettingsFormValues = {
	multi_shift_partial_status: findStringOption(MULTI_SHIFT_PARTIAL_STATUS_OPTIONS, 'HALF_DAY'),
	absent_when_below_minimum: true,
	default_timezone: 'Asia/Kolkata',
	yearly_reset_basis: findStringOption(YEARLY_RESET_BASIS_OPTIONS, 'CALENDAR_YEAR'),
	fiscal_year_start_month: 4,
	extra_work_compensation: findStringOption(EXTRA_WORK_COMPENSATION_OPTIONS, 'NONE'),
	comp_off_expiry_days: 90,
	attendance_geofence_radius_meters: 100,
	attendance_gps_required: false,
	attendance_gps_strict: false,
	asset_approval_workflow: [],
	wfh_approval_workflow: [],
};

export const unwrapCompanyHrSettings = (data: unknown) => {
	if (!data) return null;
	if (Array.isArray(data)) return data[0] ?? null;
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.results)) return record.results[0] ?? null;
	if (record.id != null) return record;
	return null;
};

export const toCompanyHrSettingsForm = (
	data: Record<string, unknown>,
): CompanyHrSettingsFormValues => ({
	multi_shift_partial_status:
		findStringOption(MULTI_SHIFT_PARTIAL_STATUS_OPTIONS, data.multi_shift_partial_status) ??
		COMPANY_HR_SETTINGS_DEFAULTS.multi_shift_partial_status,
	absent_when_below_minimum:
		data.absent_when_below_minimum != null
			? Boolean(data.absent_when_below_minimum)
			: COMPANY_HR_SETTINGS_DEFAULTS.absent_when_below_minimum,
	default_timezone: String(data.default_timezone || COMPANY_HR_SETTINGS_DEFAULTS.default_timezone),
	yearly_reset_basis:
		findStringOption(YEARLY_RESET_BASIS_OPTIONS, data.yearly_reset_basis) ??
		COMPANY_HR_SETTINGS_DEFAULTS.yearly_reset_basis,
	fiscal_year_start_month:
		Number(data.fiscal_year_start_month) || COMPANY_HR_SETTINGS_DEFAULTS.fiscal_year_start_month,
	extra_work_compensation:
		findStringOption(EXTRA_WORK_COMPENSATION_OPTIONS, data.extra_work_compensation) ??
		COMPANY_HR_SETTINGS_DEFAULTS.extra_work_compensation,
	comp_off_expiry_days:
		Number(data.comp_off_expiry_days) || COMPANY_HR_SETTINGS_DEFAULTS.comp_off_expiry_days,
	attendance_geofence_radius_meters:
		Number(data.attendance_geofence_radius_meters) ||
		COMPANY_HR_SETTINGS_DEFAULTS.attendance_geofence_radius_meters,
	attendance_gps_required:
		data.attendance_gps_required != null
			? Boolean(data.attendance_gps_required)
			: COMPANY_HR_SETTINGS_DEFAULTS.attendance_gps_required,
	attendance_gps_strict:
		data.attendance_gps_strict != null
			? Boolean(data.attendance_gps_strict)
			: COMPANY_HR_SETTINGS_DEFAULTS.attendance_gps_strict,
	asset_approval_workflow: workflowToSelectOptions(data.asset_approval_workflow),
	wfh_approval_workflow: workflowToSelectOptions(data.wfh_approval_workflow),
});

export const buildCompanyHrSettingsPayload = (values: CompanyHrSettingsFormValues) => {
	const payload: Record<string, unknown> = {
		multi_shift_partial_status: values.multi_shift_partial_status?.value,
		absent_when_below_minimum: values.absent_when_below_minimum,
		default_timezone: values.default_timezone.trim(),
		yearly_reset_basis: values.yearly_reset_basis?.value,
		extra_work_compensation: values.extra_work_compensation?.value,
		comp_off_expiry_days: values.comp_off_expiry_days,
		attendance_geofence_radius_meters: values.attendance_geofence_radius_meters,
		attendance_gps_required: values.attendance_gps_required,
		attendance_gps_strict: values.attendance_gps_strict,
		asset_approval_workflow: selectOptionsToWorkflow(values.asset_approval_workflow),
		wfh_approval_workflow: selectOptionsToWorkflow(values.wfh_approval_workflow),
	};

	if (values.yearly_reset_basis?.value === 'FINANCIAL_YEAR') {
		payload.fiscal_year_start_month = values.fiscal_year_start_month;
	}

	return payload;
};

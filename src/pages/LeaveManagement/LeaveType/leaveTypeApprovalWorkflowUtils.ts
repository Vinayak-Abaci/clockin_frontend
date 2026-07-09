import { APPROVER_TYPE_OPTIONS } from './LeaveTypeApprovalWorkflow';

const normalizeApproverRoleKey = (workflow: Record<string, unknown>): string =>
	String(workflow?.approver_role ?? workflow?.approver_type ?? '')
		.trim()
		.toUpperCase();

const normalizeMandatoryFlag = (workflow: Record<string, unknown>): boolean =>
	Boolean(workflow?.is_compulsory ?? workflow?.mandatory);

export const mapApprovalWorkflowsFromApi = (raw: unknown) => {
	if (!Array.isArray(raw)) return [];
	return [...raw]
		.filter((w) => {
			if (!w || typeof w !== 'object') return false;
			const role = normalizeApproverRoleKey(w as Record<string, unknown>);
			if (role === 'SPECIFIC_USER') return false;
			if ((w as Record<string, unknown>).approver_user != null) return false;
			return true;
		})
		.sort((a, b) => Number(a?.level ?? 0) - Number(b?.level ?? 0))
		.map((w) => {
			const typeKey = normalizeApproverRoleKey(w as Record<string, unknown>);
			const approver_type =
				APPROVER_TYPE_OPTIONS.find((o) => o.value === typeKey) ?? {
					label: typeKey.replace(/_/g, ' '),
					value: typeKey,
				};

			return {
				approver_type,
				mandatory: normalizeMandatoryFlag(w as Record<string, unknown>),
			};
		});
};

export const buildApprovalWorkflowsPayload = (rows: unknown): any[] => {
	if (!Array.isArray(rows)) return [];
	return rows
		.map((row: any, idx) => {
			const approver_role = String(row?.approver_type?.value ?? row?.approver_type ?? '')
				.trim()
				.toUpperCase();
			if (!approver_role || approver_role === 'SPECIFIC_USER') return null;

			return {
				level: idx + 1,
				approver_role,
				is_compulsory: Boolean(row?.mandatory),
			};
		})
		.filter(Boolean);
};

export const validateApprovalWorkflows = (rows: unknown): string | null => {
	if (!Array.isArray(rows) || rows.length === 0) return null;
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i] as any;
		const approver_role = String(row?.approver_type?.value ?? row?.approver_type ?? '')
			.trim()
			.toUpperCase();
		if (!approver_role) {
			return `Level ${i + 1}: select an approver type.`;
		}
	}
	return null;
};

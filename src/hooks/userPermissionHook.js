import { useContext } from 'react';
import AuthContext from '../contexts/authContext';
import {
	isPlatformAdmin,
	isPlatformPartner,
	resolveTenantRouteRole,
} from '../helpers/roleToggleUtils';

/** Tenant console roles that can manage most HR/admin screens. */
const ADMIN_CONSOLE = ['Admin', 'HR', 'Manager'];
/** Tenant admin only. */
const TENANT_ADMIN = ['Admin'];
/** View-style access (admin console + assistants historically). */
const VIEW_CONSOLE = ['Admin', 'HR', 'Manager'];

const permissionObject = {
	is_super_user: TENANT_ADMIN,
	vehicle_management: TENANT_ADMIN,
	business_space_management: TENANT_ADMIN,
	blacklist_management: TENANT_ADMIN,
	gate_management: TENANT_ADMIN,
	exit_request_management: TENANT_ADMIN,
	manage_user: ADMIN_CONSOLE,
	manage_user_group: ADMIN_CONSOLE,
	manage_schedule: ADMIN_CONSOLE,
	manage_shift: ADMIN_CONSOLE,
	view_user_details: VIEW_CONSOLE,
	manage_general_settings: ADMIN_CONSOLE,
	manage_building: TENANT_ADMIN,
	manage_controller: TENANT_ADMIN,
	company_admin: TENANT_ADMIN,
	overnight_request_management: ADMIN_CONSOLE,
	view_tenant_filter: ['platform_admin', 'Admin', 'HR', 'Manager'],
};

const resolveCurrentRole = (userData) => {
	if (isPlatformAdmin(userData)) return 'platform_admin';
	if (isPlatformPartner(userData)) return 'partner';
	return resolveTenantRouteRole(userData);
};

const usePermissionHook = (page) => {
	const { userData } = useContext(AuthContext);
	const allowedRoles = permissionObject[page] || [];
	const currentRole = resolveCurrentRole(userData);
	return allowedRoles.includes(currentRole);
};

export default usePermissionHook;

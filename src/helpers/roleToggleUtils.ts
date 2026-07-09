const ROLE_TOGGLE_TYPES = new Set(['Admin', 'Manager', 'HR']);
const USER_HOME_PATH = '/leave-requests';
export const PLATFORM_ADMIN_HOME_PATH = '/registrations';
export const PLATFORM_ADMIN_ROUTE_ROLE = 'platform_admin';
export const PLATFORM_PARTNER_HOME_PATH = '/customers';
export const PARTNER_ROUTE_ROLE = 'partner';

export type TenantRouteRole = 'Admin' | 'HR' | 'Manager' | 'user';

type UserTypeInput =
	| string
	| { name?: string; role_name?: string }
	| null
	| undefined;

export type UserDataInput = {
	is_platform_admin?: boolean;
	is_platform_partner?: boolean;
	is_tenant_admin?: boolean;
	is_hr?: boolean;
	is_manager?: boolean;
	user_type?: UserTypeInput;
} | null | undefined;

const toBool = (value: unknown): boolean =>
	value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const isProfileLike = (value: unknown): value is UserDataInput =>
	value != null &&
	typeof value === 'object' &&
	!Array.isArray(value) &&
	('is_tenant_admin' in value ||
		'is_hr' in value ||
		'is_manager' in value ||
		'is_platform_admin' in value ||
		'is_platform_partner' in value ||
		'user_type' in value);

export const resolveUserTypeString = (userType: UserTypeInput): string => {
	if (userType == null) return '';
	if (typeof userType === 'object') {
		return String(userType.name ?? userType.role_name ?? '');
	}
	return String(userType);
};

/**
 * Maps `/api/users/profile/` tenant flags to route/menu role keys
 * (`Admin` | `HR` | `Manager` | `user`) used in RoutesMenu & contentRoutes.
 */
export const resolveTenantRouteRole = (userData: UserDataInput): TenantRouteRole => {
	if (!userData || typeof userData !== 'object') return 'user';

	if (toBool(userData.is_tenant_admin)) return 'Admin';
	if (toBool(userData.is_hr)) return 'HR';
	if (toBool(userData.is_manager)) return 'Manager';

	const legacy = resolveUserTypeString(userData.user_type);
	if (legacy === 'Admin' || legacy === 'HR' || legacy === 'Manager') return legacy;

	return 'user';
};

export const isUserRole = (userTypeOrData: UserTypeInput | UserDataInput = null): boolean => {
	if (isProfileLike(userTypeOrData)) {
		return resolveTenantRouteRole(userTypeOrData) === 'user';
	}
	return resolveUserTypeString(userTypeOrData as UserTypeInput).toLowerCase() === 'user';
};

/** Self toggle, or plain employee — same sidebar and route access. */
export const isSelfEquivalentMode = (
	userTypeOrData: UserTypeInput | UserDataInput,
	mode: string,
): boolean => isUserRole(userTypeOrData) || (canUseRoleToggle(userTypeOrData) && mode === 'Self');

export const getUserHomePath = (): string => USER_HOME_PATH;

export const isPlatformAdmin = (userData: UserDataInput): boolean =>
	userData?.is_platform_admin === true;

export const isPlatformPartner = (userData: UserDataInput): boolean =>
	userData?.is_platform_partner === true;

export const getHomePathForUserType = (userType: UserTypeInput): string =>
	isUserRole(userType) ? USER_HOME_PATH : '/';

export const getHomePathForUser = (userData: UserDataInput): string => {
	if (isPlatformAdmin(userData)) return PLATFORM_ADMIN_HOME_PATH;
	if (isPlatformPartner(userData)) return PLATFORM_PARTNER_HOME_PATH;
	if (isUserRole(userData)) return USER_HOME_PATH;
	return '/';
};

export const canUseRoleToggle = (userTypeOrData: UserTypeInput | UserDataInput = null): boolean => {
	if (isProfileLike(userTypeOrData)) {
		const role = resolveTenantRouteRole(userTypeOrData);
		return role === 'Admin' || role === 'HR' || role === 'Manager';
	}
	return ROLE_TOGGLE_TYPES.has(resolveUserTypeString(userTypeOrData as UserTypeInput));
};

export const isPrivilegedToggleMode = (
	userTypeOrData: UserTypeInput | UserDataInput,
	mode: string,
): boolean => canUseRoleToggle(userTypeOrData) && mode !== 'Self';

export const getPrivilegedToggleLabel = (userTypeOrData: UserTypeInput | UserDataInput = null): string => {
	const role = isProfileLike(userTypeOrData)
		? resolveTenantRouteRole(userTypeOrData)
		: resolveUserTypeString(userTypeOrData as UserTypeInput);
	return ROLE_TOGGLE_TYPES.has(role) ? role : 'Admin';
};

export const getEffectiveUserTypeForRoutes = (
	userTypeOrData: UserTypeInput | UserDataInput,
	mode: string,
	userData?: UserDataInput,
): string => {
	const profile: UserDataInput = userData ?? (isProfileLike(userTypeOrData) ? userTypeOrData : null);

	if (isPlatformAdmin(profile)) return PLATFORM_ADMIN_ROUTE_ROLE;
	if (isPlatformPartner(profile)) return PARTNER_ROUTE_ROLE;

	const roleSource: UserDataInput =
		profile ??
		(isProfileLike(userTypeOrData)
			? userTypeOrData
			: { user_type: userTypeOrData as UserTypeInput });

	if (isSelfEquivalentMode(roleSource, mode)) return 'user';

	return resolveTenantRouteRole(roleSource);
};

/** Static tenant role options for user create/edit forms (no roles API). */
export const TENANT_USER_ROLE_OPTIONS: { label: string; value: TenantRouteRole }[] = [
	{ label: 'Employee', value: 'user' },
	{ label: 'Admin', value: 'Admin' },
	{ label: 'HR', value: 'HR' },
	{ label: 'Manager', value: 'Manager' },
];

export const tenantRoleFlagsFromSelect = (
	role: TenantRouteRole | string | null | undefined,
): { is_tenant_admin: boolean; is_hr: boolean; is_manager: boolean } => ({
	is_tenant_admin: role === 'Admin',
	is_hr: role === 'HR',
	is_manager: role === 'Manager',
});

export const mapAccountToTenantRoleSelect = (
	user: UserDataInput | Record<string, unknown> | null | undefined,
) => {
	const role = resolveTenantRouteRole(user as UserDataInput);
	return TENANT_USER_ROLE_OPTIONS.find((option) => option.value === role) ?? TENANT_USER_ROLE_OPTIONS[0];
};

export const appendTenantRoleFormFields = (
	formData: FormData,
	tenantRole: { value?: string } | string | null | undefined,
) => {
	const roleKey =
		typeof tenantRole === 'object' && tenantRole != null ? tenantRole.value : tenantRole;
	const flags = tenantRoleFlagsFromSelect(
		roleKey != null && roleKey !== '' ? String(roleKey) : 'user',
	);
	formData.append('is_tenant_admin', String(flags.is_tenant_admin));
	formData.append('is_hr', String(flags.is_hr));
	formData.append('is_manager', String(flags.is_manager));
};

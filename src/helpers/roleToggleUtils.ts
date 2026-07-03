const ROLE_TOGGLE_TYPES = new Set(['Admin', 'Manager', 'HR']);
const USER_HOME_PATH = '/leave-requests';
export const PLATFORM_ADMIN_HOME_PATH = '/registrations';
export const PLATFORM_ADMIN_ROUTE_ROLE = 'platform_admin';
export const PLATFORM_PARTNER_HOME_PATH = '/customers';
export const PARTNER_ROUTE_ROLE = 'partner';

type UserDataInput = {
	is_platform_admin?: boolean;
	is_platform_partner?: boolean;
	user_type?: UserTypeInput;
} | null | undefined;

type UserTypeInput =
	| string
	| { name?: string; role_name?: string }
	| null
	| undefined;

export const resolveUserTypeString = (userType: UserTypeInput): string => {
	if (userType == null) return '';
	if (typeof userType === 'object') {
		return String(userType.name ?? userType.role_name ?? '');
	}
	return String(userType);
};

export const isUserRole = (userType: UserTypeInput): boolean =>
	resolveUserTypeString(userType).toLowerCase() === 'user';

/** Self toggle, or plain User role — same sidebar and route access. */
export const isSelfEquivalentMode = (userType: UserTypeInput, mode: string): boolean =>
	isUserRole(userType) || (canUseRoleToggle(userType) && mode === 'Self');

export const getUserHomePath = (): string => USER_HOME_PATH;

export const isPlatformAdmin = (userData: UserDataInput): boolean =>
	userData?.is_platform_admin === true;

export const isPlatformPartner = (userData: UserDataInput): boolean => userData?.is_platform_partner === true;

export const getHomePathForUserType = (userType: UserTypeInput): string =>
	isUserRole(userType) ? USER_HOME_PATH : '/';

export const getHomePathForUser = (userData: UserDataInput): string => {
	if (isPlatformAdmin(userData)) return PLATFORM_ADMIN_HOME_PATH;
	if (isPlatformPartner(userData)) return PLATFORM_PARTNER_HOME_PATH;
	return getHomePathForUserType(userData?.user_type);
};

export const canUseRoleToggle = (userType: UserTypeInput): boolean =>
	ROLE_TOGGLE_TYPES.has(resolveUserTypeString(userType));

export const isPrivilegedToggleMode = (
	userType: UserTypeInput,
	mode: string,
): boolean => canUseRoleToggle(userType) && mode !== 'Self';

export const getPrivilegedToggleLabel = (userType: UserTypeInput): string => {
	const role = resolveUserTypeString(userType);
	return ROLE_TOGGLE_TYPES.has(role) ? role : 'Admin';
};

export const getEffectiveUserTypeForRoutes = (
	userType: UserTypeInput,
	mode: string,
	userData?: UserDataInput,
): string | null | undefined => {
	if (isPlatformAdmin(userData)) {
		return PLATFORM_ADMIN_ROUTE_ROLE;
	}
	if (isPlatformPartner(userData)) {
		return PARTNER_ROUTE_ROLE;
	}
	if (isSelfEquivalentMode(userType, mode)) {
		return 'user';
	}
	const role = resolveUserTypeString(userType);
	return role || null;
};

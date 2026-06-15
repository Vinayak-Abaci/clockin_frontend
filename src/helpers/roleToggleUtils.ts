const ROLE_TOGGLE_TYPES = new Set(['Admin', 'Manager', 'HR']);
const USER_HOME_PATH = '/leave-requests';

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

export const getHomePathForUserType = (userType: UserTypeInput): string =>
	isUserRole(userType) ? USER_HOME_PATH : '/';

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
): string | null | undefined => {
	if (isSelfEquivalentMode(userType, mode)) {
		return 'user';
	}
	const role = resolveUserTypeString(userType);
	return role || null;
};

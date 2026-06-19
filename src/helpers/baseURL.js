import Cookies from 'js-cookie';

const isDev = () => !import.meta.env.MODE || import.meta.env.MODE === 'development';

const stripQuotes = (value) => value?.replace(/^['"]|['"]$/g, '').trim();

export const getDevTenantOverride = () =>
	isDev() ? stripQuotes(import.meta.env.VITE_DEV_TENANT) || '' : '';

export const getCurrentTenantId = () => {
	const devTenant = getDevTenantOverride();
	if (devTenant) return devTenant;

	const rootDomain = getRootDomain();
	const { hostname } = window.location;
	if (hostname !== rootDomain && hostname.endsWith(`.${rootDomain}`)) {
		return hostname.replace(`.${rootDomain}`, '');
	}

	const cookieTenant = Cookies.get('tenant');
	return cookieTenant ? String(cookieTenant).trim() : '';
};

export const getTenantRequestHeaders = () => {
	const tenantId = getCurrentTenantId();
	return tenantId ? { 'X-Tenant-ID': tenantId } : {};
};

export const getRootDomain = () => {
	const fromEnv = stripQuotes(import.meta.env.VITE_API_ROOT_DOMAIN);
	if (fromEnv) return fromEnv;

	const { hostname } = window.location;
	const parts = hostname.split('.');
	if (parts.length >= 2) {
		return parts.slice(-2).join('.');
	}
	return hostname;
};

const getOriginWithoutDevPort = () => window.location.origin.split(':3000')[0];

export const isOnTenantSubdomain = () => {
	if (getDevTenantOverride()) return true;

	const rootDomain = getRootDomain();
	const { hostname } = window.location;
	return hostname !== rootDomain && hostname.endsWith(`.${rootDomain}`);
};

export const getDefaultAuthPath = () => (isOnTenantSubdomain() ? '/login' : '/signup');

const isOnApiHost = () => {
	const rootDomain = getRootDomain();
	const { hostname } = window.location;
	return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
};

export const getSuperAdminBaseURL = () => {
	const rootDomain = getRootDomain();
	const protocol = window.location.protocol || 'http:';

	if (isDev()) {
		const host = stripQuotes(import.meta.env.VITE_API_BACKEND_HOST);
		if (host) return host.replace(/\/$/, '');
	}

	return `${protocol}//${rootDomain}`;
};

export const getTenantApiBaseURL = (tenantSlug) => {
	if (isDev() && getDevTenantOverride()) {
		return getSuperAdminBaseURL();
	}

	if (!tenantSlug) return getSuperAdminBaseURL();

	const normalizedSlug = String(tenantSlug).trim();
	if (!normalizedSlug) return getSuperAdminBaseURL();

	const rootDomain = getRootDomain();
	const protocol = window.location.protocol || 'http:';
	const tenantHostname = `${normalizedSlug}.${rootDomain}`;

	// Option A: frontend served on tenant subdomain — API shares the same origin
	if (window.location.hostname === tenantHostname) {
		return getOriginWithoutDevPort();
	}

	return `${protocol}//${tenantHostname}`;
};

const baseURLFunc = () => {
	const originWithoutDevPort = getOriginWithoutDevPort();

	// Option A: use page origin when app is served from root or tenant subdomain
	if (isOnApiHost() && (!isDev() || (isOnTenantSubdomain() || window.location.hostname === getRootDomain()))) {
		return originWithoutDevPort;
	}

	if (isDev()) {
		const host = stripQuotes(import.meta.env.VITE_API_BACKEND_HOST);
		return host?.replace(/\/$/, '') || originWithoutDevPort;
	}

	return originWithoutDevPort;
};

export const baseURL = baseURLFunc();

const baseURLCreator = () => {
	const url = getOriginWithoutDevPort();
	if (isDev()) {
		return `${url}:3000`;
	}
	return url;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	const url = getOriginWithoutDevPort();
	if (isDev()) {
		return import.meta.env.VITE_API_BACKEND_HOST_FOR_SOCKET_IO;
	}
	return url;
};

export const wsUrl = baseURLForSocketIO();

import axios from 'axios';
import { baseURL, getTenantApiBaseURL, getTenantRequestHeaders } from './helpers/baseURL';
import { AxiosTimeout } from './helpers/constants';
import Cookies from 'js-cookie';

const TENANT_HEADER_EXCLUDED_PATHS = ['/users/admin/login','/partners/login','/customers/registrations','/customers/clients','/customers/timezones','/customers/licenses/','/partners/','/signup-verify-email/'];
 
const shouldSkipTenantHeader = (config) => {
    const requestUrl = `${config?.baseURL || ''}${config?.url || ''}`;
    return TENANT_HEADER_EXCLUDED_PATHS.some((path) => requestUrl.includes(path));
};
 
const attachTenantHeader = (instance) => {
    instance.interceptors.request.use((config) => {
        if (shouldSkipTenantHeader(config)) {
            return config;
        }
 
        Object.assign(config.headers, getTenantRequestHeaders());
        return config;
    });
};

export const publicAxios = axios.create({
	baseURL,
	timeout:AxiosTimeout,
	headers: { 'content-type': 'application/json', accept: 'application/json' },
	// withCredentials: true,
});

export const publicAxiosFileUpload = axios.create({
	baseURL,
	timeout:AxiosTimeout,
	headers: {
		'content-type': 'multipart/form-data',
		accept: 'application/json',
	},
	// withCredentials: true,
});

const authAxios = axios.create({
	baseURL,
	timeout:AxiosTimeout,
	headers: {
		'content-type': 'application/json',
		 accept: 'application/json',
	},
	// withCredentials: true,
});


const authAxiosForCSV = axios.create({
	baseURL,
	timeout:AxiosTimeout,
	responseType: 'blob',
	// headers: {
	// 	'content-type': 'application/json',
	// 	accept: 'application/json',
	// },
	withCredentials: true,
});



const authAxiosFileUpload = axios.create({
	baseURL,
	headers: {
		'content-type': 'multipart/form-data',
		accept: 'application/json',
	},
	withCredentials: true,
});

attachTenantHeader(publicAxios);
attachTenantHeader(publicAxiosFileUpload);
attachTenantHeader(authAxios);
attachTenantHeader(authAxiosForCSV);
attachTenantHeader(authAxiosFileUpload);

const getTenantName = (tenantValue) => {
	if (!tenantValue) return '';
	if (typeof tenantValue === 'string') {
		const normalizedTenant = tenantValue.trim();
		if (!normalizedTenant || normalizedTenant === '[object Object]') return '';
		return normalizedTenant;
	}
	if (typeof tenantValue === 'object') {
		return (
			tenantValue.schema_name ||
			tenantValue.tenant_name ||
			tenantValue.domain ||
			tenantValue.name ||
			tenantValue.slug ||
			''
		);
	}
	return '';
};

const getTenantScopedBaseURL = (tenantValue) => {
	const cookieTenant = Cookies.get('tenant');
	const tenantName = getTenantName(tenantValue) || getTenantName(cookieTenant);
	return getTenantApiBaseURL(tenantName);
};

export const updateToken = (newToken, tenant) => {
	// token = newToken;
	// tenant = newTenant;
	authAxios.defaults.headers.Authorization = `Bearer ${newToken}`;
	authAxiosFileUpload.defaults.headers.Authorization = `Bearer ${newToken}`;
	authAxiosForCSV.defaults.headers.Authorization = `Bearer ${newToken}`;
	const tenantScopedBaseURL = getTenantScopedBaseURL(tenant);
	authAxios.defaults.baseURL = tenantScopedBaseURL;
	authAxiosFileUpload.defaults.baseURL = tenantScopedBaseURL;
	authAxiosForCSV.defaults.baseURL = tenantScopedBaseURL;
	
};

export const setInitialToken = () => {
	const token=Cookies.get('token')
	const tenantScopedBaseURL = getTenantScopedBaseURL();
	authAxios.defaults.headers.Authorization = `Bearer ${token}`;
	authAxiosFileUpload.defaults.headers.Authorization = `Bearer ${token}`;
	authAxiosForCSV.defaults.headers.Authorization = `Bearer ${token}`;
	authAxios.defaults.baseURL = tenantScopedBaseURL;
	authAxiosFileUpload.defaults.baseURL = tenantScopedBaseURL;
	authAxiosForCSV.defaults.baseURL = tenantScopedBaseURL;
};

setInitialToken();

export { authAxios, authAxiosFileUpload,authAxiosForCSV };

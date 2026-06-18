import fileDownload from 'js-file-download';
import Cookies from 'js-cookie';
import { getTenantApiBaseURL } from './baseURL';
import { authAxios } from '../axiosInstance';
import showNotification from '../components/extras/showNotification';

const fileDownloader = (value, type) => {
	// console.log(value);
	const tenant = Cookies.get('tenant');
	const fileName = type ? value.split(`${type}/`)[1] : value.uploaded_file_name;
	const apiBase = getTenantApiBaseURL(tenant).replace(/\/$/, '');
	const prefixURL = `${apiBase}/media/`;
	const url = type
		? `${prefixURL}${tenant}/${type}/${fileName}`
		: `${prefixURL}${value.media_url}`;
	authAxios({
		url,
		method: 'GET',
		responseType: 'blob',
	})
		.then((response) => {
			fileDownload(response.data, fileName);
		})
		.catch(() => {
			showNotification('Error', 'Error downloading the file !', 'danger');
		});
};
export default fileDownloader;

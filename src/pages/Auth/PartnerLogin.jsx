import Login from './Login';

const PartnerLogin = () => (
	<Login
		loginApiUrl='api/users/partners/login/'
		heading='PARTNER LOGIN'
		pageTitle='Partner Login'
		showSignup={false}
	/>
);

export default PartnerLogin;

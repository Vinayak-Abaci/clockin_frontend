/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { Col, Container, Row, Spinner } from 'reactstrap';
import classNames from 'classnames';
import { useFormik } from 'formik';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios, updateToken } from '../../axiosInstance';
import LogoForLogin from '../../assets/LogoForLogin.png';
import ClockInLogoDark from '../../assets/ClockInLogoDark.png';
import loginBackground from '../../assets/Home.jpg';
import { setLogOut } from '../../store/auth';
import validateEmail from '../../helpers/emailValidator';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import { getHomePathForUser } from '../../helpers/roleToggleUtils';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Error from '../../helpers/Error';

const Login = ({
	loginApiUrl = 'api/users/login/',
	heading = 'USER LOGIN',
	pageTitle = 'Login',
	showSignup = true,
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { userData, setUser, setUserData } = useContext(AuthContext);
	const { darkModeStatus } = useDarkMode();
	const [signInPassword] = useState(false);
	const [waitingForAxios, setWaitingForAxios] = useState(false);

	useEffect(() => {
		if (userData != null && Object.keys(userData).length > 0) {
			navigate(getHomePathForUser(userData));
		}
	}, [userData, navigate]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors = {};
			const emailError = validateEmail(values.loginUsername);
			if (!values.loginUsername) {
				errors.loginUsername = 'Required';
			}

			if (!values.loginPassword) {
				errors.loginPassword = 'Required';
			}
			if (emailError) {
				errors.loginUsername = emailError;
			}
			return errors;
		},
		onSubmit: (values) => {
			handleSignin(values);
		},
	});

	const handleSignin = (values) => {
		setWaitingForAxios(true);

		const url = loginApiUrl;
		const dataToBeSend = {
			password: values.loginPassword,
			email: values.loginUsername,
		};
		publicAxios
			.post(url, dataToBeSend)
			.then((response) => {
				const responseData = response?.data || {};
				const userPayload = responseData?.user ?? responseData;
				const enrichedUser = {
					...userPayload,
					is_platform_admin:
						responseData?.is_platform_admin ?? userPayload?.is_platform_admin ?? false,
					is_platform_partner: responseData?.is_platform_partner ?? userPayload?.is_platform_partner ?? false,
				};
				const isPlatformAdminUser = enrichedUser.is_platform_admin === true;
				const isPlatformPartnerUser = enrichedUser.is_platform_partner === true;

				const tenant = responseData?.tenant ?? responseData?.tenants?.[0];
				const tenantName =
					(typeof tenant === 'object' && (tenant?.schema_name || tenant?.tenant_name || tenant?.domain)) ||
					tenant;

				if (isPlatformAdminUser || isPlatformPartnerUser) {
					Cookies.remove('tenant');
				} else if (tenantName !== undefined && tenantName !== null) {
					Cookies.set('tenant', String(tenantName));
				}

				const token = responseData?.access ?? responseData?.token ?? Cookies.get('token');
				if (token) {
					Cookies.set('token', token);
					updateToken(token, isPlatformAdminUser || isPlatformPartnerUser ? null : tenantName);
				}

				setUser(enrichedUser?.email ?? values.loginUsername);
				setUserData({ ...enrichedUser });
				setWaitingForAxios(false);
				navigate(getHomePathForUser(enrichedUser));
			})
			.catch((error) => {
				setWaitingForAxios(false);
				dispatch(setLogOut());
				let errorMessage = null;
				if (error.response?.status === 403) {
					errorMessage = error?.response?.data?.detail;
				}else if (error.response?.status === 400) {
					errorMessage = Error(error, () => {});
				}
				else {
					errorMessage = 'Error occured, please check your connection and try again!';
				}
				formik.setFieldError('loginPassword', errorMessage);
				formik.setFieldError('loginUsername', ' ');
			});
	};

	if (userData == null) {
		return <AbaciLoader />;
	}
	return (
		<PageWrapper
			isProtected={false}
			title={pageTitle}
			className={classNames('p-0', {
				'bg-white': !darkModeStatus,
				'bg-dark': darkModeStatus,
			})}>
			<Page className='p-0' container={false}>
				<div style={{ width: '100%', height: '100vh' }}>
					<Container fluid className='p-0'>
						<Row className='g-0'>
							<Col lg={8}>
								<div
									className='authentication-bg'
									style={{ backgroundImage: `url(${loginBackground})` }}>
									<div className='bg-overlay' />
								</div>
							</Col>
							<Col lg={4}>
								<div
									className='authentication-page-content p-4 d-flex justify-content-center align-items-center min-vh-100'
									style={{ overflowY: 'auto' }}>
									<div style={{ width: '80%' }}>
										<div className='py-5'>
											<div className='text-center mb-4'>
												<img
													src={darkModeStatus ? ClockInLogoDark : LogoForLogin}
													alt='Logo'
													height='70'
												/>
											</div>

											<div className='text-center h2 mb-4'>{heading}</div>

											<form
												className='row g-4'
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														formik.handleSubmit();
													}
												}}>
												<div className='col-12'>
													<FormGroup
														id='loginUsername'
														isFloating
														label='Username'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.loginUsername}
															isTouched={formik.touched.loginUsername}
															invalidFeedback={formik.errors.loginUsername}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
													<br />
													<FormGroup id='loginPassword' isFloating label='Password'>
														<Input
															type='password'
															autoComplete='current-password'
															value={formik.values.loginPassword}
															isTouched={formik.touched.loginPassword}
															invalidFeedback={formik.errors.loginPassword}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
														/>
													</FormGroup>
												</div>
												<div className='d-flex justify-content-end'>
													<p
														className='cursor-pointer user-select-none mb-0'
														onClick={() => navigate('/forgotpassword')}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																navigate('/forgotpassword');
															}
														}}
														role='button'
														tabIndex={0}>
														Forgot password ?
													</p>
												</div>

												<div className='col-12 mt-3 text-center'>
													<Button
														color='warning'
														icon='Login'
														className='py-2'
														style={{ width: '150px' }}
														isDisable={waitingForAxios}
														onClick={formik.handleSubmit}>
														{waitingForAxios ? <Spinner size='sm' /> : 'Login'}
													</Button>
												</div>
											</form>

											{showSignup && (
												<div className='text-center mt-4'>
													<p className='mb-0'>
														Don&apos;t have an account?{' '}
														<button
															type='button'
															className='btn btn-link p-0 align-baseline'
															onClick={() => navigate('/signup')}>
															Sign up
														</button>
													</p>
												</div>
											)}
										</div>
									</div>
								</div>
							</Col>
						</Row>
					</Container>
				</div>
			</Page>
		</PageWrapper>
	);
};

Login.propTypes = {
	loginApiUrl: PropTypes.string,
	heading: PropTypes.string,
	pageTitle: PropTypes.string,
	showSignup: PropTypes.bool,
};

export default Login;

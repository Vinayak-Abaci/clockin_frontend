import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import classNames from 'classnames';
import { Col, Container, Row, Spinner } from 'reactstrap';
import { useFormik } from 'formik';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios } from '../../axiosInstance';
import LogoForLogin from '../../assets/LogoForLogin.png';
import ClockInLogoDark from '../../assets/ClockInLogoDark.png';
import loginBackground from '../../assets/Home.jpg';
import showNotification from '../../components/extras/showNotification';
import Error from '../../helpers/Error';
import { parseSetPasswordParams } from '../../helpers/setPasswordUtils';

const PASSWORD_PATTERN = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;

const SetPassword = () => {
	const { setLogOut } = useContext(AuthContext);
	const { darkModeStatus } = useDarkMode();
	const navigate = useNavigate();
	const [waitingForAxios, setWaitingForAxios] = useState(false);

	const { token, tenant } = useMemo(() => parseSetPasswordParams(), []);
	const hasToken = Boolean(token);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			password: '',
			confirmPassword: '',
		},
		validate: (values) => {
			const errors = {};

			if (!values.password) {
				errors.password = 'Required';
			} else if (!PASSWORD_PATTERN.test(values.password)) {
				errors.password =
					'The password should contain minimum 8 and maximum 15 characters with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = 'Required';
			} else if (values.confirmPassword !== values.password) {
				errors.confirmPassword = 'Passwords do not match';
			}

			return errors;
		},
		onSubmit: (values) => {
			if (!hasToken) return;

			setWaitingForAxios(true);
			if (tenant) {
				Cookies.set('tenant', tenant);
			}

			publicAxios
				.post('api/users/password-reset/confirm/', {
					token,
					password: values.password,
				})
				.then((response) => {
					setWaitingForAxios(false);
					const message =
						response?.data?.message ||
						response?.data?.detail ||
						'Password set successfully. Please sign in.';
					showNotification('Success', message, 'success');
					navigate('/login');
				})
				.catch((error) => {
					setWaitingForAxios(false);
					const errorMsg = Error(error, setLogOut);
					showNotification('Error', errorMsg, 'danger');
				});
		},
	});

	return (
		<PageWrapper
			isProtected={false}
			title='Set Password'
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
								<div className='authentication-page-content p-4 d-flex justify-content-center align-items-center min-vh-100'>
									<div style={{ width: '80%' }}>
										<div className='p-5'>
											<div className='text-center'>
												<img
													src={darkModeStatus ? ClockInLogoDark : LogoForLogin}
													alt=''
													height='70'
												/>
											</div>
											<div
												className={classNames('rounded-3', {
													'bg-l10-dark': !darkModeStatus,
													'bg-dark': darkModeStatus,
												})}
											/>
											<div className='text-center h2 mt-4 mb-2'>SET PASSWORD</div>
											<div className='text-center text-muted mb-4'>
												Create a password to activate your account
											</div>

											{!hasToken ? (
												<div className='alert alert-danger text-center mb-0'>
													Invalid or missing reset link. Please use the link from your
													email or contact your administrator.
												</div>
											) : (
												<form
													className='row g-4'
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															formik.handleSubmit();
														}
													}}
													onSubmit={formik.handleSubmit}>
													<div className='col-12'>
														<FormGroup id='password' isFloating label='Password'>
															<Input
																type='password'
																autoComplete='new-password'
																value={formik.values.password}
																isTouched={formik.touched.password}
																invalidFeedback={formik.errors.password}
																isValid={formik.isValid}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</FormGroup>
														<br />
														<FormGroup
															id='confirmPassword'
															isFloating
															label='Confirm Password'>
															<Input
																type='password'
																autoComplete='new-password'
																value={formik.values.confirmPassword}
																isTouched={formik.touched.confirmPassword}
																invalidFeedback={formik.errors.confirmPassword}
																isValid={formik.isValid}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</FormGroup>
													</div>

													<div className='col-12 mt-3 text-center'>
														<Button
															color='warning'
															icon='Lock'
															className='py-2'
															style={{ width: '180px' }}
															isDisable={waitingForAxios}
															onClick={formik.handleSubmit}>
															{waitingForAxios ? (
																<Spinner size='sm' />
															) : (
																'Set Password'
															)}
														</Button>
													</div>
												</form>
											)}

											<div className='text-center mt-4'>
												<button
													type='button'
													className='btn btn-link p-0'
													onClick={() => navigate('/login')}>
													Back to login
												</button>
											</div>
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

export default SetPassword;

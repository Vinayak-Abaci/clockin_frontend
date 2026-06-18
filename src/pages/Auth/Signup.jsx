import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Container, Row, Spinner } from 'reactstrap';
import classNames from 'classnames';
import { useFormik } from 'formik';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios } from '../../axiosInstance';
import LogoForLogin from '../../assets/LogoForLogin.png';
import loginBackground from '../../assets/Home.jpg';
import validateEmail from '../../helpers/emailValidator';
import { GenderOptions } from '../../helpers/constants';
import showNotification from '../../components/extras/showNotification';
import Error from '../../helpers/Error';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';

const mapTimezoneOptions = (raw) => {
	const list = Array.isArray(raw) ? raw : raw?.results || [];
	return list
		.map((item) => {
			const value =
				item?.timezone ??
				item?.tz ??
				item?.name ??
				item?.value ??
				(typeof item === 'string' ? item : '');
			if (!value) return null;
			const label = item?.label ?? item?.display_name ?? String(value);
			return { label: String(label), value: String(value) };
		})
		.filter(Boolean);
};

const Signup = () => {
	const navigate = useNavigate();
	const { userData } = useContext(AuthContext);
	const { darkModeStatus } = useDarkMode();
	const [emailVerified, setEmailVerified] = useState(false);
	const [verifiedEmail, setVerifiedEmail] = useState('');
	const [verifyingEmail, setVerifyingEmail] = useState(false);
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [timezoneOptions, setTimezoneOptions] = useState([]);
	const [timezonesLoading, setTimezonesLoading] = useState(false);

	const emailFormik = useFormik({
		enableReinitialize: true,
		initialValues: { email: '' },
		validate: (values) => {
			const errors = {};
			if (!String(values.email || '').trim()) {
				errors.email = 'Required';
			} else {
				const emailError = validateEmail(values.email);
				if (emailError) errors.email = emailError;
			}
			return errors;
		},
		onSubmit: (values) => {
			handleVerifyEmail(values.email.trim());
		},
	});

	const signupFormik = useFormik({
		enableReinitialize: true,
		initialValues: {
			name: '',
			email: verifiedEmail,
			first_name: '',
			last_name: '',
			gender: 'Other',
			country: '',
			timezone: '',
		},
		validate: (values) => {
			const errors = {};
			const requiredFields = [
				'name',
				'email',
				'first_name',
				'last_name',
				'gender',
				'country',
				'timezone',
			];

			requiredFields.forEach((field) => {
				if (!String(values[field] || '').trim()) {
					errors[field] = 'Required';
				}
			});

			const emailError = validateEmail(values.email);
			if (emailError) {
				errors.email = emailError;
			}

			return errors;
		},
		onSubmit: (values) => {
			handleSignup(values);
		},
	});

	useEffect(() => {
		if (userData !== null && Object.keys(userData).length > 0) {
			navigate('/');
		}
	}, [userData, navigate]);

	useEffect(() => {
		if (!emailVerified) return;

		setTimezonesLoading(true);
		publicAxios
			.get('api/customers/timezones/')
			.then((res) => {
				const options = mapTimezoneOptions(res?.data);
				setTimezoneOptions(options);
				if (options.length > 0) {
					signupFormik.setFieldValue('timezone', options[0].value);
				}
			})
			.catch((error) => {
				const errorMsg = Error(error, () => {});
				showNotification('Error', errorMsg, 'danger');
				setTimezoneOptions([]);
			})
			.finally(() => {
				setTimezonesLoading(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [emailVerified]);

	const handleVerifyEmail = (email) => {
		setVerifyingEmail(true);
		emailFormik.setFieldError('email', undefined);

		publicAxios
			.post('api/customers/signup-verify-email/', { email })
			.then(() => {
				setVerifiedEmail(email);
				setEmailVerified(true);
				signupFormik.setFieldValue('email', email);
				showNotification('Success', 'Email verified. Please complete your registration.', 'success');
			})
			.catch((error) => {
				const errorMsg = Error(error, () => {});
				showNotification('Error', errorMsg, 'danger');

				if (error?.response?.data?.email) {
					const fieldError = Array.isArray(error.response.data.email)
						? error.response.data.email.join(', ')
						: String(error.response.data.email);
					emailFormik.setFieldError('email', fieldError);
				} else {
					emailFormik.setFieldError('email', errorMsg);
				}
			})
			.finally(() => {
				setVerifyingEmail(false);
			});
	};

	const handleSignup = (values) => {
		setWaitingForAxios(true);

		const payload = {
			name: values.name.trim(),
			email: values.email.trim(),
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			gender: values.gender,
			country: values.country.trim(),
			timezone: values.timezone,
		};

		publicAxios
			.post('api/customers/signup/', payload)
			.then((response) => {
				setWaitingForAxios(false);
				const message =
					response?.data?.message ||
					response?.data?.detail ||
					'Account created successfully. Please sign in.';
				showNotification('Success', message, 'success');
				navigate('/login');
			})
			.catch((error) => {
				setWaitingForAxios(false);
				const errorMsg = Error(error, () => {});
				showNotification('Error', errorMsg, 'danger');

				if (error?.response?.status === 400 && error?.response?.data) {
					const data = error.response.data;
					Object.keys(data).forEach((key) => {
						if (Object.prototype.hasOwnProperty.call(signupFormik.values, key)) {
							const fieldError = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]);
							signupFormik.setFieldError(key, fieldError);
						}
					});
				}
			});
	};

	const selectClassName = classNames('form-select', {
		'bg-l10-dark': !darkModeStatus,
		'bg-dark text-light': darkModeStatus,
	});

	if (userData === null) {
		return <AbaciLoader />;
	}

	return (
		<PageWrapper isProtected={false} title='Sign Up' className='p-0 bg-white'>
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
												<img src={LogoForLogin} alt='Logo' height='70' />
											</div>

											<div className='text-center h2 mb-4'>SIGN UP</div>

											{!emailVerified ? (
												<>
													<form
														className='row g-3'
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																e.preventDefault();
																emailFormik.handleSubmit();
															}
														}}>
														<div className='col-12 mb-4'>
															<FormGroup id='email' isFloating label='Email'>
																<Input
																	type='email'
																	autoComplete='email'
																	value={emailFormik.values.email}
																	isTouched={emailFormik.touched.email}
																	invalidFeedback={emailFormik.errors.email}
																	isValid={emailFormik.isValid}
																	onChange={emailFormik.handleChange}
																	onBlur={emailFormik.handleBlur}
																/>
															</FormGroup>
														</div>

														<div className='col-12 mt-2 text-center'>
															<Button
																color='warning'
																icon='Email'
																className='py-2'
																style={{ width: '150px' }}
																isDisable={verifyingEmail}
																onClick={emailFormik.handleSubmit}>
																{verifyingEmail ? <Spinner size='sm' /> : 'Continue'}
															</Button>
														</div>
													</form>
												</>
											) : (
												<form
													className='row g-3'
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															signupFormik.handleSubmit();
														}
													}}>
													<div className='col-12'>
														<FormGroup id='name' isFloating label='Company Name'>
															<Input
																autoComplete='organization'
																value={signupFormik.values.name}
																isTouched={signupFormik.touched.name}
																invalidFeedback={signupFormik.errors.name}
																isValid={signupFormik.isValid}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
															/>
														</FormGroup>
													</div>
													<div className='col-12'>
														<FormGroup id='email' isFloating label='Email'>
															<Input
																type='email'
																autoComplete='email'
																readOnly
																value={signupFormik.values.email}
																isTouched={signupFormik.touched.email}
																invalidFeedback={signupFormik.errors.email}
																isValid={signupFormik.isValid}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
															/>
														</FormGroup>
													</div>
													<div className='col-12'>
														<FormGroup id='first_name' isFloating label='First Name'>
															<Input
																autoComplete='given-name'
																value={signupFormik.values.first_name}
																isTouched={signupFormik.touched.first_name}
																invalidFeedback={signupFormik.errors.first_name}
																isValid={signupFormik.isValid}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
															/>
														</FormGroup>
													</div>
													<div className='col-12'>
														<FormGroup id='last_name' isFloating label='Last Name'>
															<Input
																autoComplete='family-name'
																value={signupFormik.values.last_name}
																isTouched={signupFormik.touched.last_name}
																invalidFeedback={signupFormik.errors.last_name}
																isValid={signupFormik.isValid}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
															/>
														</FormGroup>
													</div>
													<div className='col-12'>
														<FormGroup id='gender' label='Gender'>
															<select
																id='gender'
																name='gender'
																className={selectClassName}
																value={signupFormik.values.gender}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}>
																{GenderOptions.map((option) => (
																	<option key={option.value} value={option.value}>
																		{option.label}
																	</option>
																))}
															</select>
															{signupFormik.touched.gender && signupFormik.errors.gender && (
																<div className='invalid-feedback d-block'>{signupFormik.errors.gender}</div>
															)}
														</FormGroup>
													</div>
													<div className='col-12'>
														<FormGroup id='country' isFloating label='Country'>
															<Input
																autoComplete='country-name'
																value={signupFormik.values.country}
																isTouched={signupFormik.touched.country}
																invalidFeedback={signupFormik.errors.country}
																isValid={signupFormik.isValid}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
															/>
														</FormGroup>
													</div>
													<div className='col-12 mb-4'>
														<FormGroup id='timezone' label='Timezone'>
															<select
																id='timezone'
																name='timezone'
																className={selectClassName}
																value={signupFormik.values.timezone}
																onChange={signupFormik.handleChange}
																onBlur={signupFormik.handleBlur}
																disabled={timezonesLoading || timezoneOptions.length === 0}>
																{timezonesLoading ? (
																	<option value=''>Loading timezones...</option>
																) : timezoneOptions.length === 0 ? (
																	<option value=''>No timezones available</option>
																) : (
																	timezoneOptions.map((option) => (
																		<option key={option.value} value={option.value}>
																			{option.label}
																		</option>
																	))
																)}
															</select>
															{signupFormik.touched.timezone && signupFormik.errors.timezone && (
																<div className='invalid-feedback d-block'>{signupFormik.errors.timezone}</div>
															)}
														</FormGroup>
													</div>

													<div className='col-12 mt-2 text-center'>
														<Button
															color='warning'
															icon='PersonAdd'
															className='py-2'
															style={{ width: '150px' }}
															isDisable={waitingForAxios || timezonesLoading || timezoneOptions.length === 0}
															onClick={signupFormik.handleSubmit}>
															{waitingForAxios ? <Spinner size='sm' /> : 'Sign Up'}
														</Button>
													</div>
												</form>
											)}

											<div className='text-center mt-4'>
												<p className='mb-0'>
													Already have an account?{' '}
													<button
														type='button'
														className='btn btn-link p-0 align-baseline'
														onClick={() => navigate('/login')}>
														Login
													</button>
												</p>
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

export default Signup;

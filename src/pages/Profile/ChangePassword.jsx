/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { Spinner } from 'reactstrap';

import Card, {
	CardBody,
	CardFooter,
	CardFooterRight,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Button from '../../components/bootstrap/Button';
import Input from '../../components/bootstrap/forms/Input';
import { authAxios } from '../../axiosInstance';
import showNotification from '../../components/extras/showNotification';
import useToasterNotification from '../../hooks/useToasterNotification';

const ChangePassword = () => {
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const { showErrorNotification } = useToasterNotification();

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
		validate: (values) => {
			const errors = {};
			if (!values.currentPassword) {
				errors.currentPassword = '*Current Password is required';
			}

			if (!values.newPassword) {
				errors.newPassword = '*Password is required';
			} else {
				const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
				const isOk = re.test(values.newPassword);
				if (!isOk) {
					errors.newPassword =
						'*The password should contain minimum 8 and maximum 15 characters with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
				}
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = '*Confirm password is required';
			} else if (values.confirmPassword !== values.newPassword) {
				errors.confirmPassword = '*Passwords do not match';
			}

			return errors;
		},
		onSubmit: (values) => {
			changePasswordHandler(values);
		},
	});
	const changePasswordHandler = (data) => {
		setWaitingForAxios(true);
		const url = '/api/users/profile/';
		const payload = {
			current_password: data.currentPassword,
			password: data.newPassword,
		};
		authAxios
			.patch(url, payload)
			.then(() => {
				setWaitingForAxios(false);
				showNotification('Success', 'Your password has been updated !!', 'success');
				formik.resetForm();
			})
			.catch((error) => {
				setWaitingForAxios(false);
				showErrorNotification(error);
			});
	};

	return (
		<Card className='prevent-userselect shadow-3d-info'>
			<CardHeader>
				<CardLabel icon='Lock' iconColor='warning'>
					<CardTitle tag='div' className='h3'>
						Change Password
					</CardTitle>
				</CardLabel>
			</CardHeader>
			<CardBody>
				<form className='row g-4'>
					<div className='row'>
						<div className='col-6'>
							<FormGroup id='currentPassword' label='Current password *'>
								<Input
									type='password'
									className='form-control'
									style={{ height: '40px' }}
									value={formik.values.currentPassword}
									isTouched={formik.touched.currentPassword}
									invalidFeedback={formik.errors.currentPassword}
									isValid={formik.isValid}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</FormGroup>
						</div>
					</div>
					<div className='row'>
						<div className='col-6'>
							<FormGroup id='newPassword' label='New password *' className='mt-4'>
								<Input
									type='password'
									className='form-control'
									style={{ height: '40px' }}
									value={formik.values.newPassword}
									isTouched={formik.touched.newPassword}
									invalidFeedback={formik.errors.newPassword}
									isValid={formik.isValid}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup
								id='confirmPassword'
								label='Confirm password *'
								className='mt-4'>
								<Input
									type='password'
									className='form-control'
									style={{ height: '40px' }}
									value={formik.values.confirmPassword}
									isTouched={formik.touched.confirmPassword}
									invalidFeedback={formik.errors.confirmPassword}
									isValid={formik.isValid}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</FormGroup>
						</div>
					</div>
				</form>
			</CardBody>
			<CardFooter>
				<CardFooterRight>
					<Button
						color='secondary'
						icon={waitingForAxios ? '' : 'Save'}
						isDisable={waitingForAxios}
						className='mt-2'
						type='submit'
						isLight
						onClick={formik.handleSubmit}>
						{waitingForAxios ? <Spinner size='sm' /> : 'Save'}
					</Button>
				</CardFooterRight>
			</CardFooter>
		</Card>
	);
};

export default ChangePassword;
/* eslint-enable @typescript-eslint/no-use-before-define */

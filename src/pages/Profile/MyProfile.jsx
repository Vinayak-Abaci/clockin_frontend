import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Spinner } from 'reactstrap';
import Card, {
	CardBody,
	CardFooter,
	CardFooterRight,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import AuthContext from '../../contexts/authContext';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Button from '../../components/bootstrap/Button';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import ReactSelectComponent from '../../components/CustomComponent/Select/ReactSelectComponent';
import { GenderOptions } from '../../helpers/constants';
import ContactNumberField from '../../components/CustomComponent/Fields/ContactNumberField';

const MyProfile = () => {
	const { userData, setUserData } = useContext(AuthContext);
	console.log(userData);
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		control,
		getValues,
		formState: { errors },
	} = useForm();
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		if (userData !== null) {
			reset({
				first_name: userData?.first_name || '',
				last_name: userData?.last_name || '',
				user_contact_phone: userData?.office_contact_number || '',
				gender: userData?.gender ? { label: userData.gender, value: userData?.gender } : '',

			})

		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData]);

	const saveHandler = (data) => {
		const payload = {

			
				first_name: data.first_name,
				last_name: data.last_name,
				office_contact_number: data.user_contact_phone,
			
			gender: data.gender.value

		};
		setWaitingForAxios(true);
		const url = `api/users/profile/`;
		authAxios
			.patch(url, payload)
			.then((res) => {
				setWaitingForAxios(false);
				const profileUser = res.data?.user ?? res.data;
				setUserData((prev) => ({
					...prev,
					...(profileUser && typeof profileUser === 'object' ? profileUser : {}),
				}));
			})
			.catch((error) => {
				setWaitingForAxios(false);
				showErrorNotification(error);
			});
	};

	return (
		<Card className='prevent-userselect shadow-3d-info'>
			<CardHeader>
				<CardLabel icon='Description' iconColor='warning'>
					<CardTitle tag='div' className='h3'>
						My Profile
					</CardTitle>
				</CardLabel>
			</CardHeader>
			<CardBody>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr ', gap: '10px' }}>
					<FormGroup label='First name * '>
						<input
							type='text'
							{...register('first_name', {
								required: true,
							})}
							className='form-control'
							style={{ height: '40px' }}
						/>
						{errors.first_name?.type ? (
							<span style={{ color: 'red' }}>*This field is required</span>
						) : (
							<p />
						)}
					</FormGroup>

					<FormGroup label='Last name '>
						<input
							type='text'
							{...register('last_name', {
								required: false,
							})}
							className='form-control'
							style={{ height: '40px' }}
						/>
					</FormGroup>

					{/* <FormGroup label='Mobile number *'>
						<input
							type='number'
							{...register('user_contact_phone', {
								required: true,
							})}
							className='form-control'
							style={{ height: '40px' }}
							onKeyDown={(evt) => {
								const invalidKeys = ['e', 'E', '+', '-', '=', '.'];
								if (invalidKeys.includes(evt.key) || evt.key === 'ArrowDown') {
									evt.preventDefault();
								}
							}}
							//@ts-ignore
							maxLength='15'            
							onInput={(e) => {
								const input = e.target
								//@ts-ignore 
								input.value = input.value.slice(0, 15);
							  }}	
						/>
						{errors.user_contact_phone?.type ? (
							<span style={{ color: 'red' }}>*This field is required</span>
						) : (
							<p />
						)}
					</FormGroup> */}
					<ContactNumberField
						label="Mobile number *"
						field_name="user_contact_phone"
						required
						register={register}
						errors={errors}
					/>

					<ReactSelectComponent
						control={control}
						name='Gender *'
						isMulti={false}
						field_name='gender'
						getValues={getValues}
						errors={errors}
						options={GenderOptions}
						isRequired
					/>
				</div>
			</CardBody>
			<CardFooter>
				<CardFooterRight>
					<Button
						icon={waitingForAxios ? '' : 'Save'}
						color='secondary'
						className='w-100'
						isLight
						onClick={() => handleSubmit(saveHandler)()}>
						{waitingForAxios ? <Spinner size='sm' /> : 'Save'}
					</Button>
				</CardFooterRight>
			</CardFooter>
		</Card>
	);
};

export default MyProfile;

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import SaveButton from '../../../components/CustomComponent/Buttons/SaveButton';
import ReactSelectComponent from '../../../components/CustomComponent/Select/ReactSelectComponent';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import { authAxios, publicAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { GenderOptions } from '../../../helpers/constants';
import validateEmail from '../../../helpers/emailValidator';

type SelectOption = { label: string; value: string };

type AddPartnerForm = {
	name: string;
	email: string;
	first_name: string;
	last_name: string;
	gender: SelectOption | null;
	country: string;
	timezone: SelectOption | null;
};

type AddPartnerModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	tableRef: React.RefObject<{ onQueryChange?: () => void } | null>;
};

const mapTimezoneOptions = (raw: unknown): SelectOption[] => {
	const list = Array.isArray(raw) ? raw : (raw as { results?: unknown[] })?.results || [];
	return list
		.map((item: unknown) => {
			const record = item as Record<string, unknown>;
			const value =
				record?.timezone ??
				record?.tz ??
				record?.name ??
				record?.value ??
				(typeof item === 'string' ? item : '');
			if (!value) return null;
			const label = record?.label ?? record?.display_name ?? String(value);
			return { label: String(label), value: String(value) };
		})
		.filter(Boolean) as SelectOption[];
};

const AddPartnerModal = ({ isOpen, setIsOpen, tableRef }: AddPartnerModalProps) => {
	const {
		register,
		handleSubmit,
		reset,
		control,
		getValues,
		formState: { errors },
	} = useForm<AddPartnerForm>({
		defaultValues: {
			name: '',
			email: '',
			first_name: '',
			last_name: '',
			gender: null,
			country: '',
			timezone: null,
		},
	});

	const [saving, setSaving] = useState(false);
	const [timezonesLoading, setTimezonesLoading] = useState(false);
	const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>([]);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	useEffect(() => {
		if (!isOpen) return;

		reset({
			name: '',
			email: '',
			first_name: '',
			last_name: '',
			gender: null,
			country: '',
			timezone: null,
		});

		let cancelled = false;
		setTimezonesLoading(true);
		publicAxios
			.get('api/customers/timezones/')
			.then((res) => {
				if (!cancelled) setTimezoneOptions(mapTimezoneOptions(res?.data));
			})
			.catch((err) => {
				if (!cancelled) {
					showErrorNotification(err);
					setTimezoneOptions([]);
				}
			})
			.finally(() => {
				if (!cancelled) setTimezonesLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch when modal opens
	}, [isOpen, reset]);

	const onSubmit = (data: AddPartnerForm) => {
		const payload = {
			name: data.name?.trim() || '',
			email: data.email?.trim() || '',
			first_name: data.first_name?.trim() || '',
			last_name: data.last_name?.trim() || '',
			gender: data.gender?.value || '',
			country: data.country?.trim() || '',
			timezone: data.timezone?.value || '',
		};

		setSaving(true);
		authAxios
			.post('api/partners/', payload)
			.then((response) => {
				const message =
					response?.data?.message ||
					response?.data?.detail ||
					'Partner added successfully.';
				showSuccessNotification(message);
				tableRef?.current?.onQueryChange?.();
				setIsOpen(false);
			})
			.catch(showErrorNotification)
			.finally(() => setSaving(false));
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered isScrollable isAnimation={false}>
			<ModalHeader className='p-4' setIsOpen={setIsOpen}>
				<ModalTitle id='add-partner-modal'>Add Partner</ModalTitle>
			</ModalHeader>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<ModalBody className='px-4 pb-2'>
					{timezonesLoading ? (
						<div className='d-flex justify-content-center py-4'>
							<CustomSpinner />
						</div>
					) : (
						<div className='row g-4'>
						<FormGroup label='Partner Name *' className='col-md-6'> 
							<input
								type='text'
								className='form-control'
								style={{ height: '40px' }}
								{...register('name', { required: true })}
							/>
							{errors.name?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
						</FormGroup>
						<FormGroup label='Email *' className='col-md-6'>
							<input
								type='email'
								className='form-control'
								style={{ height: '40px' }}
								{...register('email', {
									required: true,
									validate: (value) => validateEmail(value) ?? true,
								})}
							/>
							{errors.email?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
							{errors.email?.type === 'validate' && (
								<span className='text-danger small'>{errors.email.message}</span>
							)}
						</FormGroup>
						<FormGroup label='First Name *' className='col-md-6'>
							<input
								type='text'
								className='form-control'
								style={{ height: '40px' }}
								{...register('first_name', { required: true })}
							/>
							{errors.first_name?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
						</FormGroup>
						<FormGroup label='Last Name *' className='col-md-6'>
							<input
								type='text'
								className='form-control'
								style={{ height: '40px' }}
								{...register('last_name', { required: true })}
							/>
							{errors.last_name?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
						</FormGroup>
						<div className='col-md-6'>
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
						<FormGroup label='Country *' className='col-md-6'>
							<input
								type='text'
								className='form-control'
								style={{ height: '40px' }}
								{...register('country', { required: true })}
							/>
							{errors.country?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
						</FormGroup>
						<div className='col-md-6'>
							<ReactSelectComponent
								control={control}
								name='Timezone *'
								isMulti={false}
								field_name='timezone'
								getValues={getValues}
								errors={errors}
								options={timezoneOptions}
								isRequired
							/>
						</div>
					</div>
					)}
				</ModalBody>
				<ModalFooter className='px-4 pb-4'>
					<Button color='dark' isLight type='button' onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<div className='flex-grow-1' style={{ maxWidth: '12rem' }}>
						<SaveButton state={saving || timezonesLoading} />
					</div>
				</ModalFooter>
			</Form>
		</Modal>
	);
};

/* eslint-disable react/forbid-prop-types */
AddPartnerModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default AddPartnerModal;

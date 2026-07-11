import React from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../CustomComponent/Select/ReactSelectComponent';
import CheckboxWithLabel from '../../CustomComponent/CheckboxWithLabel';
import { GenderOptions } from '../../../helpers/constants';

const UserFields = ({
	register,
	errors,
	getValues,
	control,
	groupOptions,
	siteOptions,
	reportingManagerOptions = [],
	hrManagerOptions = [],
	scheduleOptions = [],
}: any) => {

	return (
		<div>
			<div className='row'>
			<div className='col-12 mb-2'>
				<FormGroup label='First Name *'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('first_name', { required: true })} />
					{errors.first_name?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='Last Name *'>
					<input
						type='text'
						className='form-control'
						style={{ height: '40px' }}
						{...register('last_name', { required: true })}
					/>
					{errors.last_name?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			</div>


			<div className='row'>
			<div className='col-12 mb-2'>
				<FormGroup label='Email *'>
					<input
						type='email'
						className='form-control'
						style={{ height: '40px' }}
						{...register('email', { required: true })}
					/>
					{errors.email?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			</div>

			<div className='row'>
			<div className='col-12 mb-2'>
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
			<div className='col-12 mb-2'>
				<FormGroup label='DOB *'>
					<input type='date' className='form-control' style={{ height: '40px' }} {...register('dob', { required: true })} />
					{errors.dob?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='Joined Date'>
					<input
						type='date'
						className='form-control'
						style={{ height: '40px' }}
						{...register('joined_date')}
					/>
				</FormGroup>
			</div>
			</div>

			<div className='row'>
			<div className='col-12 mb-2'>
				<FormGroup label='Address'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('address')} />
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='State'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('state')} />
				</FormGroup>
			</div>
			</div>

		<div className='row'>
			<div className='col-12 mb-2'>
				<FormGroup label='City'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('city')} />
				</FormGroup>
	     </div>
			<div className='col-12 mb-2'>
				<FormGroup label='Pincode'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('pincode')} />
				</FormGroup>
			</div>
		</div>

		<div className='row'>
			<div className='col-12 mb-2'>
				<FormGroup label='Country'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('country')} />
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='Personal Contact Number *'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('personal_contact_number', { required: true })} />
					{errors.personal_contact_number?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
		</div>

		<div className='row'>
					<div className='col-12 mb-2'>
				<FormGroup label='Office Contact Number *'>
					<input type='text' className='form-control' style={{ height: '40px' }} {...register('office_contact_number', { required: true })} />
					{errors.office_contact_number?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<CheckboxWithLabel
					control={control}
					name='is_manager'
					label='Manager Role'
					layout='form-field'
				/>
			</div>
			<div className='col-12 mb-2'>
				<CheckboxWithLabel
					control={control}
					name='is_hr'
					label='HR Role'
					layout='form-field'
				/>
			</div>
		</div>

		<div className='row'>
			
			<div className='col-12 mb-2'>
			<ReactSelectComponent
				control={control}
				name='Site '
				isMulti={false}
				field_name='site'
				getValues={getValues}
				errors={errors}
				options={siteOptions}
				isRequired={false}
			/>			
			</div>
			<div className='col-12 mb-2'>
				<ReactSelectComponent
					control={control}
					name='Schedule'
					isMulti={false}
					field_name='schedule'
					getValues={getValues}
					errors={errors}
					options={scheduleOptions}
					isRequired={false}
					isClearable
				/>
			</div>
			<div className='col-12 mb-2'>
				<ReactSelectComponent
					control={control}
					name='Reporting Manager'
					isMulti={false}
					field_name='reporting_manager'
					getValues={getValues}
					errors={errors}
					options={reportingManagerOptions}
					isRequired={false}
					isClearable
				/>
			</div>
			<div className='col-12 mb-2'>
				<ReactSelectComponent
					control={control}
					name='HR Manager'
					isMulti={false}
					field_name='hr_manager'
					getValues={getValues}
					errors={errors}
					options={hrManagerOptions}
					isRequired={false}
					isClearable
				/>
			</div>
			</div>
		</div>
	);
};

export default UserFields;

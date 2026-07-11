import React from 'react';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';

type WfhRequestFieldProps = {
	register: any;
	errors: any;
};

const WfhRequestField = ({ register, errors }: WfhRequestFieldProps) => (
	<div className='row'>
		<div className='col-12 col-md-6 mb-3'>
			<FormGroup label='Start date *'>
				<input
					type='date'
					className='form-control'
					style={{ height: '40px' }}
					{...register('start_date', { required: true })}
				/>
				{errors.start_date?.type && (
					<span className='text-danger small'>*This field is required</span>
				)}
			</FormGroup>
		</div>
		<div className='col-12 col-md-6 mb-3'>
			<FormGroup label='End date *'>
				<input
					type='date'
					className='form-control'
					style={{ height: '40px' }}
					{...register('end_date', { required: true })}
				/>
				{errors.end_date?.type && (
					<span className='text-danger small'>*This field is required</span>
				)}
			</FormGroup>
		</div>
		<div className='col-12 mb-2'>
			<FormGroup label='Reason *'>
				<textarea
					className='form-control'
					rows={4}
					style={{ minHeight: '120px' }}
					{...register('reason', { required: true })}
				/>
				{errors.reason?.type && (
					<span className='text-danger small'>*This field is required</span>
				)}
			</FormGroup>
		</div>
	</div>
);

export default WfhRequestField;

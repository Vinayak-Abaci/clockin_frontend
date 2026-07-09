import React from 'react';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';

type AssetRequestFieldProps = {
	register: any;
	errors: any;
	isEdit?: boolean;
};

const AssetRequestField = ({ register, errors, isEdit = false }: AssetRequestFieldProps) => (
	<div className='row'>
		<div className='col-12 mb-3'>
			<FormGroup label='Description *'>
				<textarea
					className='form-control'
					rows={4}
					style={{ minHeight: '120px' }}
					{...register('description', { required: true })}
				/>
				{errors.description?.type && (
					<span className='text-danger small'>*This field is required</span>
				)}
			</FormGroup>
		</div>
		<div className='col-12 mb-2'>
			<FormGroup label={isEdit ? 'Add documents' : 'Documents'}>
				<input
					type='file'
					className='form-control'
					multiple
					accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx'
					{...register('documents')}
				/>
				<div className='text-muted small mt-1'>
					{isEdit
						? 'Upload additional documents. Existing files remain attached.'
						: 'Optional supporting documents for this request.'}
				</div>
			</FormGroup>
		</div>
	</div>
);

export default AssetRequestField;

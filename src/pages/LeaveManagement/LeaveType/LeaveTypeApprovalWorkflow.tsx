import React from 'react';
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Tooltip } from '@mui/material';
import ReactSelectComponent from '../../../components/CustomComponent/Select/ReactSelectComponent';
import Button from '../../../components/bootstrap/Button';

export const APPROVER_TYPE_OPTIONS = [
	{ label: 'Reporting Manager', value: 'REPORTING_MANAGER' },
	{ label: 'HR', value: 'HR' },
	{ label: 'Group Contact', value: 'GROUP_CONTACT' },
];

type LeaveTypeApprovalWorkflowProps = {
	control: Control<any>;
	register: UseFormRegister<any>;
	errors: FieldErrors<any>;
	getValues: any;
};

const LeaveTypeApprovalWorkflow = ({
	control,
	register,
	errors,
	getValues,
}: LeaveTypeApprovalWorkflowProps) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'approval_workflows',
	});

	return (
		<div className='col-12 mt-3 pt-3 border-top'>
			<h6 className='fw-bold text-warning mb-3'>Leave approval level</h6>

			{fields.length === 0 ? (
				<p className='text-muted small mb-3'>No approval levels configured.</p>
			) : null}

			{fields.map((field, index) => (
					<div
						key={field.id}
						className='rounded-3 border border-secondary border-opacity-25 p-3 mb-3'
						style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='fw-semibold small text-uppercase text-muted'>
								Level {index + 1}
							</span>
							<Tooltip arrow title='Remove level' placement='top'>
								<Button
									type='button'
									color='danger'
									isLight
									size='sm'
									icon='Delete'
									onClick={() => remove(index)}
								/>
							</Tooltip>
						</div>

						<div className='mb-2'>
							<ReactSelectComponent
								control={control}
								name='Approver *'
								isMulti={false}
								field_name={`approval_workflows.${index}.approver_type`}
								getValues={getValues}
								errors={errors}
								options={APPROVER_TYPE_OPTIONS}
								isRequired
							/>
						</div>

						<div className='d-flex align-items-center'>
							<input
								type='checkbox'
								className='me-2'
								id={`approval_mandatory_${index}`}
								{...register(`approval_workflows.${index}.mandatory`)}
							/>
							<label className='mb-0 small' htmlFor={`approval_mandatory_${index}`}>
								Mandatory
							</label>
						</div>
					</div>
			))}

			<Button
				type='button'
				color='warning'
				isOutline
				size='sm'
				onClick={() =>
					append({
						approver_type: null,
						mandatory: true,
					})
				}>
				Add new level
			</Button>
		</div>
	);
};

export default LeaveTypeApprovalWorkflow;

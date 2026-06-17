import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import OffCanvasComponent from '../../components/OffCanvasComponent';
import Card, { CardBody } from '../../components/bootstrap/Card';
import SaveButton from '../../components/CustomComponent/Buttons/SaveButton';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import ShiftFields from './ShiftFields';

const normalizeTime = (value: any) => {
	if (!value || typeof value !== 'string') return '';
	const match = value.match(/^(\d{2}):(\d{2})/);
	return match ? `${match[1]}:${match[2]}` : '';
};

/** Span between start and end (decimal hours string, e.g. "8.00"). Used as default minimum_hours. */
const calculateSpanHours = (start: string, end: string) => {
	if (!start || !end) return '00.00';
	const [startH, startM] = start.split(':').map(Number);
	const [endH, endM] = end.split(':').map(Number);
	if ([startH, startM, endH, endM].some(Number.isNaN)) return '00.00';

	const startMinutes = startH * 60 + startM;
	let endMinutes = endH * 60 + endM;
	if (endMinutes < startMinutes) endMinutes += 24 * 60;

	const totalMinutes = Math.max(0, endMinutes - startMinutes);
	return (totalMinutes / 60).toFixed(2);
};

const ShiftForm = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
	const {
		register,
		handleSubmit,
		reset,
		control,
		getValues,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		defaultValues: {
			name: '',
			start_time: '',
			end_time: '',
			auto_in: false,
			auto_out: false,
			first_in_last_out: false,
			is_ot_shift: false,
			ot_eligible: false,
			ot_hours: '',
			start_grace_period_mins: 0,
			end_grace_period_mins: 0,
			remarks: '',
			minimum_hours: '',
		},
	});

	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { showErrorNotification } = useToasterNotification();
	const isEdit = Boolean(id);
	const startTimeWatch = watch('start_time');
	const endTimeWatch = watch('end_time');

	/** Suggest minimum hours from shift span when creating; do not overwrite on edit load. */
	useEffect(() => {
		if (isEdit) return;
		const startTime = normalizeTime(startTimeWatch);
		const endTime = normalizeTime(endTimeWatch);
		if (!startTime || !endTime) {
			setValue('minimum_hours', '');
			return;
		}
		setValue('minimum_hours', calculateSpanHours(startTime, endTime));
	}, [endTimeWatch, isEdit, setValue, startTimeWatch]);

	useEffect(() => {
		if (!isOpen) return;
		if (!isEdit) {
			reset({
				name: '',
				start_time: '',
				end_time: '',
				auto_in: false,
				auto_out: false,
				first_in_last_out: false,
				is_ot_shift: false,
				ot_eligible: false,
				ot_hours: '',
				start_grace_period_mins: 0,
				end_grace_period_mins: 0,
				remarks: '',
				minimum_hours: '',
			});
			return;
		}

		setIsLoading(true);
		authAxios
			.get(`api/hr/shifts/${id}/`)
			.then((res) => {
				const shift = res?.data || {};
				setIsLoading(false);
				reset({
					name: shift?.name || '',
					start_time: normalizeTime(shift?.start_time),
					end_time: normalizeTime(shift?.end_time),
					auto_in: Boolean(shift?.auto_in),
					auto_out: Boolean(shift?.auto_out),
					first_in_last_out: Boolean(shift?.first_in_last_out),
					is_ot_shift: Boolean(shift?.is_ot_shift),
					ot_eligible: Boolean(shift?.ot_eligible),
					ot_hours:
						shift?.ot_hours != null && shift.ot_hours !== ''
							? String(shift.ot_hours)
							: '',
					start_grace_period_mins: shift?.start_grace_period_mins ?? 0,
					end_grace_period_mins: shift?.end_grace_period_mins ?? 0,
					remarks: shift?.remarks || '',
					minimum_hours:
						shift?.minimum_hours != null && String(shift.minimum_hours).trim() !== ''
							? String(shift.minimum_hours)
							: shift?.total_hours != null && String(shift.total_hours).trim() !== ''
								? String(shift.total_hours)
								: '',
				});
			})
			.catch((err) => {
				setIsLoading(false);
				showErrorNotification(err);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, isEdit, isOpen, reset]);

	const onSubmit = (data: any) => {
		setWaitingForAxios(true);
		const startTime = normalizeTime(data?.start_time);
		const endTime = normalizeTime(data?.end_time);
		const otShift = Boolean(data?.is_ot_shift);
		const otHoursNum = Number(String(data?.ot_hours ?? '').trim());
		const payload = {
			name: data?.name || '',
			start_time: startTime,
			end_time: endTime,
			auto_in: Boolean(data?.auto_in),
			auto_out: Boolean(data?.auto_out),
			first_in_last_out: Boolean(data?.first_in_last_out),
			is_ot_shift: otShift,
			ot_eligible: otShift ? false : Boolean(data?.ot_eligible),
			ot_hours: otShift ? 0 : Number.isFinite(otHoursNum) && !Number.isNaN(otHoursNum) ? otHoursNum : 0,
			start_grace_period_mins: Number(data?.start_grace_period_mins || 0),
			end_grace_period_mins: Number(data?.end_grace_period_mins || 0),
			remarks: data?.remarks?.trim() || '',
			minimum_hours:
				data?.minimum_hours != null && String(data.minimum_hours).trim() !== ''
					? String(data.minimum_hours).trim()
					: calculateSpanHours(startTime, endTime),
			break_duration_mins: 0,
		};

		const req = isEdit
			? authAxios.patch(`api/hr/shifts/${id}/`, payload)
			: authAxios.post('api/hr/shifts/', payload);

		req
			.then(() => {
				setWaitingForAxios(false);
				tableRef?.current?.onQueryChange();
				setIsOpen(false);
			})
			.catch((err) => {
				setWaitingForAxios(false);
				showErrorNotification(err);
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						{isLoading ? (
							<CustomSpinner />
						) : (
							<>
								<ShiftFields
									register={register}
									errors={errors}
									control={control}
									getValues={getValues}
									watch={watch}
									setValue={setValue}
								/>
								<div className='row m-0'>
									<div className='col-12 p-3'>
										<SaveButton state={waitingForAxios} />
									</div>
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

/* eslint-disable react/forbid-prop-types */
ShiftForm.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};
/* eslint-enable react/forbid-prop-types */

ShiftForm.defaultProps = {
	id: null,
};

export default ShiftForm;

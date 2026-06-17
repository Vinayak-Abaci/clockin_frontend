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
import ScheduleFields, { shiftHoursTargetFromApi } from './ScheduleFields';

const ScheduleForm = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
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
			shifts: [],
			priority_choice_number: 0,
			ot_hours: '',
			start_date: '',
			end_date: '',
			applicable_days: [],
			notes: '',
			shift_hours_target: shiftHoursTargetFromApi('DAILY'),
			minimum_target_hours: 0,
		},
	});

	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [shiftOptions, setShiftOptions] = useState([]);
	const { showErrorNotification } = useToasterNotification();
	const isEdit = Boolean(id);

	useEffect(() => {
		if (!isOpen) return;
		setIsLoading(true);

		const shiftsReq = authAxios.get('api/hr/shifts/?paginate=off');
		const scheduleReq = isEdit ? authAxios.get(`api/hr/schedules/${id}/`) : Promise.resolve(null);

		Promise.all([shiftsReq, scheduleReq])
			.then(([shiftsRes, scheduleRes]: any) => {
				const shifts =
					shiftsRes?.data?.map((item: any) => ({
						label: item?.name || item?.shift_name || `Shift ${item?.id}`,
						value: item?.id,
						...item,
					})) || [];

				setShiftOptions(shifts);

				const schedule = scheduleRes?.data;
				const selectedShifts =
					(schedule?.shifts || [])
						.map((shiftItem: any) => {
							const shiftId =
								typeof shiftItem === 'object'
									? shiftItem?.id ?? shiftItem?.value
									: shiftItem;
							if (shiftId == null) return null;
							const option = shifts.find((s: any) => String(s.value) === String(shiftId));
							if (option) return option;
							if (typeof shiftItem === 'object') {
								return {
									label: shiftItem?.name || shiftItem?.shift_name || `Shift ${shiftId}`,
									value: shiftId,
									...shiftItem,
								};
							}
							return null;
						})
						.filter(Boolean) || [];
				const mappedDays =
					schedule?.applicable_days?.map((day: string) => ({ label: day, value: day })) || [];

				setIsLoading(false);
				reset({
					name: schedule?.name || '',
					shifts: selectedShifts,
					priority_choice_number: schedule?.priority_choice_number ?? 0,
					ot_hours:
						schedule?.ot_hours != null && schedule.ot_hours !== ''
							? String(schedule.ot_hours)
							: '',
					start_date: schedule?.start_date || '',
					end_date: schedule?.end_date || '',
					applicable_days: mappedDays,
					notes: schedule?.notes || '',
					shift_hours_target: shiftHoursTargetFromApi(schedule?.shift_hours_target),
					minimum_target_hours:
						schedule?.minimum_target_hours != null && schedule.minimum_target_hours !== ''
							? Number(schedule.minimum_target_hours)
							: 0,
				});
			})
			.catch((err) => {
				setIsLoading(false);
				showErrorNotification(err);
			});
	}, []);

	const onSubmit = (data: any) => {
		setWaitingForAxios(true);
		const otHoursNum = Number(String(data?.ot_hours ?? '').trim());
		const basePayload = {
			name: data?.name || '',
			shifts: (data?.shifts || []).map((shift: any) => shift?.value),
			priority_choice_number: Number(data?.priority_choice_number || 0),
			ot_hours:
				Number.isFinite(otHoursNum) && !Number.isNaN(otHoursNum) ? otHoursNum : 0,
			start_date: data?.start_date || null,
			end_date: data?.end_date || null,
			applicable_days: (data?.applicable_days || []).map((day: any) => day?.value),
			notes: data?.notes || '',
			shift_hours_target: data?.shift_hours_target?.value || 'DAILY',
			minimum_target_hours: Number(data?.minimum_target_hours ?? 0),
		};

		const req = isEdit
			? authAxios.patch(`api/hr/schedules/${id}/`, basePayload)
			: authAxios.post('api/hr/schedules/', basePayload);

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
								<ScheduleFields
									register={register}
									errors={errors}
									control={control}
									getValues={getValues}
									watch={watch}
									setValue={setValue}
									shiftOptions={shiftOptions}
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
ScheduleForm.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};
/* eslint-enable react/forbid-prop-types */

ScheduleForm.defaultProps = {
	id: null,
};

export default ScheduleForm;

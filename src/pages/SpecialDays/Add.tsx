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
import Fields from './Fields';

const normalizeShiftIdsFromApi = (specialDay: any): number[] => {
	if (!specialDay) return [];
	const raw = specialDay?.shifts;
	if (Array.isArray(raw) && raw.length) {
		return raw
			.map((x: any) => Number(typeof x === 'object' && x != null ? x?.id ?? x?.shift : x))
			.filter((n: number) => !Number.isNaN(n));
	}
	if (specialDay?.shift != null && specialDay.shift !== '') {
		const n = Number(specialDay.shift);
		return Number.isNaN(n) ? [] : [n];
	}
	return [];
};

const AddSpecialDay = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
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
			from_date: '',
			end_date: '',
			day_type: null,
			notes: '',
			shifts: [],
		},
	});

	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [shiftOptions, setShiftOptions] = useState([]);
	const { showErrorNotification } = useToasterNotification();
	const isEdit = Boolean(id);
	const watchedDayType = watch('day_type');

	useEffect(() => {
		if (!isOpen) return;
		setIsLoading(true);

		const shiftsReq = authAxios.get('api/hr/shifts/?paginate=off');
		const specialDayReq = isEdit ? authAxios.get(`api/hr/special-periods/${id}/`) : Promise.resolve(null);

		Promise.all([shiftsReq, specialDayReq])
			.then(([shiftsRes, specialDayRes]: any) => {
				const shiftsList = Array.isArray(shiftsRes?.data) ? shiftsRes.data : shiftsRes?.data?.results || [];

				const shifts =
					shiftsList.map((item: any) => ({
						label: item?.name || item?.shift_name || `Shift ${item?.id}`,
						value: item?.id,
						...item,
					})) || [];

				setShiftOptions(shifts);

				const specialDay = specialDayRes?.data;
				const shiftIdSet = new Set(normalizeShiftIdsFromApi(specialDay));
				const selectedShifts = shifts.filter((s: any) => shiftIdSet.has(Number(s.value)));
				const selectedDayType = specialDay?.day_type
					? {
							label:
								specialDay.day_type === 'SPECIAL_SCHEDULE'
									? 'Special schedule'
									: specialDay.day_type === 'HOLIDAY'
									? 'Holiday'
									: specialDay.day_type,
							value: specialDay.day_type,
					  }
					: null;

				const legacyDate = specialDay?.date || '';
				const fromD = specialDay?.from_date || legacyDate;
				const endD = specialDay?.end_date || legacyDate;

				reset({
					name: specialDay?.name || '',
					from_date: fromD ? String(fromD).slice(0, 10) : '',
					end_date: endD ? String(endD).slice(0, 10) : '',
					day_type: selectedDayType,
					notes: specialDay?.notes || '',
					shifts: selectedShifts,
				});
			})
			.catch((err) => {
				showErrorNotification(err);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	const onSubmit = (data: any) => {
		setWaitingForAxios(true);
		const shiftsPayload =
			data?.day_type?.value === 'SPECIAL_SCHEDULE'
				? (data?.shifts || []).map((s: any) => Number(s?.value)).filter((n: number) => !Number.isNaN(n))
				: [];
		const payload = {
			name: data?.name || '',
			from_date: data?.from_date || null,
			end_date: data?.end_date || null,
			day_type: data?.day_type?.value || null,
			notes: data?.notes || '',
			shifts: shiftsPayload,
			is_deleted: false,
		};

		const req = isEdit
			? authAxios.patch(`api/hr/special-periods/${id}/`, payload)
			: authAxios.post('api/hr/special-periods/', payload);

		req
			.then(() => {
				tableRef?.current?.onQueryChange();
				setIsOpen(false);
			})
			.catch((err) => {
				showErrorNotification(err);
			})
			.finally(() => {
				setWaitingForAxios(false);
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
								<Fields
									register={register}
									errors={errors}
									control={control}
									getValues={getValues}
									watch={watch}
									setValue={setValue}
									dayTypeValue={watchedDayType?.value}
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
AddSpecialDay.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};
/* eslint-enable react/forbid-prop-types */

AddSpecialDay.defaultProps = {
	id: null,
};

export default AddSpecialDay;

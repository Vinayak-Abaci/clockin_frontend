import React, { useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios, authAxiosFileUpload } from '../../axiosInstance';
import base64toFile from '../../helpers/base64toFile';
import { isBase64Image, resolveUserAvatarSource } from '../../helpers/functions';
import OffCanvasComponent from '../../components/OffCanvasComponent';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import SaveButton from '../../components/CustomComponent/Buttons/SaveButton';
import UserFields from '../../components/MasterComponents/Usermanagement/UserFields';
import useToasterNotification from '../../hooks/useToasterNotification';
import ImageCropper from '../../components/CustomComponent/ImageCropper';
import AuthContext from '../../contexts/authContext';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import { GenderOptions } from '../../helpers/constants';

const mapGenderSelect = (g) => {
	if (g == null || g === '') return null;
	const s = typeof g === 'string' ? g : g.label || g.value;
	return GenderOptions.find((o) => o.value === s || o.label === s) || { label: s, value: s };
};

const findManagerOption = (options, raw) => {
	if (raw == null || raw === '') return null;
	const id = typeof raw === 'object' && raw !== null ? raw.id : raw;
	return options.find((o) => Number(o.value) === Number(id)) || null;
};

/** HR account detail may expose schedule as id, nested object, or schedules[] of ids/objects. */
const resolveScheduleId = (user) => {
	const s = user?.schedule;
	if (s != null && typeof s === 'object' && !Array.isArray(s)) {
		const id = s.id ?? s.pk;
		return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
	}
	if (s != null && (typeof s === 'number' || typeof s === 'string')) {
		const n = Number(s);
		return Number.isNaN(n) ? null : n;
	}
	const arr = user?.schedules;
	if (Array.isArray(arr) && arr.length > 0) {
		const first = arr[0];
		if (first != null && typeof first === 'object') {
			const id = first.id ?? first.pk ?? first.schedule_id;
			return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
		}
		const n = Number(first);
		return Number.isNaN(n) ? null : n;
	}
	const sid = user?.schedule_id ?? user?.active_relations?.[0]?.schedule_id;
	if (sid != null && sid !== '') {
		const n = Number(sid);
		return Number.isNaN(n) ? null : n;
	}
	return null;
};

/** All schedule ids on the account (for remove_schedules on patch). */
const resolveScheduleIds = (user) => {
	const ids = [];
	const arr = user?.schedules;
	if (Array.isArray(arr)) {
		arr.forEach((item) => {
			const raw =
				item != null && typeof item === 'object'
					? item.id ?? item.pk ?? item.schedule_id
					: item;
			const n = Number(raw);
			if (!Number.isNaN(n) && !ids.includes(n)) ids.push(n);
		});
	}
	if (ids.length) return ids;
	const single = resolveScheduleId(user);
	return single != null ? [single] : [];
};

const buildFormValuesFromAccount = (user, scheduleOptions, reportingOpts, hrOpts) => {
	const scheduleId = resolveScheduleId(user);
	const schedule =
		scheduleId != null
			? scheduleOptions.find((s) => Number(s.value) === Number(scheduleId)) || {
					label: `Schedule ${scheduleId}`,
					value: Number(scheduleId),
				}
			: null;

	return {
		email: user?.email || '',
		first_name: user?.first_name || user?.user_data?.first_name || '',
		last_name: user?.last_name || user?.user_data?.last_name || '',
		gender: mapGenderSelect(user?.gender),
		dob: user?.dob ? String(user.dob).slice(0, 10) : '',
		joined_date: user?.joined_date ? String(user.joined_date).slice(0, 10) : '',
		address: user?.address || '',
		state: user?.state || '',
		city: user?.city || '',
		pincode: user?.pincode || '',
		country: user?.country || '',
		personal_contact_number: user?.personal_contact_number || '',
		office_contact_number:
			user?.office_contact_number || user?.user_data?.user_contact_phone || '',
		is_manager: Boolean(user?.is_manager),
		is_hr: Boolean(user?.is_hr),
		group:
			user?.group?.id != null
				? { label: user.group.name || '', value: user.group.id }
				: null,
		site:
			user?.site?.id != null ? { label: user.site.name || '', value: user.site.id } : null,
		reporting_manager: findManagerOption(reportingOpts, user?.reporting_manager),
		hr_manager: findManagerOption(hrOpts, user?.hr_manager),
		schedule,
		is_delete_image: false,
	};
};

const appendFormField = (formData, key, value) => {
	if (value != null && value !== '') {
		formData.append(key, String(value));
	}
};

const buildAccountFormData = (data, image, initialScheduleIds = []) => {
	const formData = new FormData();

	appendFormField(formData, 'email', data?.email);
	appendFormField(formData, 'first_name', data?.first_name);
	appendFormField(formData, 'last_name', data?.last_name);
	appendFormField(formData, 'gender', data?.gender?.value);
	appendFormField(formData, 'dob', data?.dob);
	appendFormField(formData, 'joined_date', data?.joined_date);
	appendFormField(formData, 'address', data?.address);
	appendFormField(formData, 'state', data?.state);
	appendFormField(formData, 'city', data?.city);
	appendFormField(formData, 'pincode', data?.pincode);
	appendFormField(formData, 'country', data?.country);
	appendFormField(formData, 'personal_contact_number', data?.personal_contact_number);
	appendFormField(formData, 'office_contact_number', data?.office_contact_number);
	formData.append('is_manager', String(Boolean(data?.is_manager)));
	formData.append('is_hr', String(Boolean(data?.is_hr)));
	appendFormField(formData, 'group', data?.group?.value);
	appendFormField(formData, 'site', data?.site?.value);
	appendFormField(formData, 'reporting_manager', data?.reporting_manager?.value);
	appendFormField(formData, 'hr_manager', data?.hr_manager?.value);

	const selectedScheduleId =
		data?.schedule?.value != null && data?.schedule?.value !== ''
			? Number(data.schedule.value)
			: null;

	(initialScheduleIds || []).forEach((id) => {
		const n = Number(id);
		if (Number.isNaN(n)) return;
		if (selectedScheduleId == null || selectedScheduleId !== n) {
			formData.append('remove_schedules', String(n));
		}
	});

	if (selectedScheduleId != null && !Number.isNaN(selectedScheduleId)) {
		formData.append('schedules', String(selectedScheduleId));
	}

	if (data?.is_delete_image) {
		formData.append('is_delete_image', 'true');
	}

	if (image && isBase64Image(image)) {
		const blob = base64toFile(image);
		const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
		formData.append('avatar', file);
	}

	return formData;
};

const EditUser = ({ isOpen, setIsOpen, tableRef, userId, title }) => {
	const {
		register,
		handleSubmit,
		getValues,
		control,
		setValue,
		reset,
		formState: { errors },
	} = useForm({ defaultValues: {} });

	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const [formLoading, setFormLoading] = useState(false);
	const { showErrorNotification } = useToasterNotification();
	const [image, setImage] = useState(null);
	const [groupOptions, setGroupOptions] = useState([]);
	const [siteOptions, setSiteOptions] = useState([]);
	const [reportingManagerOptions, setReportingManagerOptions] = useState([]);
	const [hrManagerOptions, setHrManagerOptions] = useState([]);
	const [scheduleOptions, setScheduleOptions] = useState([]);
	const initialScheduleIdsRef = useRef([]);
	const { userData } = useContext(AuthContext);

	useEffect(() => {
		if (!isOpen || userId == null || userId === '') return undefined;

		let cancelled = false;
		setFormLoading(true);

		const toOptions = (list, selfId) =>
			(Array.isArray(list) ? list : [])
				.filter((item) => item?.id !== selfId)
				.map((item) => ({
					label:
						item?.name ||
						`${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
						item?.email ||
						`User ${item?.id}`,
					value: item?.id,
				}));

		const run = async () => {
			const selfId = userData?.id;
			const accountsParams = { paginate: 'off' };
			try {
				const [groupsRes, sitesRes, schedulesRes, reportingRes, hrRes, userRes] =
					await Promise.all([
						authAxios.get('api/hr/groups/?paginate=off'),
						authAxios.get('api/hr/sites/?paginate=off'),
						authAxios.get('api/hr/schedules/?paginate=off'),
						authAxios.get('api/hr/accounts/', {
							params: { ...accountsParams, is_manager: true },
						}),
						authAxios.get('api/hr/accounts/', {
							params: { ...accountsParams, is_hr: true },
						}),
						authAxios.get(`api/hr/accounts/${userId}/`),
					]);

				if (cancelled) return;

				const groupOpts =
					groupsRes?.data?.map((item) => ({
						label: item?.name,
						value: item?.id,
					})) || [];
				const siteOpts =
					sitesRes?.data?.map((item) => ({
						label: item?.name,
						value: item?.id,
					})) || [];
				const rawSched = Array.isArray(schedulesRes?.data)
					? schedulesRes.data
					: schedulesRes?.data?.results || [];
				const schedOpts =
					rawSched.map((item) => ({
						label: item?.name || `Schedule ${item?.id}`,
						value: item?.id,
					})) || [];

				const reportingList = Array.isArray(reportingRes?.data)
					? reportingRes.data
					: reportingRes?.data?.results || [];
				const hrList = Array.isArray(hrRes?.data) ? hrRes.data : hrRes?.data?.results || [];
				const reportingOpts = toOptions(reportingList, selfId);
				const hrOpts = toOptions(hrList, selfId);

				setGroupOptions(groupOpts);
				setSiteOptions(siteOpts);
				setScheduleOptions(schedOpts);
				setReportingManagerOptions(reportingOpts);
				setHrManagerOptions(hrOpts);

				const user = userRes?.data;
				if (user) {
					initialScheduleIdsRef.current = resolveScheduleIds(user);
					reset(buildFormValuesFromAccount(user, schedOpts, reportingOpts, hrOpts));
					setImage(resolveUserAvatarSource(user));
				}
			} catch (e) {
				if (!cancelled) showErrorNotification(e);
			} finally {
				if (!cancelled) setFormLoading(false);
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, userId, userData?.id]);

	const onSubmit = (data) => {
		setwaitingForAxios(true);
		const formData = buildAccountFormData(data, image, initialScheduleIdsRef.current);
		authAxiosFileUpload
			.patch(`api/hr/accounts/${userId}/`, formData)
			.then(() => {
				setwaitingForAxios(false);
				tableRef.current.onQueryChange();
				setIsOpen(false);
			})
			.catch((err) => {
				setwaitingForAxios(false);
				showErrorNotification(err);
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						{formLoading ? (
							<CustomSpinner />
						) : (
							<>
								<Card>
									<CardHeader>
										<CardLabel icon='' iconColor='info'>
											<CardTitle>User Image</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className='row'>
											<div className='col-12' />
											<div className='col-12'>
												<div className='row g-4'>
													<div className='col-12'>
														<ImageCropper
															setCroppedImage={setImage}
															croppedImage={image}
															setValue={setValue}
														/>
													</div>
												</div>
											</div>
										</div>
									</CardBody>
								</Card>
								<Card>
									<CardBody>
										<UserFields
											register={register}
											errors={errors}
											control={control}
											getValues={getValues}
											groupOptions={groupOptions}
											siteOptions={siteOptions}
											reportingManagerOptions={reportingManagerOptions}
											hrManagerOptions={hrManagerOptions}
											scheduleOptions={scheduleOptions}
										/>
										<div className='row m-0'>
											<div className='col-12 p-3'>
												<SaveButton state={waitingForAxios} />
											</div>
										</div>
									</CardBody>
								</Card>
							</>
						)}
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

/* eslint-disable react/forbid-prop-types */
EditUser.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	title: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default EditUser;

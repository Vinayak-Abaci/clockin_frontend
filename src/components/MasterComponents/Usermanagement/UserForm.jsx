import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import UserFields from './UserFields';
import SaveButton from '../../CustomComponent/Buttons/SaveButton';
import CustomSpinner from '../../CustomSpinner/CustomSpinner';
import useToasterNotification from '../../../hooks/useToasterNotification';
import ImageCropper from '../../CustomComponent/ImageCropper';

const UserForm = ({ isOpen, setIsOpen, tableRef, id = null, title }) => {
	const {
		register,
		handleSubmit,
		watch,
		getValues,
		control,
		setValue,
		reset,
		formState: { errors },
	} = useForm();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(!!id);
	const { showErrorNotification } = useToasterNotification();
	const [image, setImage] = useState(null);
	const [siteOptions, setSiteOptions] = useState([]);
	const [reportingManagerOptions, setReportingManagerOptions] = useState([]);
	const [hrManagerOptions, setHrManagerOptions] = useState([]);
	const [scheduleOptions, setScheduleOptions] = useState([]);

	useEffect(() => {
		const sitesReq = authAxios.get('api/hr/sites/?paginate=off');
		const userReq = id ? authAxios.get(`api/hr/users/${id}/`) : Promise.resolve(null);
		const accountsParams = { paginate: 'off' };
		const reportingManagersReq = authAxios.get('api/hr/accounts/', {
			params: { ...accountsParams, user_type__role_name: 'Manager' },
		});
		const hrManagersReq = authAxios.get('api/hr/accounts/', {
			params: { ...accountsParams, user_type__role_name: 'HR' },
		});
		const schedulesReq = authAxios.get('api/hr/schedules/?paginate=off');

		Promise.all([ sitesReq, userReq, reportingManagersReq, hrManagersReq, schedulesReq])
			.then(([ sitesRes, userRes, reportingManagersRes, hrManagersRes, schedulesRes]) => {
				const sites =
					sitesRes?.data?.results?.map((item) => ({ label: item?.name, value: item?.id })) || [];
				const toOptions = (list) =>
					(Array.isArray(list) ? list : []).map((item) => ({
						label:
							item?.name ||
							`${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
							item?.email ||
							`User ${item?.id}`,
						value: item?.id,
					}));
				const reportingList = Array.isArray(reportingManagersRes?.data)
					? reportingManagersRes.data
					: reportingManagersRes?.data?.results || [];
				const hrList = Array.isArray(hrManagersRes?.data)
					? hrManagersRes.data
					: hrManagersRes?.data?.results || [];
				const scheduleRaw = Array.isArray(schedulesRes?.data)
					? schedulesRes.data
					: schedulesRes?.data?.results || [];
				const scheduleOpts =
					scheduleRaw.map((item) => ({
						label: item?.name || `Schedule ${item?.id}`,
						value: item?.id,
					})) || [];
				setSiteOptions(sites);
				const reportingOpts = toOptions(reportingList);
				const hrOpts = toOptions(hrList);
				setReportingManagerOptions(reportingOpts);
				setHrManagerOptions(hrOpts);
				setScheduleOptions(scheduleOpts);

				if (id && userRes?.data) {
					const user = userRes.data;
					const scheduleId =
						user?.schedule != null && typeof user.schedule === 'object'
							? user.schedule?.id
							: user?.schedule ?? user?.schedule_id ?? null;
					const response = {
						email: user?.email || '',
						first_name: user?.first_name || user?.user_data?.first_name || '',
						last_name: user?.last_name || user?.user_data?.last_name || '',
						gender: user?.gender ? { label: user.gender, value: user.gender } : null,
						dob: user?.dob || '',
						address: user?.address || '',
						state: user?.state || '',
						city: user?.city || '',
						pincode: user?.pincode || '',
						country: user?.country || '',
						personal_contact_number: user?.personal_contact_number || '',
						office_contact_number: user?.office_contact_number || '',
						user_type: user?.user_type ? { label: String(user.user_type), value: user.user_type } : null,
						site: user?.site ? sites.find((s) => s.value === user.site) || null : null,
						reporting_manager: user?.reporting_manager
							? reportingOpts.find((m) => Number(m.value) === Number(user.reporting_manager)) || null
							: null,
						hr_manager: user?.hr_manager
							? hrOpts.find((m) => Number(m.value) === Number(user.hr_manager)) || null
							: null,
						schedules:
							scheduleId != null
								? scheduleOpts.find((s) => Number(s.value) === Number(scheduleId))
								: null,
					};
					reset(response);
					setImage(user?.user_data?.user_image || null);
				}
			})
			.catch((error) => {
				showErrorNotification(error);
			})
			.finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps    
	}, [id]);

	const onSubmit = (data) => {
		const payload = {
			email: data?.email || '',
			first_name: data?.first_name || '',
			last_name: data?.last_name || '',
			gender: data?.gender?.value || '',
			dob: data?.dob || null,
			address: data?.address || '',
			state: data?.state || '',
			city: data?.city || '',
			pincode: data?.pincode || '',
			country: data?.country || '',
			personal_contact_number: data?.personal_contact_number || '',
			office_contact_number: data?.office_contact_number || '',
			user_type: data?.user_type?.value || null,
			site: data?.site?.value || null,
			reporting_manager: data?.reporting_manager?.value || null,
			hr_manager: data?.hr_manager?.value || null,
			schedules:
				data?.schedule?.value != null && data?.schedule?.value !== ''
					? [Number(data.schedule.value)]
					: [],
		};

		setWaitingForAxios(true);
		const url = id ? `api/users/${id}/` : 'api/users';
		const request = id ? authAxios.patch(url, payload) : authAxios.post(url, payload);

		request
			.then(() => {
				tableRef.current.onQueryChange();
				setIsOpen(false);
			})
			.catch((err) => showErrorNotification(err))
			.finally(() => setWaitingForAxios(false));
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement="end" title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						{id && isLoading ? (
							<CustomSpinner />
						) : (
							<>
								<Card>
									<CardHeader>
										<CardLabel icon="" iconColor="info">
											<CardTitle>User Image</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className="row">
											<div className="col-12">
												<div className="row g-4">
													<div className="col-12">
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

								<UserFields 
									register={register} 
									errors={errors} 
									control={control} 
									getValues={getValues}
									siteOptions={siteOptions}
									reportingManagerOptions={reportingManagerOptions}
									hrManagerOptions={hrManagerOptions}
									scheduleOptions={scheduleOptions}
								/>

								<div className="row m-0">
									<div className="col-12 p-3">
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
UserForm.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	id: PropTypes.any, // id is optional; if provided, it's edit mode
	title: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default UserForm;

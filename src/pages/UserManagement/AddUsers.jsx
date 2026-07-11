import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios, authAxiosFileUpload } from '../../axiosInstance';
import base64toFile from '../../helpers/base64toFile';
import { isBase64Image } from '../../helpers/functions';
import OffCanvasComponent from '../../components/OffCanvasComponent';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import SaveButton from '../../components/CustomComponent/Buttons/SaveButton';
import UserFields from '../../components/MasterComponents/Usermanagement/UserFields';
import useToasterNotification from '../../hooks/useToasterNotification';
import ImageCropper from '../../components/CustomComponent/ImageCropper';
import AuthContext from '../../contexts/authContext';

const AddUsers = ({ isOpen, setIsOpen, tableRef, title }) => {
	const {
		register,
		handleSubmit,
		watch,
		getValues,
		control,
		setValue,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: {
			is_manager: false,
			is_hr: false,
		},
	});
	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const { showErrorNotification } = useToasterNotification();
	const [image, setImage] = useState(null);
	const [groupOptions, setGroupOptions] = useState([]);
	const [siteOptions, setSiteOptions] = useState([]);
	const [reportingManagerOptions, setReportingManagerOptions] = useState([]);
	const [hrManagerOptions, setHrManagerOptions] = useState([]);
	const [scheduleOptions, setScheduleOptions] = useState([]);
	const { userData } = useContext(AuthContext);

	useEffect(() => {
		if (isOpen) {
			reset({
				is_manager: false,
				is_hr: false,
			});
			setImage(null);
		}
	}, [isOpen, reset, setValue]);

	useEffect(() => {
		if (!isOpen) return;
		authAxios
			.get('api/hr/groups/?paginate=off')
			.then((res) => {
				const options =
					res?.data?.map((item) => ({
						label: item?.name,
						value: item?.id,
					})) || [];
				setGroupOptions(options);
			})
			.catch(() => setGroupOptions([]));

		authAxios
			.get('api/hr/sites/?paginate=off')
			.then((res) => {
				const options =
					res?.data?.map((item) => ({
						label: item?.name,
						value: item?.id,
					})) || [];
				setSiteOptions(options);
			})
			.catch(() => setSiteOptions([]));

		authAxios
			.get('api/hr/schedules/?paginate=off')
			.then((res) => {
				const raw = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
				const options =
					raw.map((item) => ({
						label: item?.name || `Schedule ${item?.id}`,
						value: item?.id,
					})) || [];
				setScheduleOptions(options);
			})
			.catch(() => setScheduleOptions([]));

		const accountsParams = { paginate: 'off' };
		const selfId = userData?.id;
		const toOptions = (list) =>
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
		Promise.all([
			authAxios.get('api/hr/accounts/', {
				params: { ...accountsParams, is_manager: true },
			}),
			authAxios.get('api/hr/accounts/', {
				params: { ...accountsParams, is_hr: true },
			}),
		])
			.then(([reportingRes, hrRes]) => {
				const reportingList = Array.isArray(reportingRes?.data)
					? reportingRes.data
					: reportingRes?.data?.results || [];
				const hrList = Array.isArray(hrRes?.data) ? hrRes.data : hrRes?.data?.results || [];
				setReportingManagerOptions(toOptions(reportingList));
				setHrManagerOptions(toOptions(hrList));
			})
			.catch(() => {
				setReportingManagerOptions([]);
				setHrManagerOptions([]);
			});
	}, [isOpen, userData?.id]);

	const appendFormField = (formData, key, value) => {
		if (value != null && value !== '') {
			formData.append(key, String(value));
		}
	};

	const onSubmit = (data) => {
		setwaitingForAxios(true);
		const url = 'api/hr/accounts/';
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

		if (data?.schedule?.value != null && data?.schedule?.value !== '') {
			formData.append('schedules', String(Number(data.schedule.value)));
		}

		if (image && isBase64Image(image)) {
			const blob = base64toFile(image);
			const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
			formData.append('avatar', file);
		}

		authAxiosFileUpload
			.post(url, formData)
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
			</Form>
		</OffCanvasComponent>
	);
};

/* eslint-disable react/forbid-prop-types */
AddUsers.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default AddUsers;

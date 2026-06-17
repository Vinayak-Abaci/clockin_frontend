import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import OffCanvasComponent from '../../components/OffCanvasComponent';
import Card, { CardBody } from '../../components/bootstrap/Card';
import SaveButton from '../../components/CustomComponent/Buttons/SaveButton';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import SiteFields from './SiteFields';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';

const AddSite = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
	const {
		register,
		handleSubmit,
		watch,
		getValues,
		control,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: {
			name: '',
			site_type: null,
			timezone: null,
			parent_site: null,
			authority_one: null,
			authority_two: null,
			is_allow_manual_entry: false,
		},
	});

	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [parentSiteOptions, setParentSiteOptions] = useState([]);
	const [authorityOptions, setAuthorityOptions] = useState([]);
	const [timezoneOptions, setTimezoneOptions] = useState([]);
	const { showErrorNotification } = useToasterNotification();
	const isEdit = Boolean(id);

	useEffect(() => {
		if (!isOpen) return;

		setIsLoading(true);

		const sitesReq = authAxios.get('api/hr/sites/?paginate=off');
		const usersReq = authAxios.get('api/hr/accounts/?paginate=off');
		const timezonesReq = authAxios.get('api/hr/timezones/?paginate=off');
		const siteReq = isEdit ? authAxios.get(`api/hr/sites/${id}/`) : Promise.resolve(null);

		Promise.all([sitesReq, usersReq, timezonesReq, siteReq])
			.then(([sitesRes, usersRes, timezonesRes, siteRes]: any) => {
				const siteOptions =
					sitesRes?.data?.map((item: any) => ({
						label: item?.name,
						value: item?.id,
						...item,
					})) || [];
				setParentSiteOptions(siteOptions);

				const userOptions =
					usersRes?.data?.map((item: any) => ({
						label:
							`${item?.preferred_name || ''}`.trim() ||
							`${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
							item?.email,
						value: item?.id,
						...item,
					})) || [];
				setAuthorityOptions(userOptions);

				const tzRaw = Array.isArray(timezonesRes?.data)
					? timezonesRes.data
					: timezonesRes?.data?.results || [];
				const tzOptions = tzRaw.map((item: any) => {
					if (item == null) return null;
					if (typeof item === 'string') {
						return { label: item, value: item };
					}
					const value =
						item?.id ?? item?.pk ?? item?.value ?? item?.timezone ?? item?.tz ?? item?.name;
					const label =
						item?.display_name ??
						item?.label ??
						item?.name ??
						item?.timezone ??
						item?.tz ??
						String(value ?? '');
					return { label, value, ...item };
				}).filter(Boolean);
				setTimezoneOptions(tzOptions);

				const site = siteRes?.data;
				const selectedParent =
					siteOptions.find((opt: any) => opt.value === site?.parent_site?.id) || null;
				const selectedAuthorityOne =
					userOptions.find((opt: any) => opt.value === site?.authority_one?.id) || null;
				const selectedAuthorityTwo =
					userOptions.find((opt: any) => opt.value === site?.authority_two?.id) || null;
				const selectedSiteType = site?.type ? { label: site.type, value: site.type } : null;

				const tzField = site?.timezone ?? site?.time_zone;
				let selectedTimezone = null;
				if (tzField != null && site) {
					if (typeof tzField === 'string') {
						selectedTimezone =
							tzOptions.find(
								(opt: any) =>
									String(opt?.value) === tzField || String(opt?.label) === tzField,
							) || { label: tzField, value: tzField };
					} else {
						const tid = tzField?.id ?? tzField?.pk ?? tzField?.value;
						selectedTimezone =
							tzOptions.find((opt: any) => String(opt?.value) === String(tid)) ||
							(tid != null
								? {
										label:
											tzField?.display_name ??
											tzField?.name ??
											tzField?.timezone ??
											tzField?.tz ??
											String(tid),
										value: tid,
										...tzField,
									}
								: null);
					}
				}

				reset({
					name: site?.name || '',
					site_type: selectedSiteType,
					timezone: selectedTimezone,
					parent_site: selectedParent,
					authority_one: selectedAuthorityOne,
					authority_two: selectedAuthorityTwo,
					is_allow_manual_entry: Boolean(site?.is_allow_manual_entry),
				});
				setIsLoading(false);
			})
			.catch((err) => {
				setIsLoading(false);
				showErrorNotification(err);
				setParentSiteOptions([]);
				setAuthorityOptions([]);
				setTimezoneOptions([]);
			});
	}, []);

	const onSubmit = (data: any) => {
		setWaitingForAxios(true);
		const payload = {
			name: data?.name || '',
			type: data?.site_type?.value || '',
			timezone: data?.timezone?.value ?? null,
			parent_site: data?.parent_site?.value || null,
			authority_one: data?.authority_one?.value || null,
			authority_two: data?.authority_two?.value || null,
			// is_allow_manual_entry: Boolean(data?.is_allow_manual_entry),
		};

		const request = isEdit
			? authAxios.patch(`api/hr/sites/${id}/`, payload)
			: authAxios.post('api/hr/sites/', payload);

		request
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
								<SiteFields
									register={register}
									errors={errors}
									watch={watch}
									control={control}
									getValues={getValues}
									parentSiteOptions={parentSiteOptions}
									authorityOptions={authorityOptions}
									timezoneOptions={timezoneOptions}
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
AddSite.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};
/* eslint-enable react/forbid-prop-types */

AddSite.defaultProps = {
	id: null,
};

export default AddSite;

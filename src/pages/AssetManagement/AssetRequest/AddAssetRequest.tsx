import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import OffCanvasComponent from '../../../components/OffCanvasComponent';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import SaveButton from '../../../components/CustomComponent/Buttons/SaveButton';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import { authAxios, authAxiosFileUpload } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import AssetRequestField from './AssetRequestField';

const appendFormField = (formData: FormData, key: string, value: unknown) => {
	if (value != null && value !== '') {
		formData.append(key, String(value));
	}
};

export const buildAssetRequestFormData = (data: any): FormData => {
	const formData = new FormData();
	appendFormField(formData, 'description', data?.description);

	const files = data?.documents;
	if (files?.length) {
		Array.from(files as FileList).forEach((file) => {
			formData.append('documents', file);
		});
	}

	return formData;
};

const AddAssetRequest = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: {
			description: '',
		},
	});

	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;
	const isEdit = Boolean(id);

	useEffect(() => {
		if (!isOpen) return undefined;

		let cancelled = false;
		setIsLoading(isEdit);

		if (!isEdit) {
			reset({ description: '' });
			setIsLoading(false);
			return undefined;
		}

		authAxios
			.get(`/api/hr/asset-requests/${id}/`)
			.then((res) => {
				if (cancelled) return;
				reset({
					description: res?.data?.description || '',
				});
			})
			.catch((err) => {
				if (!cancelled) showErrorRef.current(err);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, id, isEdit]);

	const onSubmit = (data: any) => {
		setWaitingForAxios(true);
		const formData = buildAssetRequestFormData(data);

		const req = isEdit
			? authAxiosFileUpload.patch(`/api/hr/asset-requests/${id}/`, formData)
			: authAxiosFileUpload.post('/api/hr/asset-requests/', formData);

		req
			.then(() => {
				setWaitingForAxios(false);
				tableRef?.current?.onQueryChange?.();
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
								<AssetRequestField register={register} errors={errors} isEdit={isEdit} />
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

AddAssetRequest.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};

AddAssetRequest.defaultProps = {
	id: null,
};

export default AddAssetRequest;

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import OffCanvasComponent from '../../../components/OffCanvasComponent';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import SaveButton from '../../../components/CustomComponent/Buttons/SaveButton';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import WfhRequestField from './WfhRequestField';
import {
	buildWfhRequestPayload,
	wfhRequestDetailUrl,
	type WfhRequestFormValues,
} from './wfhRequestUtils';

const defaultValues: WfhRequestFormValues = {
	start_date: '',
	end_date: '',
	reason: '',
};

const AddWfhRequest = ({ isOpen, setIsOpen, tableRef, title, id }: any) => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<WfhRequestFormValues>({
		defaultValues,
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
			reset(defaultValues);
			setIsLoading(false);
			return undefined;
		}

		authAxios
			.get(wfhRequestDetailUrl(id))
			.then((res) => {
				if (cancelled) return;
				const data = res?.data ?? {};
				reset({
					start_date: data.start_date ? String(data.start_date).slice(0, 10) : '',
					end_date: data.end_date ? String(data.end_date).slice(0, 10) : '',
					reason: data.reason || '',
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

	const onSubmit = (data: WfhRequestFormValues) => {
		setWaitingForAxios(true);
		const payload = buildWfhRequestPayload(data);

		const req = isEdit
			? authAxios.patch(wfhRequestDetailUrl(id), payload)
			: authAxios.post('/api/hr/wfh-requests/', payload);

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
								<WfhRequestField register={register} errors={errors} />
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

AddWfhRequest.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	id: PropTypes.any,
};

AddWfhRequest.defaultProps = {
	id: null,
};

export default AddWfhRequest;

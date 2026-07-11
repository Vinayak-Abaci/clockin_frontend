import React, { MutableRefObject } from 'react';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import Button from '../../../components/bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import { extractApiErrorMessage } from '../../../hooks/useErrorHandler';
import { wfhRequestActionUrl, type WfhRequestAction } from './wfhRequestUtils';

type WfhRequestActionButtonsProps = {
	id: number;
	tableRef: MutableRefObject<any>;
	canApprove?: boolean;
	canReject?: boolean;
	canCancel?: boolean;
};

const WfhRequestActionButtons: React.FC<WfhRequestActionButtonsProps> = ({
	id,
	tableRef,
	canApprove,
	canReject,
	canCancel,
}) => {
	const showApprove = Boolean(canApprove);
	const showReject = Boolean(canReject);
	const showCancel = Boolean(canCancel);

	if (!showApprove && !showReject && !showCancel) {
		return null;
	}

	const runAction = (label: string, colorIndex: number, action: WfhRequestAction) => {
		Swal.fire({
			title: `${label} request?`,
			icon: 'question',
			text: 'This action cannot be undone.',
			showCancelButton: true,
			iconColor: buttonColor[4],
			confirmButtonColor: buttonColor[colorIndex],
			cancelButtonColor: buttonColor[0],
			confirmButtonText: label,
			cancelButtonText: 'Close',
			showLoaderOnConfirm: true,
			preConfirm: async () => {
				try {
					const response = await authAxios.post(wfhRequestActionUrl(id, action));
					tableRef.current?.onQueryChange?.();
					return response.data;
				} catch (error) {
					const apiMessage = extractApiErrorMessage(error);
					Swal.showValidationMessage(
						apiMessage ? `Request failed: ${apiMessage}` : 'Request failed. Please try again.',
					);
				}
			},
		});
	};

	return (
		<div className='d-inline-flex flex-row flex-nowrap gap-1 align-items-center'>
			{showApprove && (
				<Button
					isOutline={false}
					isLight
					size='sm'
					color='success'
					className={classNames('text-nowrap', { 'border-light': false })}
					icon='Done'
					onClick={() => runAction('Approve', 5, 'approve')}>
					Approve
				</Button>
			)}
			{showReject && (
				<Button
					isOutline={false}
					color='warning'
					isLight
					size='sm'
					className={classNames('text-nowrap', { 'border-light': false })}
					icon='Close'
					onClick={() => runAction('Reject', 4, 'reject')}>
					Reject
				</Button>
			)}
			{showCancel && (
				<Button
					isOutline={false}
					color='danger'
					isLight
					size='sm'
					className={classNames('text-nowrap', { 'border-light': false })}
					icon='Cancel'
					onClick={() => runAction('Cancel', 0, 'cancel')}>
					Cancel
				</Button>
			)}
		</div>
	);
};

export default WfhRequestActionButtons;

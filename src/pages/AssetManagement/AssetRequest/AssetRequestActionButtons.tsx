import React, { MutableRefObject } from 'react';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import Button from '../../../components/bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import { extractApiErrorMessage } from '../../../hooks/useErrorHandler';

type AssetRequestActionButtonsProps = {
	id: number;
	tableRef: MutableRefObject<any>;
	canApprove?: boolean;
	canReject?: boolean;
	canCancel?: boolean;
};

const AssetRequestActionButtons: React.FC<AssetRequestActionButtonsProps> = ({
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

	const runCommand = (
		label: string,
		colorIndex: number,
		endpoint: 'commands' | 'approve',
		command: 'approve' | 'reject' | 'cancel',
	) => {
		Swal.fire({
			title: `${label} request?`,
			icon: 'info',
			text: 'Add a comment (optional).',
			showCancelButton: true,
			iconColor: buttonColor[4],
			confirmButtonColor: buttonColor[colorIndex],
			cancelButtonColor: buttonColor[0],
			confirmButtonText: 'Submit',
			cancelButtonText: 'Cancel',
			input: 'text',
			inputAttributes: {
				autocapitalize: 'off',
			},
			showLoaderOnConfirm: true,
			preConfirm: async (value) => {
				try {
					const url =
						endpoint === 'commands'
							? `/api/hr/asset-requests/${id}/commands/`
							: `/api/hr/asset-requests/${id}/approve/`;
					const response = await authAxios.post(url, {
						command,
						response_text: value || '',
					});
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
					onClick={() => runCommand('Approve', 5, 'commands', 'approve')}>
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
					onClick={() => runCommand('Reject', 4, 'commands', 'reject')}>
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
					onClick={() => runCommand('Cancel', 0, 'approve', 'cancel')}>
					Cancel
				</Button>
			)}
		</div>
	);
};

export default AssetRequestActionButtons;

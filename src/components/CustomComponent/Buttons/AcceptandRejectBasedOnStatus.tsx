import React, { MutableRefObject } from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import { extractApiErrorMessage } from '../../../hooks/useErrorHandler';


interface AcceptAndRejectButtonProps {
	id: number;
	tableRef: MutableRefObject<any>;
	url: string;
	status: string;
	canApprove?: boolean;
	canReject?: boolean;
	canCancel?: boolean;
}

const AcceptandRejectBasedOnStatus: React.FC<AcceptAndRejectButtonProps> = ({
	id,
	tableRef,
	url,
	status,
	canApprove,
	canReject,
	canCancel,
}) => {
	const raw = String(status ?? '').trim().toLowerCase();
	// Use API-valid statuses; keep legacy accepted/declined aliases for compatibility.
	const isApproved = raw === 'approved' || raw === 'accepted';
	const isRejected = raw === 'rejected' || raw === 'declined';
	const isCancelled = raw === 'cancelled' || raw === 'canceled';
	const isApplied = raw === 'applied' || raw === 'pending';
	const isPending = isApplied || (!isApproved && !isRejected && !isCancelled);

	const useActionFlags =
		canApprove !== undefined || canReject !== undefined || canCancel !== undefined;

	const showApprove = useActionFlags
		? Boolean(canApprove)
		: isPending || isRejected || isCancelled;
	const showReject = useActionFlags
		? Boolean(canReject)
		: isPending || isApproved || isCancelled;
	const showCancel = useActionFlags
		? Boolean(canCancel)
		: isPending || isApproved || isRejected;

	if (!showApprove && !showReject && !showCancel) {
		return null;
	}

  const onclickHandler = (nextStatus: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {

    Swal.fire({
        title: 'Are you sure?',
      icon: 'info',
      text: "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[4],
      confirmButtonColor: buttonColor[nextStatus === 'APPROVED' ? 5 : 4],
      cancelButtonColor: buttonColor[0],
      confirmButtonText:"Submit" ,
      cancelButtonText: "Cancel",
        input: "text",
        inputAttributes: {
          autocapitalize: "off",
        },

        showLoaderOnConfirm: true,
        preConfirm: async (value) => {
          try {
            const githubUrl = `${url}/${id}/`;
            const response = await authAxios.patch(githubUrl,{response_text:value,status: nextStatus}); // Using Axios
            tableRef.current.onQueryChange();
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
          className={classNames('text-nowrap', {
            'border-light': false,
          })}
          icon='Done'
          onClick={() => onclickHandler('APPROVED')}
        >
          Approve
        </Button>
      )}

      {showReject && (
        <Button
          isOutline={false}
          color='warning'
          isLight
          size='sm'
          className={classNames('text-nowrap', {
            'border-light': false,
          })}
          icon='Close'
          onClick={() => onclickHandler('REJECTED')}
        >
          Reject
        </Button>
      )}
      {showCancel && (
        <Button
          isOutline={false}
          color='danger'
          isLight
          size='sm'
          className={classNames('text-nowrap', {
            'border-light': false,
          })}
          icon='Cancel'
          onClick={() => onclickHandler('CANCELLED')}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

export default AcceptandRejectBasedOnStatus;

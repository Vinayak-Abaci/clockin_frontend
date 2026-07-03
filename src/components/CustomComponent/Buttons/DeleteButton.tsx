import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import { Tooltip } from '@mui/material';
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';

interface DeleteButtonProps {
  apiEndpoint: string;
  tableRef: React.RefObject<any>; // Reference to the table
  text:string
}

const DeleteButton: React.FC<DeleteButtonProps> = ({  apiEndpoint, tableRef,text }) => {
	const {showErrorNotification}=useToasterNotification();

  const { themeStatus } = useDarkMode();

  const deletehandler = (e:any) => {
    e.stopPropagation();
   
    Swal.fire({
      title: 'Are you sure?',
      icon: 'info',
      text:text|| "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[0],
      theme: themeStatus === 'dark' ? 'dark' : 'light',
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: 'Delete',
    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .delete(url)
          .then(() =>{
            // totalRecordsCount.current - 1;
            tableRef.current.onQueryChange()

          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Tooltip
    arrow
    title='Delete'
    placement='top'>
    <Button
      isOutline={false}
      color='danger'
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon='Delete'
      onClick={deletehandler}>
 
    </Button>
    </Tooltip>
  );
};

export default DeleteButton;

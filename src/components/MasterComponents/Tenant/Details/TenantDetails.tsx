import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom';
import InfoIcon from '../../../CustomComponent/InfoIcon';
import { authAxios } from '../../../../axiosInstance';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import SaveIconButton from '../../../CustomComponent/Buttons/SaveIconButton';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import usePermissionHook from '../../../../hooks/userPermissionHook';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import TenantFields from '../TenantFields';
import { setTenantDetails } from '../../../../store/tenantSlice';


const TenantDetails = ({register,errors,control,getValues,watch,isLoading,handleSubmit,fetchTenant}:any) => {
  const isTenantManagement = usePermissionHook('tenant_management');
  const { id } = useParams();
  const dispatch = useDispatch();
  const [waitingForAxios, setWaitingForAxios] = useState(false)
  const { showErrorNotification } = useToasterNotification()
 
  const saveHandler = (data: any) => {
    setWaitingForAxios(true)
    const payload = {
      tenant_name: data?.tenant_name || '',
      tenant_type: data?.tenant_type || '',
      no_of_slots: data?.no_of_slots || '',
      tenant_contact_phone: data?.tenant_contact_phone || '',
      tenant_id: data?.tenant_id || '',
      meta_data: {
        status: data?.status?.value || '',
        description: data?.description || '',
      },
      global_access: data?.global_access || false
    };

    const url = `api/tenants/${id}/`
    authAxios
      .patch(url, payload)
      .then(() => {
        setWaitingForAxios(false)
        fetchTenant()
      })
      .catch((error) => {
        setWaitingForAxios(false)
        showErrorNotification(error)
      });
  }

  const renderComponent = () => {
    if (!isLoading) {
      return <TenantFields
        register={register}
        errors={errors}
        control={control}
        getValues={getValues}
        watch={watch}
        isEdit
      />

    }
    return <div className='position_centered'>
      <CustomSpinner />
    </div>

  }

  return (
    <>

      <Card stretch tag='form'>
        <CardHeader>
          <CardLabel icon='' iconColor='dark'>
            <CardTitle tag='div' className='h5'>
              Tenant Details
            </CardTitle>
          </CardLabel>
          <CardActions>
            {isTenantManagement &&
              <div className='d-flex  gap-2'>
                <SaveIconButton
                  waitingForAxios={waitingForAxios}
                  isLoading={isLoading}
                  onClickfunc={() => handleSubmit(saveHandler)()}
                />
              </div>}
          </CardActions>
        </CardHeader>
        <CardBody isScrollable>
          <InfoIcon desc="Manage Tenant details here." />
          <Card stretch={isLoading}>
            <CardBody className='d-flex flex-column gap-3'>
              {renderComponent()}
            </CardBody>
          </Card>
        </CardBody>
      </Card>

    </>
  )
}
export default TenantDetails;

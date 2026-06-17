import React, { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux';
import {  useForm  } from 'react-hook-form'
import {  useParams } from 'react-router-dom';
import InfoIcon from '../../../CustomComponent/InfoIcon';
import { authAxios } from '../../../../axiosInstance';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import SaveIconButton from '../../../CustomComponent/Buttons/SaveIconButton';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import usePermissionHook from '../../../../hooks/userPermissionHook';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import { setVehicleDetails } from '../../../../store/vehicles';
import VehicleFields from '../VehicleFields';
import ActivityCard from './VehicleActivityCard';



const VehicleDetails = () => {
    const canManageVehicle=usePermissionHook('vehicle_management');
    const {id}=useParams();
    const dispatch=useDispatch();
    const [waitingForAxios,setWaitingForAxios]=useState(false);
    const [isLoading,setIsloading]=useState(true);
    const {showErrorNotification}=useToasterNotification();
     const {
        register,
        handleSubmit,
        reset,
        control,
        getValues,
        formState: { errors },
    } = useForm();

    useEffect(() => {
       if(id){
        const url = `api/vehicles/${id}/`
        authAxios.get(url)
        .then(response=>{
            reset({
                ...response.data,
                status: {
                    label: response.data?.meta_data?.status,
                    value: response.data?.meta_data?.status,
                },
            })  
           
            setIsloading(false)
            dispatch(setVehicleDetails(response.data))
        })
        .catch((err) => {
            setIsloading(false)
            showErrorNotification(err)
        })
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])


    
   const saveHandler=(data:any)=>{
    setWaitingForAxios(true)
    const payload = {
                    plate_number:data.plate_number,
                    vehicle_brand:data?.vehicle_brand||'',
                    vehicle_color:data?.vehicle_color||'' ,
                    vehicle_plate_color	:data.vehicle_plate_color,
                    vehicle_type:data.vehicle_type,
                    meta_data: {
                        status: data?.status?.value,
                    },
              };	
    const url = `api/vehicles/${id}/`
    authAxios
        .patch(url, payload)
        .then((response) => {
          setWaitingForAxios(false)
          dispatch(setVehicleDetails(response.data))
        })
        .catch((error) => {
        setWaitingForAxios(false)
        showErrorNotification(error)
      });
    }

const renderComponent=()=>{
        if(isLoading){
          return<div className='position_centered'>
          <CustomSpinner />
          </div>
        }

      return  <>
               <ActivityCard />
               <Card stretch={isLoading}>
                 <CardHeader>
                   <CardLabel icon='' iconColor='dark'>
                   <></>
                   </CardLabel>
                  <CardActions>
                    {canManageVehicle&&                 
                        <SaveIconButton
                        waitingForAxios={waitingForAxios}
                        isLoading={isLoading} 
                        onClickfunc={()=> handleSubmit(saveHandler)()}
                      />
                      }
                  </CardActions>
                 </CardHeader>
                <CardBody className='d-flex flex-column gap-3'>
                    <VehicleFields 
                        register={register} 
                        errors={errors} 
                        isEdit
                        control={control}
                        getValues={getValues}
                    />
                 </CardBody>
                </Card>
      </>
      
    }



  return (
    <>
    <Card stretch tag='form'>
        <CardHeader>
            <CardLabel icon='' iconColor='dark'>
                <CardTitle tag='div' className='h5'>
                   Vehicle Details
                </CardTitle>

            </CardLabel>
        </CardHeader>
        <CardBody isScrollable>       
          <InfoIcon desc="Manage Vehicle's details here."/>
            {renderComponent()}
        </CardBody> 
      </Card>

      </>
  )
}
export default VehicleDetails;

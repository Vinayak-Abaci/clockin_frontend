import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../../axiosInstance';
import OffCanvasComponent from '../../../../components/OffCanvasComponent';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../../components/bootstrap/Card';
import SaveButton from '../../../../components/CustomComponent/Buttons/SaveButton';
import UserFields from '../../../../components/MasterComponents/Usermanagement/UserFields';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import ImageCropper from '../../../../components/CustomComponent/ImageCropper';
import { useParams } from 'react-router-dom';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import { isBase64Image } from '../../../../helpers/functions';

const EditUser = ({ isOpen, setIsOpen, tableRef, title ,userId}) => {

    const {
        register,
        handleSubmit,
        watch,
        getValues,
        control,
        setValue,
        reset,
        formState: { errors },
    } = useForm();
    const [waitingForAxios, setwaitingForAxios] = useState(false);
    const { showErrorNotification } = useToasterNotification();
    const [image, setImage] = useState(null);
    const [isloading,setIsloading] = useState(true);

    const {id}=useParams();


     useEffect(() => {
           if(userId){
            const url = `api/users/${userId}`
            authAxios.get(url)
            .then(response=>{
                reset({
                    ...response.data,
                    ...response.data.user_data,
                    gender:response?.data?.gender?{label:response.data.gender,value:response.data.gender}:'',
                    access_category:response?.data.access_category?.category?{label:response.data.access_category.category,value:response.data.access_category.category}:'',
                    ...response.data.active_relations[0],
                    valid_from:response?.data?.active_relations[0]?.valid_from?.split('T')[0]||'',
                    valid_to:response?.data?.active_relations[0]?.valid_to?.split('T')[0]||'',
                    relation_type:response?.data?.active_relations[0]?.relation_type?{label:response.data.active_relations[0].relation_type,value:response.data.active_relations[0].relation_type}:'',
                })  
                setImage(response?.data?.user_data?.user_image)
               setTimeout(() =>  setIsloading(false),1000)
            
            })
            .catch((err) => {
                setIsloading(false)
                showErrorNotification(err)
            })
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [userId])
    

  
    const onSubmit = (data) => {
        setwaitingForAxios(true);
        const url = `api/users/${userId}`;
        const payload={
            username:data?.username||'',
            preferred_name:data?.preferred_name||null,
            access_category:{
                category:data?.access_category?.value||''
            },
            user_data:{
                user_contact_phone:data?.user_contact_phone||'',
                first_name:data?.first_name||'',
                last_name:data?.last_name||'',
                ...(isBase64Image(image) && { user_image: image }),
            },
            relation_to_tenant:{
                valid_to:data?.valid_to||null,
                valid_from:data?.valid_from||'',
                tenant:Number(id),
                employee_id:data?.employee_id||'',
                designation:data?.designation||'',
                relation_type:data?.relation_type?.value||''
            },
            gender:data?.gender?.value||'',
           

        }
        authAxios
            .patch(url, payload)
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
            {isloading ?<CustomSpinner/>:
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
                          watch={watch}
                          control={control} 
                          getValues={getValues}
                          setValue={setValue} 
                          isFromTenant
                          isFromTenantEdit
                        />
                        <div className='row m-0'>
                            <div className='col-12 p-3'>
                                <SaveButton state={waitingForAxios} />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Form>}
        </OffCanvasComponent>
    );
};

/* eslint-disable react/forbid-prop-types */
EditUser.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    tableRef: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    userId: PropTypes.any.isRequired,

};
/* eslint-enable react/forbid-prop-types */

export default EditUser;

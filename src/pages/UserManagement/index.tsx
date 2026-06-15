import React, { useContext, useRef, useState } from 'react';
// import Swal from 'sweetalert2';
import SubHeader, {
	SubHeaderLeft,
	SubHeaderRight,
} from '../../layout/SubHeader/SubHeader';
import Card, {
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import AddUsers from './AddUsers';
import EditUser from './EditUser';
import UserManagementTableComponent from '../../components/MasterComponents/Usermanagement/UserMangementTableComponent';
// import ExportButton from '../../components/CustomComponent/Buttons/ExportButton';
import BulkUpload from '../../components/MasterComponents/BulkUpload/BulkUploadOffCanvas';
import ButtonWithPopover from '../../components/CustomComponent/Buttons/ButtonWithPopover';
import usePermissionHook from '../../hooks/userPermissionHook';
import AuthContext from '../../contexts/authContext';
import ButtonFiltter from '../../components/CustomComponent/Filters/ButtonFiltter';

export type UserCrudModel = {
	email: string;
	first_name: string;
	last_name: string;
	gender: string;
	dob: string;
	joined_date?: string;
	address: string;
	state: string;
	city: string;
	pincode: string;
	country: string;
	personal_contact_number: string;
	office_contact_number: string;
	user_type: number;
	group: number;
	site: number;
};

const Index = () => {

	const tableRef = useRef();
	const urlBackup = useRef();
	const [addModalShow, setAddModalShow] = useState(false);
	const [editModalShow, setEditModalShow] = useState(false);
	const [editUserId, setEditUserId] = useState<number | string | null>(null);
	const [addBulkModalShow, setAddBulkModalShow] = useState(false);
	const {userData}=useContext(AuthContext)
	const tenant = userData?.active_relations?.[0]?.tenant_details || null;
	const [activeTab, setActiveTab] = useState('All')
	const FilterStatus = ['All', tenant ? tenant?.tenant_name : '']
	const canSeeTenantFilter=usePermissionHook('view_tenant_filter');	
	const editModalToggle = (id: any) => {
		setEditUserId(id);
		setEditModalShow(true);
	};

	const closeEditModal = (open: boolean) => {
		if (!open) setEditUserId(null);
		setEditModalShow(open);
	};

	return (
		<>
			{addModalShow && (
				<AddUsers
					isOpen={addModalShow}
					setIsOpen={setAddModalShow}
					tableRef={tableRef}
					title='Add User'
				/>
			)}
			{editModalShow && editUserId != null && editUserId !== '' && (
				<EditUser
					isOpen={editModalShow}
					setIsOpen={closeEditModal}
					tableRef={tableRef}
					userId={editUserId}
					title='Edit User'
				/>
			)}
			{addBulkModalShow && (
				<BulkUpload
					isOpen={addBulkModalShow}
					setIsOpen={setAddBulkModalShow}
					tableRef={tableRef}
					title='Bulk Upload'
					api='/api/hr/users/import/'
					uploadApi='/api/hr/users/import/'
					templateApi='/api/hr/users/import-template/'
					instructionsApi='/api/hr/users/import-instructions/'
					instructionsFileName='User-Import-Instructions.txt'
					fileName='Users-Import-Template.xlsx'

				/>
			)}

			<PageWrapper title='Company Users'>
				<SubHeader>
					<SubHeaderLeft>
						<CardTitle tag='div' className='h5'>
							Company Users
						</CardTitle>

					</SubHeaderLeft>
					<SubHeaderRight>
						<ButtonWithPopover
							addModalShow={setAddModalShow}
							addBulkModalShow={setAddBulkModalShow}
							buttonName='Add User'
						/>
					</SubHeaderRight>
				</SubHeader>
				<Card stretch>
					<CardHeader borderSize={1}>
						<CardLabel icon='' iconColor='info'>
							<CardTitle tag='div' className='h5' ><p /></CardTitle>
						</CardLabel>
						{/* <CardActions>
						  <ExportButton url={urlBackup} hiddenColumnsKey='' name='Users' />
						</CardActions> */}
					</CardHeader>
					<CardBody className='table-responsive'><p />
					{tenant && canSeeTenantFilter && <ButtonFiltter
							FilterStatus={FilterStatus}
							activeTab={activeTab}
							setActiveTab={setActiveTab}
							styles={{ top: '100px' }}
						/>}
						<UserManagementTableComponent
							tableRef={tableRef}
							editModalToggle={editModalToggle}
							urlBackup={urlBackup}
							//@ts-ignore
							tenant={tenant}
							activeTab={activeTab}
						/>
					</CardBody>
				</Card>
			</PageWrapper>
		</>
	);
};

export default Index;

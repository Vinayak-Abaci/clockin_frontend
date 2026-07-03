import React, { useRef, useState } from 'react';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../components/bootstrap/Card';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import AddButton from '../../../components/CustomComponent/Buttons/AddButton';
import AddPartnerModal from './AddPartnerModal';
import PartnersTable from './Table';


const Partners = () => {
	const tableRef = useRef(null);
	const urlBackup = useRef('');
	const [addModalShow, setAddModalShow] = useState(false);

	return (
		<>
			{addModalShow && (
				<AddPartnerModal
					isOpen={addModalShow}
					setIsOpen={setAddModalShow}
					tableRef={tableRef}
				/>
			)}
			<PageWrapper title='Partners'>
			<SubHeader>
				<SubHeaderLeft>
					<CardTitle tag='div' className='h5'>
						Partners
					</CardTitle>
				</SubHeaderLeft>
				<SubHeaderRight>
					<AddButton modalShow={setAddModalShow} name='Add Partner' />
				</SubHeaderRight>
			</SubHeader>
			<Card stretch>
				<CardHeader borderSize={1}>
					<CardLabel icon='' iconColor='info'>
						<CardTitle tag='div' className='h5'>
							<p />
						</CardTitle>
					</CardLabel>
				</CardHeader>
				<CardBody className='table-responsive'>
					<PartnersTable tableRef={tableRef} urlBackup={urlBackup} />
				</CardBody>
			</Card>
		</PageWrapper>
		</>
	);
};

export default Partners;

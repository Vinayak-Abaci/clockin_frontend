import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../../../components/bootstrap/Card';
import Page from '../../../../layout/Page/Page';
import BackButton from '../../../../components/CustomComponent/Buttons/BackButton';
import AbaciLoader from '../../../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../../../axiosInstance';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import PartnerDetails from './PartnerDetails';
import PartnerLicensesTable from './PartnerLicensesTable';

const PartnerDetailPage = () => {
	const { id } = useParams();
	const [partner, setPartner] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		if (!id) {
			setPartner(null);
			setLoading(false);
			return undefined;
		}

		let cancelled = false;
		setLoading(true);
		authAxios
			.get(`api/partners/${id}/`)
			.then((res) => {
				if (!cancelled) setPartner(res?.data ?? null);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotification(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const licenses = Array.isArray(partner?.licenses) ? partner.licenses : [];

	return (
		<PageWrapper title='Partner details'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h6'>
						{String(partner?.name || 'Partner Details')}
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid' className='position-relative'>
				{loading && (
					<div
						className='d-flex justify-content-center align-items-center py-5'
						style={{ minHeight: '40vh' }}>
						<AbaciLoader />
					</div>
				)}
				{!loading && (
					<div className='row g-4'>
						<div className='col-12'>
							<PartnerDetails partner={partner} />
						</div>
						<div className='col-12'>
							<PartnerLicensesTable licenses={licenses} />
						</div>
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export default PartnerDetailPage;

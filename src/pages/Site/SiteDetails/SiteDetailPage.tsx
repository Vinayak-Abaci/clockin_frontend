import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../../layout/SubHeader/SubHeader';
import { CardTitle } from '../../../components/bootstrap/Card';
import Page from '../../../layout/Page/Page';
import BackButton from '../../../components/CustomComponent/Buttons/BackButton';
import ScheduleDetailSkeleton from '../../../components/CustomComponent/Skeleton/ScheduleDetailSkeleton';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import SiteAttendanceSection from '../SiteDetails/SiteAttendanceSection';

const SiteDetailPage = () => {
	const { id } = useParams();
	const [site, setSite] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	const fetchSite = useCallback(() => {
		if (!id) {
			setSite(null);
			setLoading(false);
			return undefined;
		}

		let cancelled = false;
		setLoading(true);
		authAxios
			.get(`api/hr/sites/${id}/`)
			.then((res) => {
				if (!cancelled) setSite(res?.data ?? null);
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
	}, [id]);

	useEffect(() => {
		const cleanup = fetchSite();
		return cleanup;
	}, [fetchSite]);

	const siteName = site?.name != null ? String(site.name) : '';

	return (
		<PageWrapper title='Site details'>
			<SubHeader>
				<SubHeaderLeft>
					<BackButton />
					<SubheaderSeparator />
					<CardTitle tag='div' className='h6'>
						Site Management
					</CardTitle>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid' className='position-relative'>
				{loading && <ScheduleDetailSkeleton />}
				<div className={loading ? 'd-none' : undefined}>
					<div className='row'>
						{id ? (
							<div className='col-12 mb-4'>
								<SiteAttendanceSection siteId={id} site={site} siteName={siteName} />
							</div>
						) : null}
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default SiteDetailPage;

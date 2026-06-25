import React, { useEffect, useState } from 'react';
import Card, {
	CardActions,
	CardBody,
	CardFooter,
	CardFooterRight,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import Badge from '../../components/bootstrap/Badge';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import Moments from '../../helpers/Moment';
import StatusBadge from '../../components/CustomComponent/StatusBadge';

type LicenseDetails = {
	plan_name?: string;
	status?: string;
	is_trial?: boolean;
	max_users?: number;
	start_date?: string;
	expiry_date?: string;
};

const DetailValue = ({ children }: { children?: React.ReactNode }) => (
	<div
		className='fw-semibold'
		style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
		{children != null && children !== '' ? children : '—'}
	</div>
);

const resolveProfileLicense = (data: unknown): LicenseDetails | null => {
	if (!data || typeof data !== 'object') return null;

	const record = data as Record<string, unknown>;
	const user = record.user as Record<string, unknown> | undefined;
	const licenseInfo = user?.license_info ?? record.license_info;

	if (licenseInfo && typeof licenseInfo === 'object' && Object.keys(licenseInfo).length > 0) {
		return licenseInfo as LicenseDetails;
	}

	return null;
};

const ProfileLicenseCard = () => {
	const [license, setLicense] = useState<LicenseDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		authAxios
			.get('api/users/profile/')
			.then((res) => {
				if (!cancelled) setLicense(resolveProfileLicense(res?.data));
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
	}, []);

	if (loading || !license) return null;

	return (
		<Card className='prevent-userselect shadow-3d-info'>
			<CardHeader borderSize={1}>
				<CardLabel icon='CardMembership' iconColor='warning'>
					<CardTitle tag='div' className='h3'>
						License Details
					</CardTitle>
				</CardLabel>
				{license.status ? (
					<CardActions>
						<StatusBadge status={license.status} />
					</CardActions>
				) : null}
			</CardHeader>
			<CardBody>
				<div className='row border-bottom pb-1 mx-0'>
					<div className='col-4'>
						<FormGroup label='Plan'>
							<DetailValue>{license.plan_name}</DetailValue>
						</FormGroup>
					</div>
					<div className='col-4'>
						<FormGroup label='Max Users'>
							<DetailValue>{license.max_users}</DetailValue>
						</FormGroup>
					</div>
					<div className='col-4' />
				</div>
				<div className='row mx-0'>
					<div className='col-4'>
						<FormGroup label='Trial' className='mt-4'>
							<DetailValue>
								<Badge color={license.is_trial ? 'info' : 'secondary'} isLight>
									{license.is_trial ? 'Yes' : 'No'}
								</Badge>
							</DetailValue>
						</FormGroup>
					</div>
					<div className='col-4'>
						<FormGroup label='Start Date' className='mt-4'>
							<DetailValue>
								{license.start_date ? Moments(license.start_date, 'date') : undefined}
							</DetailValue>
						</FormGroup>
					</div>
					<div className='col-4'>
						<FormGroup label='Expiry Date' className='mt-4'>
							<DetailValue>
								{license.expiry_date ? Moments(license.expiry_date, 'date') : undefined}
							</DetailValue>
						</FormGroup>
					</div>
				</div>
			</CardBody>
			<CardFooter>
				<CardFooterRight>
					<div  aria-hidden />
				</CardFooterRight>
			</CardFooter>
		</Card>
	);
};

export default ProfileLicenseCard;

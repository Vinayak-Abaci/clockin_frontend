import React, { useState, useEffect, useMemo, useCallback } from 'react';
import classNames from 'classnames';
import { useParams } from 'react-router-dom';
import { authAxios } from '../../../../axiosInstance';
import Card, { CardBody } from '../../../bootstrap/Card';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import { userTypesToCapital } from '../../../../helpers/constants';
import { resolveUserAvatarSource } from '../../../../helpers/functions';
import UserDetailAvatar from './UserDetailAvatar';

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
	<div className='col-xl-4 col-md-6 mb-3'>
		<div
			className='text-muted small text-uppercase fw-semibold'
			style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>
			{label}
		</div>
		<div className='fs-6 fw-semibold'>{value != null && value !== '' ? value : '—'}</div>
	</div>
);

const formatUserType = (user: any) => {
	const t = user?.user_type;
	if (t == null) return '';
	if (typeof t === 'object' && t?.name) {
		return userTypesToCapital[t.name as keyof typeof userTypesToCapital] || String(t.name);
	}
	if (t === 1) return 'Company Admin';
	if (t === 2) return 'Company User';
	return String(t);
};

const UserDetails = ({
	userId,
	onLoadComplete,
	fillHeight = false,
}: {
	userId?: string;
	onLoadComplete?: () => void;
	fillHeight?: boolean;
}) => {
	const { id } = useParams();
	const resolvedUserId = userId || id;
	const [user, setUser] = useState<any>(null);
	const [isUserLoading, setIsUserLoading] = useState(true);
	const { showErrorNotification } = useToasterNotification();

	const avatarSource = resolveUserAvatarSource(user);

	const refreshUser = useCallback(() => {
		if (!resolvedUserId) return;
		authAxios
			.get(`/api/hr/accounts/${resolvedUserId}/`)
			.then((response) => setUser(response?.data || null))
			.catch((error) => showErrorNotification(error));
	}, [resolvedUserId, showErrorNotification]);

	const ud = user?.user_data || {};
	const rel = user?.active_relations?.[0];

	const displayName = useMemo(() => {
		if (!user) return '';
		const name = `${user?.first_name || ud?.first_name || ''} ${user?.last_name || ud?.last_name || ''}`.trim();
		return user?.preferred_name || name || user?.email || '';
	}, [user, ud]);

	useEffect(() => {
		if (!resolvedUserId) {
			setIsUserLoading(false);
			setUser(null);
			onLoadComplete?.();
			return undefined;
		}
		let cancelled = false;
		setIsUserLoading(true);
		authAxios
			.get(`/api/hr/accounts/${resolvedUserId}/`)
			.then((response) => {
				if (!cancelled) setUser(response?.data || null);
			})
			.catch((error) => {
				if (!cancelled) showErrorNotification(error);
			})
			.finally(() => {
				if (!cancelled) {
					setIsUserLoading(false);
					onLoadComplete?.();
				}
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resolvedUserId]);

	if (isUserLoading) {
		return null;
	}

	return (
		<Card
			className={classNames('w-100', fillHeight && 'h-100 d-flex flex-column')}
			stretch={fillHeight}>
			<CardBody className={fillHeight ? 'flex-grow-1' : undefined}>
					<div className='row g-4 align-items-center mb-4'>
						<div className='col-auto'>
							{resolvedUserId && (
								<UserDetailAvatar
									userId={resolvedUserId}
									avatarSource={avatarSource}
									onUpdated={refreshUser}
									size={96}
								/>
							)}
						</div>
						<div className='col'>
							<div className='h4 mb-1 fs-4 fw-semibold text-warning'>{displayName || '—'}</div>
							<div className='text-muted fs-6 fw-semibold'>{user?.email || '—'}</div>
						</div>
					</div>
					<div className='row'>
						<DetailRow label='First name' value={user?.first_name || ud?.first_name} />
						<DetailRow label='Last name' value={user?.last_name || ud?.last_name} />
						<DetailRow label='Email' value={user?.email} />
						<DetailRow label='Gender' value={user?.gender} />
						<DetailRow label='Date of birth' value={user?.dob} />
						{/* <DetailRow label='Address' value={user?.address} />
						<DetailRow label='State' value={user?.state} />
						<DetailRow label='City' value={user?.city} />
						<DetailRow label='Pincode' value={user?.pincode} />
						<DetailRow label='Country' value={user?.country} /> */}
						<DetailRow label='Personal contact' value={user?.personal_contact_number} />
						<DetailRow label='Office contact' value={user?.office_contact_number || ud?.user_contact_phone} />
						<DetailRow label='User type' value={formatUserType(user)} />
						{/* <DetailRow label='Access category' value={user?.access_category?.category} /> */}
						<DetailRow
						label='Group'
						value={
							user?.groups?.map((group: { name: string }) => group.name).join(', ') ||
							rel?.group_name ||
							'—'
						}
					/>
						<DetailRow label='Site' value={user?.site?.name || rel?.site_name} />
						<DetailRow label='Designation' value={rel?.designation} />
						{/* <DetailRow label='Status' value={user?.status} /> */}
						<DetailRow
						label="Reporting manager"
						value={`${user?.reporting_manager?.first_name || ''} ${user?.reporting_manager?.last_name || ''}`.trim() || '—'}
					/>
					</div>
				</CardBody>
		</Card>
	);
};

export default UserDetails;

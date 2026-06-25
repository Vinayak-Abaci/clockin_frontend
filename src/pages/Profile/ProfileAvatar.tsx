import React, { useContext, useEffect, useState } from 'react';
import { Spinner } from 'reactstrap';
import Card, {
	CardBody,
	CardTitle,
} from '../../components/bootstrap/Card';
import Profile from "../../assets/img/Avatar.svg"
import AuthContext from '../../contexts/authContext';
import ImageCropper from '../../helpers/imageCropper';
import Icon from '../../components/icon/Icon';
import { authAxiosFileUpload } from '../../axiosInstance';
import base64toFile from '../../helpers/base64toFile';
import useToasterNotification from '../../hooks/useToasterNotification';
import useUserAvatarSrc from '../../hooks/useUserAvatarSrc';
import { resolveUserAvatarSource } from '../../helpers/functions';

const AVATAR_SIZE = 200;

const ProfileAvatar = () => {
	const [image, setImage] = useState(null)
	const [waitingForAxios, setWaitingForAxios] = useState(false)
	const [imgError, setImgError] = useState(false)
	const { userData, setUserData } = useContext(AuthContext);
	const { showErrorNotification } = useToasterNotification()
	const updateAvatar = (croppedBase64: string) => {
		setImage(croppedBase64);
		setWaitingForAxios(true);

		const formData = new FormData();
		const blob = base64toFile(croppedBase64);
		const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
		formData.append('avatar', file);

		authAxiosFileUpload
			.patch('api/users/profile/', formData)
			.then((res) => {
				setWaitingForAxios(false);
				setImage(null);
				const profileUser = res.data?.user ?? res.data;
				setUserData((prev: any) => ({
					...prev,
					...(profileUser && typeof profileUser === 'object' ? profileUser : {}),
					is_platform_admin:
						res.data?.is_platform_admin ??
						profileUser?.is_platform_admin ??
						prev?.is_platform_admin,
				}));
			})
			.catch((error) => {
				setWaitingForAxios(false);
				setImage(null);
				showErrorNotification(error);
			});
	};
	const handleButtonClick = () => {
		if (!waitingForAxios) {
			const input = document.getElementById("customFile");
			if (input !== null) {
				input.click();
			}
		}

	};
	const resolvedAvatarSrc = useUserAvatarSrc(userData, Profile);
	const avatarSrc = image || resolvedAvatarSrc;
	const hasUploadedAvatar = Boolean(image || resolveUserAvatarSource(userData));
	const showPlaceholder = !hasUploadedAvatar || imgError;
	const displaySrc = showPlaceholder ? Profile : avatarSrc;

	useEffect(() => {
		setImgError(false);
	}, [userData?.avatar, userData?.avatar_url, image]);

	return (
		<Card className='shadow-3d-info prevent-userselect'>
			<div style={{ display: "none" }} >
				<ImageCropper
					isProfile
					updateCompanyLogo={updateAvatar}
					isFromDasboard
				/>
			</div>
			<CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "40px" }}>
				<div className='text-center position-relative mb-4' >
					{/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
					<div onClick={() => handleButtonClick()} className='circle-file-upload-button'>
						{
							waitingForAxios ?
								<Spinner size='sm' color='white' />
								:
								<Icon icon='Edit' color='light' size='lg' />
						}
					</div>

					<div
						className='rounded-circle overflow-hidden bg-l25-secondary border border-2 border-light'
						style={{
							width: AVATAR_SIZE,
							height: AVATAR_SIZE,
							minWidth: AVATAR_SIZE,
							minHeight: AVATAR_SIZE,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}>
						<img
							src={displaySrc}
							alt='Profile avatar'
							width={AVATAR_SIZE}
							height={AVATAR_SIZE}
							onError={() => setImgError(true)}
							style={{
								width: '100%',
								height: '100%',
								objectFit: showPlaceholder ? 'contain' : 'cover',
								padding: showPlaceholder ? '22%' : 0,
							}}
						/>
					</div>
				</div>
				{/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}

				<CardTitle tag='div' className='h2'>
					{userData?.first_name + ' ' + userData?.last_name || '----'}
				</CardTitle>
				<h5>{userData?.email || '----'}</h5>


			</CardBody>

		</Card>
	);
};

export default ProfileAvatar;
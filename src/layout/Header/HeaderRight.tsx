import React,{ FC, ReactNode, useContext, useLayoutEffect, useState } from 'react';
import AuthContext from '../../contexts/authContext';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useTour } from '@reactour/tour';
import Button, { IButtonProps } from '../../components/bootstrap/Button';
import { HeaderRight } from './Header';
import Icon from '../../components/icon/Icon';
import ThemeContext from '../../contexts/themeContext';
import useDarkMode from '../../hooks/useDarkMode';
import Popovers from '../../components/bootstrap/Popovers';
import Notifications from './Notifications';
import DateAndTimeComponent from '../../components/MasterComponents/HeaderComponents/DateandTime';
import ToggleButton from './ToggleButton';
import { canUseRoleToggle } from '../../helpers/roleToggleUtils';

interface IMainHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}
const MainHeaderRight: FC<IMainHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	const { userData } = useContext(AuthContext);
	const NotificationList = useSelector((state:any) => state.NotificationSlice.notifications);
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	const [offcanvasStatus, setOffcanvasStatus] = useState(false);
	const { i18n } = useTranslation();
	/**
	 * Language attribute
	 */
	useLayoutEffect(() => {
		document.documentElement.setAttribute('lang', i18n.language.substring(0, 2));
	});

	const { setIsOpen } = useTour();

	return (
		<HeaderRight>
			<div className='row g-3 align-items-center'>
				{beforeChildren}
				<div className='col-auto'>
				<DateAndTimeComponent />
			</div>
			{canUseRoleToggle(userData?.user_type) && (
				<div className='col-auto'>
					<ToggleButton />
				</div>
			)}
				
				
				{/* Dark Mode */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Dark / Light mode'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							onClick={() => setDarkModeStatus(!darkModeStatus)}
							className='btn-only-icon'
							data-tour='dark-mode'
							aria-label='Toggle dark mode'>
							<Icon
								icon={darkModeStatus ? 'DarkMode' : 'LightMode'}
								color={darkModeStatus ? 'info' : 'warning'}
								className='btn-icon'
							/>
						</Button>
					</Popovers>
				</div>

				{/*	Full Screen */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Fullscreen'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
							onClick={() => setFullScreenStatus(!fullScreenStatus)}
							aria-label='Toggle fullscreen'
						/>
					</Popovers>
				</div>

				
				{/*	Notifications */}
				{/* <div className='col-auto'>
				<div className='col-auto position-relative'>
                    {NotificationList.length!==0&&
						<Icon
							icon='Circle'
							className='animate__animated animate__heartBeat animate__infinite animate__slower position-absolute start-65 text-danger notification_icon_styles'
							/>
					}
					<Button
						eslint-disable-next-line react/jsx-props-no-spreading
						{...styledBtn}
						icon='Notifications'
						onClick={() => setOffcanvasStatus(true)}
						aria-label='Notifications'
						/>
					
				</div>
				</div> */}
				{afterChildren}
			</div>
           {/* {offcanvasStatus&&
		   <Notifications 
		   setIsOpen={setOffcanvasStatus} 
			isOpen={offcanvasStatus}/>
		   } */}
           
		</HeaderRight>
	);
};
MainHeaderRight.propTypes = {
	beforeChildren: PropTypes.node,
	afterChildren: PropTypes.node,
};
MainHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default MainHeaderRight;

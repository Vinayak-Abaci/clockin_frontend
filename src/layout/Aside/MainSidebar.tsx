import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import Brand from '../Brand/Brand';
import Navigation, { NavigationLine } from '../Navigation/Navigation';
import User from '../User/User';
import ThemeContext from '../../contexts/themeContext';
import Aside, { AsideBody, AsideFoot, AsideHead } from './Aside';
import AuthContext from '../../contexts/authContext';
import { SelfRoutes, PlatformAdminRoutes, PartnerRoutes, roleWiseRoutes } from '../../routes/RoutesMenu';
import { isPlatformPartner, isPlatformAdmin, isSelfEquivalentMode, resolveUserTypeString } from '../../helpers/roleToggleUtils';

const MainSidebar = () => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const mode = accountToggle || 'Admin';
	const role = resolveUserTypeString(userData?.user_type) || 'Admin';

	const navigationMenu = isPlatformAdmin(userData)
		? PlatformAdminRoutes
		: isPlatformPartner(userData)
			? PartnerRoutes
			: isSelfEquivalentMode(userData?.user_type, mode)
				? SelfRoutes
				: roleWiseRoutes[role] || roleWiseRoutes.Admin || {};

	return (
		<Aside >
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} isDark={false} />
			</AsideHead>
			<AsideBody>					
		    <Navigation key={mode === 'Self' ? 'self' : role} menu={navigationMenu} id='aside-dashboard'  className='user-select-none' />
			<NavigationLine />
			
			</AsideBody>
			 {/* <div style={{paddingLeft:'20px',marginBottom:'10px'}}>click to support</div> */}
			<AsideFoot>
				
				<User />
			</AsideFoot>
		</Aside>
	);
};

export default MainSidebar;

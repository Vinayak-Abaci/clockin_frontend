import React, { useContext, useEffect } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/icon/Icon';
import AuthContext from '../../contexts/authContext';
import {
	canUseRoleToggle,
	getPrivilegedToggleLabel,
	getUserHomePath,
} from '../../helpers/roleToggleUtils';
import { updateToggleButton } from '../../store/auth';

const USER_SELF_HOME = getUserHomePath();
const adminLandingByRole: Record<string, string> = {
	Admin: '/',
	Manager: '/',
	HR: '/',
	user: '/',
};

const ToggleButton = () => {
	const { userData } = useContext(AuthContext);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const togglerButton = useSelector((state: any) => state.authSlice.account_toggle_button);
	const mode = togglerButton || 'Admin';
	const role = getPrivilegedToggleLabel(userData);

	const showRoleToggle = canUseRoleToggle(userData);

	useEffect(() => {
		if (!showRoleToggle) return;
		if (mode !== 'Self' && mode !== 'Admin') {
			dispatch(updateToggleButton('Admin'));
		}
	}, [dispatch, showRoleToggle, mode]);

	if (!showRoleToggle) {
		return null;
	}

	const handleSelectToggle = (button: 'Self' | 'Admin', route: string) => {
		dispatch(updateToggleButton(button));
		navigate(route);
	};

	const isSelf = mode === 'Self';

	return (
		<div className='role-switch' role='radiogroup' aria-label='Switch between self service and admin console'>
			<div className='role-switch-track header-toolbar-pill'>
				<div
					className={classNames('role-switch-thumb', { 'role-switch-thumb--admin': !isSelf })}
					aria-hidden
				/>
				<button
					type='button'
					className={classNames('role-switch-option', { 'is-active': isSelf })}
					aria-checked={isSelf}
					role='radio'
					onClick={() => handleSelectToggle('Self', USER_SELF_HOME)}>
					<span className={classNames('role-switch-option-icon', { 'is-active': isSelf })}>
						<Icon icon='AccountCircle' size='lg' />
					</span>
					<span className='role-switch-option-label'>Self</span>
				</button>
				<button
					type='button'
					className={classNames('role-switch-option', { 'is-active': !isSelf })}
					aria-checked={!isSelf}
					role='radio'
					onClick={() => handleSelectToggle('Admin', adminLandingByRole[role] || '/')}>
					<span className={classNames('role-switch-option-icon', { 'is-active': !isSelf })}>
						<Icon icon='AdminPanelSettings' size='lg' />
					</span>
					<span className='role-switch-option-label'>{role}</span>
				</button>
			</div>
		</div>
	);
};

export default ToggleButton;

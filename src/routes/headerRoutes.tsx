import React from 'react';
import { RouteProps } from 'react-router-dom';
import {
	pagesNotInSideBar,
} from './RoutesMenu';
import MainHeader from '../layout/Header/MainHeader';

const headers: RouteProps[] = [
	{ path: pagesNotInSideBar.login.path, element: null },
	{ path: pagesNotInSideBar.adminLogin.path, element: null },
	{ path: pagesNotInSideBar.signup.path, element: null },
	{ path: pagesNotInSideBar.Register.path, element: null },
	{ path: pagesNotInSideBar.ForgotPassword.path, element: null },
	{ path: pagesNotInSideBar.SetPassword.path, element: null },
	{ path: pagesNotInSideBar.PrivacyPolicy.path, element: null },
	{ path: pagesNotInSideBar.TermsAndConditions.path, element: null },
	{
		path: `*`,
		element: <MainHeader />,
	},
	{ path: '/public/error', element: null },
	
];

export default headers;

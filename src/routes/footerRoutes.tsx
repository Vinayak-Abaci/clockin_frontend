import React from 'react';
import { RouteProps } from 'react-router-dom';
import {  pagesNotInSideBar } from './RoutesMenu';
import DefaultFooter from '../layout/Footer/DefaultFooter';

const footers: RouteProps[] = [
	{ path: pagesNotInSideBar.login.path, element: null },
	{ path: pagesNotInSideBar.adminLogin.path, element: null },
	{ path: pagesNotInSideBar.signup.path, element: null },
	{ path: pagesNotInSideBar.ForgotPassword.path, element: null },
	{ path: pagesNotInSideBar.SetPassword.path, element: null },
	{ path: pagesNotInSideBar.Register.path, element: null },
	{ path: pagesNotInSideBar.PrivacyPolicy.path, element: null },
	{ path: pagesNotInSideBar.TermsAndConditions.path, element: null },
	{ path: '*', element: <DefaultFooter /> },
	{ path: '/public/error', element: null },
];

export default footers;

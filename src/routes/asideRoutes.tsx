import React,{ RouteProps } from 'react-router-dom';
import {  pagesNotInSideBar } from './RoutesMenu';
import MainSidebar from '../layout/Aside/MainSidebar';

const asides: RouteProps[] = [
	{ path: pagesNotInSideBar.login.path, element: null },
	{ path: pagesNotInSideBar.adminLogin.path, element: null },
	{ path: pagesNotInSideBar.partnerLogin.path, element: null },
	{ path: pagesNotInSideBar.signup.path, element: null },
	{ path: pagesNotInSideBar.Register.path, element: null },
	{ path: pagesNotInSideBar.ForgotPassword.path, element: null },
	{ path: pagesNotInSideBar.SetPassword.path, element: null },
	{ path: '*', element: <MainSidebar /> },
	{ path: '/public/error', element: null },
	{ path: pagesNotInSideBar.PrivacyPolicy.path, element: null },
	{ path: pagesNotInSideBar.TermsAndConditions.path, element: null },

];

export default asides;

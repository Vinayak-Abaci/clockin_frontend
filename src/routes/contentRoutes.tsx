import React, { lazy } from 'react';
import {
	allRoutesObject,
	pagesNotInSideBar,
} from './RoutesMenu';

const MAINROUTE={
	Dashboard: lazy(() => import('../pages/Dashboard/Dashboard')),
	Profile: lazy(() => import('../pages/Profile/Index')),
	Users: lazy(() => import('../pages/UserManagement/index')),
	site: lazy(() => import('../pages/Site/index')),
	SpecialPeriod: lazy(() => import('../pages/SpecialDays/index')),
	UserGroups: lazy(() => import('../pages/UserGroups/index')),
	GroupDetail: lazy(() => import('../pages/UserGroups/GroupDetailPage')),
	Schedule: lazy(() => import('../pages/Schedule/index')),
	ScheduleDetail: lazy(() => import('../pages/Schedule/ScheduleDetailPage')),
	Shift: lazy(() => import('../pages/Shift/index')),
	Doors: lazy(() => import('../pages/Doors/index')),
	ScheduleComponentDemo: lazy(() => import('../pages/ScheduleComponentDemo/index')),
	UserDetails: lazy(() => import('../pages/UserManagement/UserManagementPage')),
	LeaveRequests: lazy(() => import('../pages/LeaveManagement/LeaveRequestsPage')),
	LeaveTypes: lazy(() => import('../pages/LeaveManagement/LeaveTypesPage')),
	LeaveManagement: lazy(() => import('../pages/LeaveManagement/index')),
	Attendance: lazy(() => import('../pages/Attendance/index')),
	UserSchedule: lazy(() => import('../pages/UserSchedule')),
	EventLog: lazy(() => import('../pages/EventLog/index')),
	RoleManagement: lazy(() => import('../pages/RoleManagement/index')),
	Settings: lazy(() => import('../pages/Settings/index')),
	Registrations: lazy(() => import('../pages/PlatformAdmin/Registrations/index')),
	Customers: lazy(() => import('../pages/PlatformAdmin/Customers/index')),
	CustomerDetail: lazy(() => import('../pages/PlatformAdmin/Customers/CustomerDetails/CustomerDetailPage')),
	Licenses: lazy(() => import('../pages/PlatformAdmin/Licenses/index')),
	Partners: lazy(() => import('../pages/PlatformAdmin/Partners/index')),
	PartnerDetail: lazy(() => import('../pages/PlatformAdmin/Partners/PartnerDetails/PartnerDetailPage')),
}
interface CustomRouteConfig {
	path: string;
	element: React.ReactNode;
	allowedTo?: string[]; 
}

const ADMIN_CONSOLE_ROLES = ['Admin', 'Manager', 'HR'];
const SELF_MODE_USER_ROLE = 'user';
const SELF_MODE_ROUTES = [...ADMIN_CONSOLE_ROLES, SELF_MODE_USER_ROLE];
const PLATFORM_ADMIN_ROLES = ['platform_admin'];
const PARTNER_ROLES = ['partner'];
const ALL_AUTHENTICATED_ROLES = [
	...SELF_MODE_ROUTES,
	...PLATFORM_ADMIN_ROLES,
	...PARTNER_ROLES,
];

const RouteConfig: CustomRouteConfig[] = [
	{
		path: allRoutesObject.dashboard.path,
		element: <MAINROUTE.Dashboard />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: pagesNotInSideBar.Profile.path,
		element: <MAINROUTE.Profile/>,
		allowedTo: ALL_AUTHENTICATED_ROLES,
	},
	{
		path: allRoutesObject.UserManagement.path,
		element: <MAINROUTE.Users/>,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.site.path,
		element: <MAINROUTE.site/>,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: pagesNotInSideBar.GroupTemplateDetail.path,
		element: <MAINROUTE.GroupDetail />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.UserGroups.path,
		element: <MAINROUTE.UserGroups/>,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: pagesNotInSideBar.ScheduleTemplateDetail.path,
		element: <MAINROUTE.ScheduleDetail />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.Schedule.path,
		element: <MAINROUTE.Schedule />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.Shift.path,
		element: <MAINROUTE.Shift />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.Doors.path,
		element: <MAINROUTE.Doors />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.ScheduleComponentDemo.path,
		element: <MAINROUTE.ScheduleComponentDemo />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: pagesNotInSideBar.UsertDetails.path,
		element: <MAINROUTE.UserDetails />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.LeaveRequests.path,
		element: <MAINROUTE.LeaveRequests />,
		allowedTo: SELF_MODE_ROUTES,
	},
	{
		path: allRoutesObject.LeaveTypes.path,
		element: <MAINROUTE.LeaveTypes />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.LeaveManagement.path,
		element: <MAINROUTE.LeaveManagement />,
		allowedTo: SELF_MODE_ROUTES,
	},
	{
		path: allRoutesObject.Attendance.path,
		element: <MAINROUTE.Attendance />,
		allowedTo: SELF_MODE_ROUTES,
	},
	{
		path: allRoutesObject.UserSchedule.path,
		element: <MAINROUTE.UserSchedule />,
		allowedTo: SELF_MODE_ROUTES,
	},
	{
		path: allRoutesObject.SpecialPeriod.path,
		element: <MAINROUTE.SpecialPeriod />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.EventLog.path,
		element: <MAINROUTE.EventLog />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.RoleManagement.path,
		element: <MAINROUTE.RoleManagement />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.Settings.path,
		element: <MAINROUTE.Settings />,
		allowedTo: ADMIN_CONSOLE_ROLES,
	},
	{
		path: allRoutesObject.Registrations.path,
		element: <MAINROUTE.Registrations />,
		allowedTo: PLATFORM_ADMIN_ROLES,
	},
	{
		path: allRoutesObject.Customers.path,
		element: <MAINROUTE.Customers />,
		allowedTo: [...PLATFORM_ADMIN_ROLES, ...PARTNER_ROLES],
	},
	{
		path: pagesNotInSideBar.CustomerDetails.path,
		element: <MAINROUTE.CustomerDetail />,
		allowedTo: [...PLATFORM_ADMIN_ROLES, ...PARTNER_ROLES],
	},
	{
		path: allRoutesObject.Licenses.path,
		element: <MAINROUTE.Licenses />,
		allowedTo: [...PLATFORM_ADMIN_ROLES, ...PARTNER_ROLES],
	},
	{
		path: allRoutesObject.Partners.path,
		element: <MAINROUTE.Partners />,
		allowedTo: PLATFORM_ADMIN_ROLES,
	},
	{
		path: pagesNotInSideBar.PartnerDetails.path,
		element: <MAINROUTE.PartnerDetail />,
		allowedTo: PLATFORM_ADMIN_ROLES,
	},
]






export default RouteConfig;

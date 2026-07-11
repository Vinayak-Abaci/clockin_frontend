export const allRoutesObject = {
	dashboard: {
		id: 'dashboard',
		path: '/',
	},

	UserManagement: {
		id: 'CompanyUsers',
		path: '/users',
	},
	site:{
		id: 'site',
		path: '/sites',
	
	},
	SpecialPeriod: {
		id: 'SpecialPeriod',
		path: '/special-period',
	},
	UserGroups: {
		id: 'UserGroups',
		path: '/groups',
	},
	Schedule: {
		id: 'Schedule',
		path: '/schedule',
	},
	Shift: {
		id: 'Shift',
		path: '/shift',
	},
	Doors: {
		id: 'Doors',
		path: '/doors',
	},
	// RoleManagement: {
	// 	id: 'RoleManagement',
	// 	path: '/roles',
	// },
	Registrations: {
		id: 'Registrations',
		path: '/registrations',
	},
	Customers: {
		id: 'Customers',
		path: '/customers',
	},
	Partners: {
		id: 'Partners',
		path: '/partners',
	},
	Licenses: {
		id: 'Licenses',
		path: '/licenses',
	},
	ScheduleComponentDemo: {
		id: 'ScheduleComponentDemo',
		path: '/schedule-component-demo',
	},
	LeaveRequests: {
		id: 'LeaveRequests',
		path: '/leave-requests',
	},
	AssetRequests: {
		id: 'AssetRequests',
		path: '/asset-requests',
	},
	WfhRequests: {
		id: 'WfhRequests',
		path: '/wfh-requests',
	},
	LeaveTypes: {
		id: 'LeaveTypes',
		path: '/leave-types',
	},
	/** @deprecated Use LeaveRequests.path — kept for redirects */
	LeaveManagement: {
		id: 'LeaveManagement',
		path: '/leave-management',
	},
	Attendance: {
		id: 'Attendance',
		path: '/attendance',
	},
	Settings: {
		id: 'Settings',
	 	path: 'settings',
    	subMenu: {
			GeneralSettings: {
				id: 'GeneralSettings',
				path: 'settings/general-settings',
			
		},
		Buildings: {
			id: 'Buildings',
			path: 'settings/buildings',
		},
		Gates: {
			id: 'Gates',
			path: 'settings/gates',
		},
		Controller: {
			id: 'Controller',
			path: 'settings/controller',
			

		},
		EditLog: {
			id: 'EditLog',
			path: 'settings/editlog',
		
	}
	
	}},
	UserSchedule: {
		id: 'UserSchedule',
		text: 'Schedule',
		path: '/user/schedule',
		icon: 'PendingActions',
	},
	EventLog: {
		id: 'EventLog',
		path: '/event-log',
		icon: 'Description',
	},
	settings: {
		id: 'settings',
		path: 'settings',
		icon: 'Settings',
	},

}






export const CompanyAdminRoutes = {
	
	dashboard: {
		id: 'dashboard',
		text: 'Dashboard',
		path: '/',
		icon: 'Dashboard',
		subMenu: null,
	},
	site:{
		id: 'site',
		text: 'Site',
		icon: 'Apartment',
		path: '/sites',
	},
	userManagment: {
		id: 'CompanyUsers',
		text: 'Users',
		path: '/users',
		icon: 'Person',
	},
	UserGroups: {
		id: 'UserGroups',
		text: 'Groups',
		path: '/groups',
		icon: 'Group',
	},
	Schedule: {
		id: 'Schedule',
		text: 'Schedule',
		path: '/schedule',
		icon: 'PendingActions',
	},
	SpecialPeriod: {
		id: 'SpecialPeriod',
		text: 'Special Period',
		path: '/special-period',
		icon: 'Event',
	},
	Shift: {
		id: 'Shift',
		text: 'Shift',
		path: '/shift',
		icon: 'AccessTime',
	},
	Doors: {
		id: 'Doors',
		text: 'Doors',
		path: '/doors',
		icon: 'DoorFront',
	},
	// RoleManagement: {
	// 	id: 'RoleManagement',
	// 	text: 'Roles',
	// 	path: '/roles',
	// 	icon: 'Badge',
	// },
	LeaveRequests: {
		id: 'LeaveRequests',
		text: 'Leave Requests',
		path: '/leave-requests',
		icon: 'Event',
	},
	AssetRequests: {
		id: 'AssetRequests',
		text: 'Asset Requests',
		path: '/asset-requests',
		icon: 'Inventory',
	},
	WfhRequests: {
		id: 'WfhRequests',
		text: 'WFH Requests',
		path: '/wfh-requests',
		icon: 'HomeWork',
	},
	LeaveTypes: {
		id: 'LeaveTypes',
		text: 'Leave Types',
		path: '/leave-types',
		icon: 'EventNote',
	},
	Attendance: {
		id: 'Attendance',
		text: 'Attendance',
		path: '/attendance',
		icon: 'Event',
	},
	EventLog: {
		id: 'EventLog',
		text: 'Event Log',
		path: '/event-log',
		icon: 'Description',
	},


	Settings: {
		id: 'Settings',
		text: 'Settings',
		path: 'settings',
		icon: 'Settings',
	
		}
			
		
	// },
	


	// userDashboard: {
	// 	id: 'userDashboard',
	// 	text: 'User Dashboard',
	// 	path: '/dashboard',
	// 	icon: 'Dashboard',
	// 	subMenu: null,
	// },

};




export const UserRoutes = {
	LeaveRequests: {
		id: 'LeaveRequests',
		text: 'Leave Requests',
		path: '/leave-requests',
		icon: 'Event',
	},
	AssetRequests: {
		id: 'AssetRequests',
		text: 'Asset Requests',
		path: '/asset-requests',
		icon: 'Inventory',
	},
	WfhRequests: {
		id: 'WfhRequests',
		text: 'WFH Requests',
		path: '/wfh-requests',
		icon: 'HomeWork',
	},
	Attendance: {
		id: 'Attendance',
		text: 'Attendance',
		path: '/attendance',
		icon: 'AccessTime',
	},
	UserSchedule: {
		id: 'UserSchedule',
		text: 'Schedule',
		path: '/user/schedule',
		icon: 'PendingActions',
	},
};

export const SelfRoutes = UserRoutes;

export const PlatformAdminRoutes = {
	Registrations: {
		id: 'Registrations',
		text: 'Registrations',
		path: '/registrations',
		icon: 'AppRegistration',
	},
	Customers: {
		id: 'Customers',
		text: 'Customers',
		path: '/customers',
		icon: 'Business',
	},
	Partners: {
		id: 'Partners',
		text: 'Partners',
		path: '/partners',
		icon: 'Groups',
	},
	Licenses: {
		id: 'Licenses',
		text: 'Licenses',
		path: '/licenses',
		icon: 'CardMembership',
	},
};

export const PartnerRoutes = {
	Customers: {
		id: 'Customers',
		text: 'Customers',
		path: '/customers',
		icon: 'Business',
	},
	Licenses: {
		id: 'Licenses',
		text: 'Licenses',
		path: '/licenses',
		icon: 'CardMembership',
	},
};

export const HRRoutes = CompanyAdminRoutes;
export const ManagerRoutes = CompanyAdminRoutes;


export const roleWiseRoutes: Record<string, any> = {
	Admin: CompanyAdminRoutes,
	Manager: ManagerRoutes,
	HR: HRRoutes,
	user: UserRoutes,
	User: UserRoutes,
	platform_admin: PlatformAdminRoutes,
	partner: PartnerRoutes,
};

	






export const pagesNotInSideBar = {
	VehicleDetails: {
		id: 'VehicleDetails',
		text: 'Vehicle Details',
		path: '/vehicles-details/:id',
		icon: '',
	},

	UsertDetails: {
		id: 'UserDetails',
		text: 'User Details',
		path: '/user-details/:id',
		icon: '',
	},
	ScheduleTemplateDetail: {
		id: 'ScheduleTemplateDetail',
		text: 'Schedule details',
		path: '/schedule-details/:id',
		icon: '',
	},
	SiteTemplateDetail: {
		id: 'SiteTemplateDetail',
		text: 'Site details',
		path: '/site-details/:id',
		icon: '',
	},
	GroupTemplateDetail: {
		id: 'GroupTemplateDetail',
		text: 'Group details',
		path: '/group-details/:id',
		icon: '',
	},
	CustomerDetails: {
		id: 'CustomerDetails',
		text: 'Customer Details',
		path: '/customer-details/:id',
		icon: '',
	},
	PartnerDetails: {
		id: 'PartnerDetails',
		text: 'Partner Details',
		path: '/partner-details/:id',
		icon: '',
	},

	Profile: {
		id: 'Profile',
		text: 'Profile',
		path: 'profile',
		icon: 'Login',
	},
	login: {
		id: 'login',
		text: 'Login',
		path: 'login',
		icon: 'Login',
	},
	adminLogin: {
		id: 'adminLogin',
		text: 'Admin Login',
		path: '/clockin-admin/login',
		icon: 'Login',
	},
	partnerLogin: {
		id: 'partnerLogin',
		text: 'Partner Login',
		path: '/clockin-partner/login',
		icon: 'Login',
	},
	signup: {
		id: 'signup',
		text: 'Sign Up',
		path: '/signup',
		icon: 'Login',
	},
	Contact: {
		id: 'Contact',
		text: 'Contact',
		path: '/contact',
		icon: '',
	},
	Register: {
		id: 'Register',
		text: 'Login',
		path: 'public/activation/:string',
		icon: 'Login',
	},
	ForgotPassword: {
		id: 'ForgotPassword',
		text: 'ForgotPassword',
		path: '/forgotpassword',
		icon: 'Login',
	},
	SetPassword: {
		id: 'SetPassword',
		text: 'Set Password',
		path: '/set-password',
		icon: 'Login',
	},


	PrivacyPolicy: {
		id: 'Privacy Policy',
		text: 'Privacy Policy',
		path: 'public/privacypolicy',
		icon: 'Login',
	},
	TermsAndConditions: {
		id: 'Terms & Conditions',
		text: 'Terms & Conditions',
		path: 'public/termsofuse',
		icon: '',
	},
	
	

}
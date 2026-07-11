import { configureStore } from '@reduxjs/toolkit';
import layoutSlice from './layout';
import authSlice from './auth';
import UserSlice from './user';
import FieldSlice from './fields';
import FeaturesSlice from './features';
import NotificationSlice from './notifications';
import DashboardSlice from './dashboard';
import VehicleSlice from './vehicles'


const store = configureStore({
	reducer: {
		layoutSlice,
		authSlice,
		UserSlice,
		FieldSlice,
		FeaturesSlice,
		NotificationSlice,
		DashboardSlice,
		VehicleSlice
	},
});

export default store;

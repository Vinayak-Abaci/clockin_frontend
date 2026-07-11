import React from 'react';
import { Route, Routes } from 'react-router-dom';
import contents from '../../routes/contentRoutes';
import ErrorPage from '../../pages/PublicPages/ErrorPage';
// import AddMessageTemplate from '../../pages/Settings/MessageTemplates/AddTemplate';
// import EditMessageTemplate from '../../pages/Settings/MessageTemplates/EditTemplate';
// import EventDetailsPage from '../../pages/Events/EventDetailsPage';
// const SiteDetailsPage = lazy(() => import('../../pages/Site/SiteDetailsPage'));
// import Registration from '../../pages/Auth/Registration';

const ContentRoutes = () => {
	return (
		<Routes>
			{contents.map((page) => (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<Route key={page.path} {...page} />
			))}
             <Route path='/public/error' element={<ErrorPage />}/>
		</Routes>
	);
};

export default ContentRoutes;

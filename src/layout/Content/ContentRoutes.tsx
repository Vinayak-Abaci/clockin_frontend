import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import Cookies from 'js-cookie';
import ProtectedRoute from './ProtectedRoute'; // Import ProtectedRoute
import ErrorPage from '../../pages/PublicPages/ErrorPage';
import Login from '../../pages/Auth/Login';
import AdminLogin from '../../pages/Auth/AdminLogin';
import Registration from '../../pages/Auth/Registration';
import ForgotPassword from '../../pages/Auth/ForgotPassword';
import SetPassword from '../../pages/Auth/SetPassword';
import Signup from '../../pages/Auth/Signup';
import AuthContext from '../../contexts/authContext';
import Unauthorized from '../../pages/PublicPages/Unauthorized';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import RouteConfig from '../../routes/contentRoutes';
import { getEffectiveUserTypeForRoutes, isPlatformAdmin, PLATFORM_ADMIN_HOME_PATH } from '../../helpers/roleToggleUtils';
import { getDefaultAuthPath } from '../../helpers/baseURL';

const isAuthenticatedUser = (userData: unknown) =>
	Boolean(
		userData !== null &&
			typeof userData === 'object' &&
			Object.keys(userData).length > 0 &&
			Cookies.get('token'),
	);


const ContentRoutes = () => {
	const { userData } = useContext(AuthContext);
	const accountToggle = useSelector((state: any) => state.authSlice?.account_toggle_button);
	const mode = accountToggle || 'Admin';
	const effectiveUserType = getEffectiveUserTypeForRoutes(userData?.user_type, mode, userData);
	const platformAdmin = isPlatformAdmin(userData);

	const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
      const path = window.location.pathname;
      const isPublicAuthPath =
        path.startsWith('/public') ||
        path === '/' ||
        path === '/login' ||
        path === '/clockin-admin/login' ||
        path === '/signup' ||
        path === '/forgotpassword' ||
        path === '/set-password';

      if (userData !== null || isPublicAuthPath) {
          setIsLoading(false);
      }
  }, [userData]);

  if (isLoading) {
    return <AbaciLoader />
  }

  const authenticated = isAuthenticatedUser(userData);

  return (
    <Routes>
      {!authenticated && (
        <Route path="/" element={<Navigate to={getDefaultAuthPath()} replace />} />
      )}
      <Route path="/login" element={<Login />} />
      <Route path="/clockin-admin/login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/public/activation/:string" element={<Registration />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/public/error" element={<ErrorPage />} />

      {/* Protected Routes */}
      {platformAdmin ? (
        <>
          {RouteConfig.filter(
            (page) => page.allowedTo?.includes('platform_admin'),
          ).map((page) => (
            <Route
              path={page.path}
              element={<ProtectedRoute element={page.element} />}
              key={page.path}
            />
          ))}
          <Route path='/' element={<Navigate to={PLATFORM_ADMIN_HOME_PATH} replace />} />
          <Route path='*' element={<Navigate to={PLATFORM_ADMIN_HOME_PATH} replace />} />
        </>
      ) : (
        <>
          {RouteConfig.map((page) => {
            if (page.allowedTo) {
              if (page.allowedTo?.includes(effectiveUserType)) {
                return (
                  <Route
                    path={page.path}
                    element={<ProtectedRoute element={page.element} />}
                    key={page.path}
                  />
                );
              }
              return <Route path={page.path} element={<Unauthorized />} key={page.path} />;
            }
            return <Route path={page.path} element={page.element} key={page.path} />;
          })}
          <Route path='*' element={<Navigate to='/public/error' />} />
        </>
      )}
    </Routes>
  );
};

export default ContentRoutes;

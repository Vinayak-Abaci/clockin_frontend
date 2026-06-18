import React, { createContext, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAxios } from '../axiosInstance';
import { setLogOut as setAuthLogOut } from '../store/auth';


export interface IAuthContextProps {
	user: any;
	setUser?(...args: unknown[]): unknown;
	userData: null | any;
	setUserData: null | any;
	setLogOut: null | any;
}
const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

interface IAuthContextProviderProps {
	children: ReactNode;
}



const isPublicAuthPath = (pathname: string) =>
	pathname.includes('public') ||
	pathname === '/login' ||
	pathname === '/clockin-admin/login' ||
	pathname === '/signup' ||
	pathname === '/forgotpassword' ||
	pathname === '/set-password';

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children }) => {
	const [user, setUser] = useState<string>('');
	const [userData, setUserData] = useState<null | any>(null);
  const dispatch = useDispatch();
  const navigate=useNavigate()
  const location=useLocation()
  
const setLogOut = () => {
    const isPlatformAdminUser = userData?.is_platform_admin === true;
    // Keep Redux auth mode in sync with context logout.
    dispatch(setAuthLogOut());
    navigate(isPlatformAdminUser ? '/clockin-admin/login' : '/login');
    setUser('');
    setUserData({});
    Cookies.remove('socketIOToken');
    Cookies.remove('refreshToken'); 
    Cookies.remove('accessToken');
    Cookies.remove('token');
    Cookies.remove('tenant');

};
  
	

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          setUser('');
          setUserData({});
          if (!isPublicAuthPath(location.pathname)) {
            navigate('/login');
          }
          return;
        }
          const url = '/api/users/profile/';
          const response = await authAxios.get(url);
          const profileUser = response.data?.user ?? response.data;
          setUser(profileUser?.email ?? response.data?.email);
          setUserData({
            ...profileUser,
            is_platform_admin:
              response.data?.is_platform_admin ?? profileUser?.is_platform_admin ?? false,
          });
          
        
      } catch (error: any) { // Using `any` for the error type since Axios errors can have any shape
        // Error handling logic here
        setLogOut();

      }
    };
    if (!isPublicAuthPath(location.pathname)) {
      fetchData();
    } else if (!Cookies.get('token')) {
      setUser('');
      setUserData({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

	const value = useMemo(
		() => ({
			user,
			setUser,
			userData,
      setUserData,
      setLogOut,
		}),
		[user, userData], // eslint-disable-line react-hooks/exhaustive-deps
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
AuthContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AuthContext;

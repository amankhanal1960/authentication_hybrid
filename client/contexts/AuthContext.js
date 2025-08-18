// import { createContext, useContext, useState, useEffect } from "react";
// import { authService } from "../services/api";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkSession = async () => {
//       try {
//         const session = await authService.getSession(); // calls /api/auth/session
//         if (session?.user) setUser(session.user);
//       } catch (err) {
//         // no session or error — silently ignore
//       } finally {
//         setLoading(false);
//       }
//     };
//     checkSession();
//   }, []);
// }

// const register = (data) => authService.register(data);
// const verifyOTP = (data) => authService.verifyOTP(data);

// const login = async (data) => {
//   const res = await authService.login(data);
//   // backend should set HttpOnly cookie and optionally return user
//   if (res?.user) setUser(res.user);
//   return res;
// };

// const logout = async () => {
//   await authService.logout();
//   setUser(null);
// };

// return (
//   <AuthContext.Provider
//     value={{ user, loading, register, verifyOTP, login, logout }}
//   >
//     {children}
//   </AuthContext.Provider>
// );

// export const useAuth = () => useContext(AuthContext);

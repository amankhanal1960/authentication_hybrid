import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);

      const response = await authService.refreshAccessToken();

      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);

      if (response.user) {
        return {
          success: true,
          needsVerification: true,
          userId: response.user.id,
        };
      }

      return {
        success: false,
        messafe: response.message || "Registration failed",
      };
    } catch (error) {
      setError(error.mesage || "Registration failed");
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (optData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verifyOTP(optData);

      if (response.message === "Email verified successfully!") {
        const loginResponse = await authService.login({
          email: optData.email,
          password: optData.password,
        });

        if (loginResponse.user) {
          setUser(loginResponse.user);
          return { success: true };
        }
      }

      return { success: false, message: response.error };
    } catch (error) {
      setError(error.message || "Verification failed");
      return {
        success: false,
        message: error.message || "Verification failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials);

      if (response.user) {
        setUser(response.user);
        return { success: true };
      }

      return { success: false, message: response.error };
    } catch (err) {
      setError(err.message || "Login failed");
      return { success: false, message: err.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (otpRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resendOTP(otpRequest);

      if (response.message === "New OTP sent successfully!") {
        return { success: true };
      }

      return { success: false, message: response.error };
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
      return { success: false, message: err.message || "Failed to resend OTP" };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    verifyOtp,
    login,
    logout,
    resendOtp,
    setError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

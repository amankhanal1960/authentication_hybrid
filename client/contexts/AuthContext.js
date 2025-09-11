// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";
import { useSnackbar } from "notistack";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount: try to refresh (if user has refresh cookie / existing session)
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check current session by calling refresh endpoint (will succeed only if refresh cookie present)
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // refreshAccessToken may return { accessToken, user } if cookie valid
      const response = await authService.refreshAccessToken();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
      return response;
    } catch (err) {
      // Not logged in or refresh failed
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Register (returns { success, userId } or { success:false, message })
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);

      // backend may return created user or minimal info
      if (response?.user) {
        enqueueSnackbar(
          "Registration successful! Please check your email for OTP.",
          {
            variant: "success",
          }
        );
        return {
          success: true,
          needsVerification: true,
          userId: response.user.id,
        };
      }

      enqueueSnackbar(response?.message || "Registration failed", {
        variant: "error",
      });

      return {
        success: false,
        message: response?.message || "Registration failed",
      };
    } catch (err) {
      enqueueSnackbar(err?.message || "Registration failed", {
        variant: "error",
      });
      setError(err?.message || "Registration failed");
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otpData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.verifyOTP(otpData);

      if (response?.message) {
        enqueueSnackbar("OTP verified successfully! Please log in.", {
          variant: "success",
        });
        return { success: true, message: response.message };
      }
      return {
        success: false,
        message: response?.error || "Verification failed",
      };
    } catch (err) {
      enqueueSnackbar(err?.message || "Verification failed", {
        variant: "error",
      });
      setError(err?.message || "Verification failed");
      return { success: false, message: err?.message || "Verification failed" };
    } finally {
      setLoading(false);
    }
  };

  // Login: issues access token + refresh cookie on server, and returns user
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      if (response?.user) {
        setUser(response.user);
        enqueueSnackbar("Login successful", { variant: "success" });
        // authService stores accessToken internally; you don't need to keep it here unless desired
        return { success: true, user: response.user };
      }

      enqueueSnackbar(response?.error || "Login failed", { variant: "error" });
      return { success: false, message: response?.error || "Login failed" };
    } catch (err) {
      enqueueSnackbar(err?.message || "Login failed", { variant: "error" });
      setError(err?.message || "Login failed");
      return { success: false, message: err?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err?.message || "Logout failed");
      return { success: false, message: err?.message || "Logout failed" };
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async (otpRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resendOTP(otpRequest);
      if (response?.message === "New OTP sent successfully!") {
        return { success: true };
      }
      return {
        success: false,
        message: response?.error || "Failed to resend OTP",
      };
    } catch (err) {
      setError(err?.message || "Failed to resend OTP");
      return {
        success: false,
        message: err?.message || "Failed to resend OTP",
      };
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

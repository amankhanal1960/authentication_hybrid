"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";
import { toast } from "sonner";

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
      setError(null);

      const response = await authService.refreshAccessToken();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
      return response;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);

      if (response?.user) {
        toast.success(
          "Registration successful! Please check your email for OTP."
        );
        return {
          success: true,
          needsVerification: true,
          userId: response.user.id,
        };
      }

      toast.error(response?.message || "Registration failed");

      return {
        success: false,
        message: response?.message || "Registration failed",
      };
    } catch (err) {
      toast.error(err?.message || "Registration failed");
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
        toast.success("OTP verified successfully! Please log in.");
        return { success: true, message: response.message };
      }
      return {
        success: false,
        message: response?.error || "Verification failed",
      };
    } catch (err) {
      toast.error(err?.message || "Verification failed");
      setError(err?.message || "Verification failed");
      return { success: false, message: err?.message || "Verification failed" };
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordRequest = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resetPasswordRequest({ email });

      if (response && response.message) {
        toast.success(
          "If an account exists, a reset link has been sent to the email."
        );
        return { success: true, message: response.message };
      }

      // fallback
      return {
        success: false,
        message: response?.error || "Failed to send reset email",
      };
    } catch (error) {
      toast.error(error?.message || "Failed to send reset email");
      setError(error?.message || "Failed to send reset email");
      return {
        success: false,
        message: error?.message || "Failed to send reset email",
      };
    } finally {
      setLoading(false);
    }
  };

  const passwordReset = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resetPassword(data);
      if (response?.message) {
        toast.success(response.message);
        return { success: true, message: response.message };
      }
      return {
        success: false,
        message: response?.error || "Password reset failed",
      };
    } catch (err) {
      toast.error(err?.message || "Password reset failed");
      setError(err?.message || "Password reset failed");
      return {
        success: false,
        message: err?.message || "Password reset failed",
      };
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      if (response?.user) {
        setUser(response.user);
        toast.success("Login successful");
        return { success: true, user: response.user };
      }

      toast.error(response?.error || "Login failed");
      return { success: false, message: response?.error || "Login failed" };
    } catch (err) {
      toast.error(err?.message || "Login failed");
      setError(err?.message || "Login failed");
      return { success: false, message: err?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await authenticatedFetch("/api/auth/session");
      setUser(res.user ?? null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      toast.success("Logged out successfully");
      setUser(null);
      return { success: true };
    } catch (err) {
      toast.error(err?.message || "Logout failed");
      setError(err?.message || "Logout failed");
      return { success: false, message: err?.message || "Logout failed" };
    } finally {
      setLoading(false);
    }
  };

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
    fetchSession,
    passwordReset,
    resetPasswordRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

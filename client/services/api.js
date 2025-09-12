import { signOut } from "next-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const handleResponse = async (res) => {
  const text = await res.text();

  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

let accessToken = null;

let isRefreshing = false;
let refreshPromise = null;

export const authService = {
  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse(res);
  },

  /* Verify OTP (email verification).
     Expects backend route: POST /api/user/verify-otp
  */
  verifyOTP: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const response = await handleResponse(res);
    return response;
  },

  /* Resend OTP.
     Expects backend route: POST /api/user/resend-otp
  */

  resendOTP: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse(res);
  },

  /* Login: backend should return { accessToken, user } and set
     an httpOnly refresh cookie via Set-Cookie header.
     We store accessToken in memory for immediate requests.
  */
  login: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const response = await handleResponse(res);

    // store returned access token in memory
    if (response.accessToken) accessToken = response.accessToken;
    return response;
  },

  /* Refresh access token using the refresh cookie.
     This call should be idempotent-safe on the server: when
     browser sends the httpOnly refresh cookie, server returns
     a new accessToken (and optionally user object).
  */
  refreshAccessToken: async () => {
    // if a refresh is already in-progress, reuse the same promise
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include", // send httpOnly refresh cookie
        });

        const response = await handleResponse(res);

        // update in-memory access token if server returned one
        if (response.accessToken) accessToken = response.accessToken;
        return response;
      } finally {
        // clear lock whether refresh succeeded or failed
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  /* Logout: clear refresh cookie on the server and local memory token.
     Expects backend route: POST /api/auth/logout
  */
  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      // clear local in-memory token immediately
      accessToken = null;

      await signOut({ callbackUrl: "/auth/login" });
    } catch (err) {
      console.error("Logout error:", err);
    }
  },

  /* Small helper to get the current in-memory access token */
  getAccessToken: () => accessToken,

  /**
   * authenticatedFetch: a wrapper to call protected API endpoints.
   *
   * Behavior:
   * 1. If we don't have an accessToken in memory, try refreshAccessToken().
   * 2. If accessToken exists, add Authorization header.
   * 3. Call the target endpoint with credentials included (so cookies work).
   * 4. If the response is 401, try a single refresh (with lock) and retry once.
   * 5. If still failing, throw the error so UI can handle redirect to login.
   *
   * Important: this function modifies headers but clones options so it does not
   * mutate the caller's object.
   */
  authenticatedFetch: async (url, options = {}) => {
    // ensure headers exist (clone to avoid mutating caller's object)
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // If we don't have a token in memory, attempt to rehydrate from refresh cookie
    if (!accessToken) {
      try {
        await authService.refreshAccessToken();
      } catch (err) {
        // refresh failed → access remains null; we don't throw here yet,
        // so caller can decide how to handle unauthenticated state
      }
    }

    // if we have a token, attach it
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    // perform the request (include credentials so cookies are sent)
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // if unauthorized, try to refresh once (with the lock implemented in refreshAccessToken)
    if (res.status === 401) {
      try {
        await authService.refreshAccessToken();

        // if refresh gave us a token, update header and retry
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const retry = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });

        return handleResponse(retry);
      } catch (err) {
        // refresh failed (user needs to login) — rethrow so UI can redirect
        throw err;
      }
    }

    // normal success path (or other non-401 statuses handled by handleResponse)
    return handleResponse(res);
  },
};

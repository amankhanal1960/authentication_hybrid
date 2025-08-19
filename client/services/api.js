const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
};

let accessToken = null;

export const authService = {
  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  verifyOTP: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  resendOTP: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const response = await handleResponse(res);
    if (response.accessToken) {
      accessToken = response.accessToken;
    }
    return response;
  },

  refreshAccessToken: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const response = await handleResponse(res);
    if (response.accessToken) {
      accessToken = response.accessToken;
    }
    return response;
  },

  logout: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    accessToken = null;
    return handleResponse(res);
  },
  getAccessToken: () => accessToken,

  authenticatedFetch: async (url, options = {}) => {
    if (!accessToken) {
      try {
        await authService.refreshAccessToken();
      } catch (error) {
        throw new Error("Failed to refresh access token");
      }
    }
    const headers = {
      "contner-Type": "application/json",
      ...options.headers,
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      try {
        await authService.refreshAccessToken();

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
        return handleResponse(retryRes);
      } catch (error) {
        throw new Error("Failed to refresh access token");
      }
    }
    return handleResponse(res);
  },
};

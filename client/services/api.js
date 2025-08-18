const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

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

  login: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse(res);
  },
};

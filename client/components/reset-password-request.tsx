import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordModal({}) {
  const [email, setEmail] = useState("");
  const [LocalError, setLocalError] = useState(false);
  const [Isloading, setIsLoading] = useState(false);

  const { resetPasswordRequest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      setLocalError(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPasswordRequest(email);
    } catch (error: any) {
      setLocalError(error?.message || "An error occured");
    } finally {
      setIsLoading(false);
    }
  };

  return <div></div>;
}

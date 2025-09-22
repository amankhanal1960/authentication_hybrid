import React, { Suspense } from "react";
import ResetPasswordPage from "@/components/reset-password";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { passwordReset } = useAuth();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    // clear error if token/email present
    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
    } else {
      setError("");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    const pw = String(newPassword || "").trim();
    const pw2 = String(confirmPassword || "").trim();

    if (!pw || pw.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }

    if (pw !== pw2) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await passwordReset({ token, newPassword: pw });

      // defensive: handle different shapes
      const ok = result?.success ?? false;
      const message =
        result?.message ?? result?.error ?? "Password reset failed";

      if (ok) {
        setSuccess(true);
        // remove token from URL and redirect to login with a friendly message
        // router.replace removes history entry, good for privacy
        setTimeout(() => {
          router.replace(
            "/?message=Password reset successful. Please log in with your new password."
          );
        }, 1400);
      } else {
        // handle token-specific message specially
        if (String(message).toLowerCase().includes("token")) {
          setError(message + " Please request a new reset link.");
        } else {
          setError(message);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    !isLoading &&
    token &&
    email &&
    newPassword.trim().length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">
              Password Reset Successful!
            </CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

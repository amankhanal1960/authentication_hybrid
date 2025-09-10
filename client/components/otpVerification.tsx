"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email: string;
  /** Optional: if your backend expects a userId instead of email, pass it here */
  userId?: string;
  /** OTP expiry in seconds (optional override) */
  expirySeconds?: number;
};

type VerifyResponse = {
  success: boolean;
  message?: string;
  userId?: string;
};

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  email,
  userId,
  expirySeconds = 900, // default 15 minutes
}: Props) {
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(expirySeconds);
  const [canResend, setCanResend] = useState<boolean>(false);

  const { verifyOtp, resendOtp } = useAuth();

  // Initialize/reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError("");
      setTimeLeft(expirySeconds);
      setCanResend(false);
    }
  }, [isOpen, expirySeconds]);

  // countdown timer
  useEffect(() => {
    if (!isOpen) return;

    setCanResend(false);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    setError("");
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      // prefer userId if provided, otherwise send email
      const body = {
        userId: userId,
        email: email,
        otp,
      };
      console.log("BODY I AM SENDING:", body);
      const res: VerifyResponse = await verifyOtp(body);

      if (res?.success) {
        // success callback (e.g., redirect to login / dashboard)
        onSuccess();
        onClose();
      } else {
        setError(res?.message || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setIsResending(true);
    try {
      // prefer userId if provided, otherwise send email
      const res: { success?: boolean; message?: string } = await resendOtp();

      // some backends return a message, others just success flag
      if (res?.success || res?.message === "New OTP sent successfully!") {
        // reset timer
        setTimeLeft(expirySeconds);
        setCanResend(false);
        setOtp("");
      } else {
        setError(res?.message || "Failed to resend code. Try again later.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code. Try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => (open ? undefined : onClose())}
    >
      <DialogContent className="sm:max-w-md mx-4 nunito-text rounded-none">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold text-center ">
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-sm text-center ">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-primary">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Expires in{" "}
              <span className="font-mono font-medium">
                {formatTime(timeLeft)}
              </span>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Expired Alert */}
          {timeLeft === 0 && (
            <Alert>
              <AlertDescription className="text-sm">
                Code expired. Please request a new one.
              </AlertDescription>
            </Alert>
          )}

          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value: string) => {
                setOtp(value);
                setError("");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12" />
                <InputOTPSlot index={1} className="w-12 h-12" />
                <InputOTPSlot index={2} className="w-12 h-12" />
                <InputOTPSlot index={3} className="w-12 h-12" />
                <InputOTPSlot index={4} className="w-12 h-12" />
                <InputOTPSlot index={5} className="w-12 h-12" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Verify Button */}
          <Button
            className="w-full rounded-none cursor-pointer"
            disabled={isLoading || otp.length !== 6 || timeLeft === 0}
            onClick={handleVerify}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          {/* Resend */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={!canResend || isResending}
              className="rounded-none cursor-pointer"
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>

          {/* Cancel */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-none cursor-pointer"
            disabled={isLoading || isResending}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

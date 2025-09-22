"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "next-auth/react";
import ForgotPasswordModal from "@/components/reset-password-request";

import { Chrome, Eye, EyeOff, Loader2, Github } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  const handleForgotPassword = () => {
    setShowPasswordResetModal(true);
  };

  const router = useRouter();
  const { login } = useAuth();

  const handleSignUpRedirect = () => {
    router.push("/auth/register");
  };

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Za-z]/.test(pw))
      return "Password must include at least one letter (a–z or A–Z).";
    if (!/\d/.test(pw))
      return "Password must include at least one number (0–9).";
    if (/\s/.test(pw)) return "Password must not contain spaces.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      setLocalError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    // validate password with specific messages
    const pwError = validatePassword(password);
    if (pwError) {
      setLocalError(pwError);
      setIsLoading(false);
      return;
    }

    try {
      const res = await login({ email, password });

      if (res?.success) {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setLocalError(error?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/mitsuri.png')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/60" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            {/* Mobile-first responsive grid */}
            <div className="shadow-2xl overflow-hidden">
              <div className=" backdrop-blur-xs grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
                {/* Welcome Section - Hidden on mobile, visible on large screens */}
                <div className="hidden md:flex flex-col justify-center items-center text-center p-8 xl:p-12 bg-transparent">
                  <div className="space-y-4 max-w-md ">
                    <div className="space-y-4">
                      <h1 className="md:text-3xl xl:text-4xl font-bold leading-tight text-slate-100">
                        Welcome Back !
                      </h1>
                      <p className="text-sm md:text-lg text-slate-300 leading-relaxed">
                        Sign in to access your account and continue your journey
                        with us
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center bg-white/95 lg:gap-6 sm:gap-4 gap-2">
                  {/* Mobile header - only visible on small screens */}
                  <div className="md:hidden text-center mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      Welcome Back
                    </h1>
                    <p className="text-gray-600">Sign in to your account</p>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="flex justify-between flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center cursor-pointer justify-center w-full sm:w-auto flex-1 h-12 bg-white text-primary  border border-gray-200 hover:bg-gray-50 lg:hover:ring-0 lg:hover:border-gray-500 text-base font-medium"
                        onClick={() => signIn("google")}
                      >
                        <Chrome className="mr-3 h-5 w-5" />
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center cursor-pointer justify-center w-full sm:w-auto flex-1 h-12 bg-white text-primary  border border-gray-200 hover:bg-gray-50 lg:hover:ring-0 lg:hover:border-gray-500 text-base font-medium"
                        onClick={() => signIn("github")}
                      >
                        <Github className="mr-3 h-5 w-5" />
                        Github
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-white px-4 text-gray-500 font-medium">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-primary font-medium"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 text-base rounded-none lg:focus:ring-0 lg:focus:border-gray-500 border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-primary font-medium"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-12 text-base rounded-none pr-12 lg:focus:ring-0 lg:focus:border-gray-500 border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-500" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-500" />
                          )}
                        </Button>
                      </div>

                      {/* Login Form */}
                      {localError && (
                        <div className="m-4 text-center text-xs text-red-600">
                          {localError}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked: boolean) =>
                            setRememberMe(checked)
                          }
                          className="data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                        />
                        <Label
                          htmlFor="remember"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          Remember me
                        </Label>
                      </div>

                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm text-primary cursor-pointer hover:text-primary/90 self-start sm:self-center"
                        disabled={isLoading}
                        onClick={handleForgotPassword}
                      >
                        Forgot password?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary rounded-none cursor-pointer hover:bg-primary/90 text-white text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  {/* Sign Up Link */}
                  <div className="text-center pt-4">
                    <span className="text-gray-600 text-base">
                      Don't have an account?{" "}
                    </span>
                    <Button
                      variant="link"
                      onClick={handleSignUpRedirect}
                      className="p-0 h-auto font-semibold text-primary hover:text-primary/90 text-base cursor-pointer"
                      disabled={isLoading}
                    >
                      Create Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        open={showPasswordResetModal}
        onOpenChange={setShowPasswordResetModal}
      />
    </>
  );
}

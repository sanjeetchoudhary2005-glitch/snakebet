
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || searchParams?.get("next") || "/";
  const resetToken = searchParams?.get("reset");
  const { signIn } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetToken) {
        if (resetPassword !== resetConfirm) {
          alert("Passwords do not match");
          return;
        }
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: resetPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Reset failed");
          return;
        }
        alert("Password updated. Please sign in.");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      signIn();
      router.push(callbackUrl);
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = (provider: "google" | "facebook") => {
    const url = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = url;
  };

  const handleForgotPassword = async () => {
    const email = formData.email.trim();
    if (!email) {
      alert("Enter your email first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message || data.error || "Request submitted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-light hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">{resetToken ? "Choose New Password" : "Welcome Back"}</h1>
          <p className="text-muted-light">
            {resetToken ? "Enter a new password for your account" : "Sign in to your account"}
          </p>
        </div>

        {!resetToken && (
          <div className="space-y-4 mb-8">
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => handleSocialSignIn("google")}
              disabled={loading}
            >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start gap-3"
            onClick={() => handleSocialSignIn("facebook")}
            disabled={loading}
          >
            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </Button>
        </div>
        )}

        {!resetToken && (
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-secondary text-muted-light">or continue with email</span>
          </div>
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!resetToken && (
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>
          </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">{resetToken ? "New Password" : "Password"}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={resetToken ? resetPassword : formData.password}
                onChange={(e) =>
                  resetToken
                    ? setResetPassword(e.target.value)
                    : setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                required
                minLength={resetToken ? 8 : 1}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {resetToken && (
          <div>
            <label className="block text-sm font-semibold mb-2">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
              required
              minLength={8}
            />
          </div>
          )}

          {!resetToken && (
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          )}

          <Button variant="primary" className="w-full mt-6" isLoading={loading}>
            {resetToken ? "Update Password" : "Sign In"}
          </Button>
        </form>

        {!resetToken && (
        <div className="mt-8 text-center">
          <p className="text-muted-light">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

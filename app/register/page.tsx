
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Step = "register" | "verify";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    referralCode: "",
  });
  const router = useRouter();
  const { signIn } = useSession();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }
      
      setUserId(data.userId);
      setStep("verify");
    } catch (error) {
      console.error("Register error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Verification failed");
        return;
      }
      
      signIn();
      router.push("/");
    } catch (error) {
      console.error("Verify error:", error);
      alert("Something went wrong");
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
          <h1 className="text-3xl font-black mb-2">
            {step === "register" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-muted-light">
            {step === "register" ? "Sign up to start playing" : "Enter the verification code sent to your email"}
          </p>
        </div>

        {step === "register" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                  required
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

            <div>
              <label className="block text-sm font-semibold mb-2">Referral Code (Optional)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder="ABCD1234"
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <Button variant="primary" className="w-full mt-6" isLoading={loading}>
              Create Account
            </Button>

            <div className="mt-8 text-center">
              <p className="text-muted-light">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <CheckCircle2 className="w-12 h-12 text-[#FFFFFF]" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-center">
                Verification Code
              </label>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d$/.test(value)) {
                        const newOtp = otp.split("");
                        newOtp[index] = value;
                        setOtp(newOtp.join(""));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index]) {
                        const newOtp = otp.split("");
                        newOtp[index - 1] = "";
                        setOtp(newOtp.join(""));
                      }
                    }}
                    className="w-12 h-16 text-center text-2xl font-bold bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                    required
                  />
                ))}
              </div>
            </div>

            <Button variant="primary" className="w-full mt-6" isLoading={loading}>
              Verify Email
            </Button>

            <button
              type="button"
              onClick={() => setStep("register")}
              className="w-full text-muted-light hover:text-white text-sm"
            >
              Change Email
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

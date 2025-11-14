import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password | BookingHub",
  description: "Reset your BookingHub account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Forgot password?</h1>
        <p className="text-neutral-600">
          No worries! We&apos;ll send you reset instructions
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}

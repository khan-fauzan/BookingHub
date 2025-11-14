import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | BookingHub",
  description: "Create a new password for your BookingHub account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Set new password</h1>
        <p className="text-neutral-600">
          Your new password must be different from previously used passwords
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}

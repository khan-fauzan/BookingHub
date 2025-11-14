import { RegisterForm } from "@/components/forms/register-form";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | BookingHub",
  description: "Create your BookingHub account to start booking amazing accommodations worldwide.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Create an account</h1>
        <p className="text-neutral-600">
          Join thousands of happy travelers
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

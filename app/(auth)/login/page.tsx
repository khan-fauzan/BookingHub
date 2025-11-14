import { LoginForm } from "@/components/forms/login-form";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | BookingHub",
  description: "Log in to your BookingHub account to manage your bookings and access exclusive deals.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Welcome back</h1>
        <p className="text-neutral-600">
          Log in to your account to continue
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { Button, Input } from "@/components/ui";
import { Mail } from "lucide-react";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    console.log("Forgot password data:", data);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <Mail className="h-8 w-8 text-success-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-neutral-900">
            Check your email
          </h3>
          <p className="text-sm text-neutral-600">
            We&apos;ve sent you a password reset link. Please check your email and follow the instructions.
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email Address"
        type="email"
        placeholder="your.email@example.com"
        leftIcon={<Mail className="h-5 w-5" />}
        error={errors.email?.message}
        helperText="Enter the email associated with your account"
        {...register("email")}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        Send Reset Link
      </Button>
    </form>
  );
}

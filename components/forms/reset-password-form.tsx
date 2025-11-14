"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import { Button, Input } from "@/components/ui";
import { Lock, CheckCircle } from "lucide-react";
import { useState } from "react";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    console.log("Reset password data:", data);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsReset(true);
    }, 1500);
  };

  if (isReset) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-neutral-900">
            Password Reset Successful
          </h3>
          <p className="text-sm text-neutral-600">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => (window.location.href = "/login")}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="New Password"
        type="password"
        placeholder="Create a strong password"
        leftIcon={<Lock className="h-5 w-5" />}
        error={errors.password?.message}
        helperText="Must be at least 8 characters with uppercase, lowercase, and number"
        {...register("password")}
        required
      />

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="Confirm your password"
        leftIcon={<Lock className="h-5 w-5" />}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        Reset Password
      </Button>
    </form>
  );
}

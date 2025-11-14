"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Button, Input, Checkbox } from "@/components/ui";
import { Mail, Lock, User, Phone } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    console.log("Register data:", data);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert("Registration form submitted! (Frontend only - no backend integration yet)");
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="John"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.firstName?.message}
          {...register("firstName")}
          required
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.lastName?.message}
          {...register("lastName")}
          required
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        placeholder="your.email@example.com"
        leftIcon={<Mail className="h-5 w-5" />}
        error={errors.email?.message}
        {...register("email")}
        required
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1 234 567 8900"
        leftIcon={<Phone className="h-5 w-5" />}
        error={errors.phoneNumber?.message}
        helperText="Optional - for booking notifications"
        {...register("phoneNumber")}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Create a strong password"
        leftIcon={<Lock className="h-5 w-5" />}
        error={errors.password?.message}
        helperText="Must be at least 8 characters with uppercase, lowercase, and number"
        {...register("password")}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        leftIcon={<Lock className="h-5 w-5" />}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
        required
      />

      <Checkbox
        label={
          <span className="text-sm">
            I accept the{" "}
            <Link
              href="/terms"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Privacy Policy
            </Link>
          </span>
        }
        error={errors.acceptTerms?.message}
        {...register("acceptTerms")}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        Create Account
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-neutral-500">Or sign up with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => alert("Google signup (Frontend only)")}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => alert("Facebook signup (Frontend only)")}
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>
    </form>
  );
}

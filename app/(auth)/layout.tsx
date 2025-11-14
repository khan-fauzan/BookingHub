import { Calendar } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-2 text-white">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">BookingHub</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white">
            Discover Your Perfect Stay
          </h2>
          <p className="text-xl text-primary-100">
            Join thousands of travelers who trust us to find their ideal accommodations worldwide.
          </p>
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-primary-100">Properties</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-primary-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-sm text-primary-100">Average Rating</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-100 text-sm">
          © {new Date().getFullYear()} BookingHub. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

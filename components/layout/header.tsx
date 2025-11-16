"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { Menu, X, Calendar, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">
              BookingHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/search"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Search
            </Link>
            <Link
              href="/deals"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Deals
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Help
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-700 hover:text-primary-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/search"
                className="text-base font-medium text-neutral-700 hover:text-primary-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/deals"
                className="text-base font-medium text-neutral-700 hover:text-primary-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Deals
              </Link>
              <Link
                href="/about"
                className="text-base font-medium text-neutral-700 hover:text-primary-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/help"
                className="text-base font-medium text-neutral-700 hover:text-primary-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </Link>
              <div className="pt-3 border-t border-neutral-200 space-y-2">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" fullWidth>Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" fullWidth>Sign up</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

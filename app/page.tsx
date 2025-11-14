import { SearchBar } from "@/components/search/search-bar";
import { Card, CardContent, Badge } from "@/components/ui";
import { Star, TrendingUp, Award, Shield, Clock } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const popularDestinations = [
    { name: "Paris", country: "France", properties: 1240, image: "/placeholder-paris.jpg" },
    { name: "Tokyo", country: "Japan", properties: 980, image: "/placeholder-tokyo.jpg" },
    { name: "New York", country: "USA", properties: 1560, image: "/placeholder-ny.jpg" },
    { name: "Dubai", country: "UAE", properties: 780, image: "/placeholder-dubai.jpg" },
  ];

  const features = [
    {
      icon: Shield,
      title: "Best Price Guarantee",
      description: "Find a lower price? We'll refund the difference",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Get help anytime, anywhere with our dedicated support team",
    },
    {
      icon: Award,
      title: "Verified Reviews",
      description: "Read real reviews from real travelers",
    },
    {
      icon: TrendingUp,
      title: "Exclusive Deals",
      description: "Members get access to special discounts and offers",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white mb-10">
            <Badge variant="info" className="mb-4 bg-white/20 text-white border-white/30">
              ✨ New: Instant Booking Available
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Discover amazing hotels, apartments, and resorts in over 200 countries worldwide
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-6xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-lg text-neutral-600">
              Explore the world's most sought-after locations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination) => (
              <Card
                key={destination.name}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden">
                  {/* Placeholder gradient for images */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/80 to-primary-600/80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-2">📍</div>
                      <p className="text-sm opacity-75">Photo coming soon</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {destination.name}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-2">
                    {destination.country}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {destination.properties} properties
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Why Choose BookingHub?
            </h2>
            <p className="text-lg text-neutral-600">
              We make your booking experience seamless and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-primary-100">Properties Listed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-primary-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">200+</div>
              <div className="text-primary-100">Countries</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.9</div>
              <div className="text-primary-100 flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-current" />
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-neutral-600 mb-8">
              Join thousands of travelers who have found their perfect stays with us
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              >
                Sign Up For Free
              </a>
              <a
                href="/search"
                className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                Explore Properties
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

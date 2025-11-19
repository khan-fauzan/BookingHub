"use client";

import { PropertySearchResult } from "@/types";
import { Card, CardContent, Badge } from "@/components/ui";
import { Star, MapPin, Check, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PropertyCardProps {
  property: PropertySearchResult;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return "Exceptional";
    if (rating >= 8) return "Excellent";
    if (rating >= 7) return "Very Good";
    if (rating >= 6) return "Good";
    return "Fair";
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
    // TODO: Implement wishlist API call
  };

  return (
    <Link href={`/properties/${property.propertyId}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full">
          {/* Image Section */}
          <div className="relative h-64 md:h-auto bg-neutral-200">
            {property.images.primary ? (
              <Image
                src={property.images.primary}
                alt={property.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">🏨</div>
                  <p className="text-sm opacity-75">No image available</p>
                </div>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-neutral-600"
                }`}
              />
            </button>

            {/* Badges */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {property.isFeatured && (
                <Badge variant="warning" className="shadow-lg">
                  Featured
                </Badge>
              )}
              {property.badges?.map((badge, index) => (
                <Badge key={index} variant="info" className="shadow-lg">
                  {badge}
                </Badge>
              ))}
            </div>

            {/* Image Count */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                +{property.images.count} photos
              </div>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="p-5 flex flex-col justify-between">
            <div>
              {/* Title and Location */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {property.name}
                  </h3>
                  {property.starRating > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {[...Array(property.starRating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-neutral-600 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.location.city}, {property.location.country}
                  </span>
                  {property.location.distanceFromCenter && (
                    <span className="text-neutral-500">
                      • {property.location.distanceFromCenter} km from center
                    </span>
                  )}
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-3">
                <Badge variant="default" className="capitalize">
                  {property.propertyType}
                </Badge>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {property.amenities.slice(0, 4).map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 text-xs text-neutral-600 bg-neutral-50 px-2 py-1 rounded"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                  {property.amenities.length > 4 && (
                    <div className="text-xs text-neutral-600 bg-neutral-50 px-2 py-1 rounded">
                      +{property.amenities.length - 4} more
                    </div>
                  )}
                </div>
              )}

              {/* Rating */}
              {property.rating && property.rating.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1 rounded-lg font-semibold">
                    <span className="text-lg">{property.rating.average}</span>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">
                      {getRatingLabel(property.rating.average)}
                    </div>
                    <div className="text-xs text-neutral-600">
                      {property.rating.reviewCount.toLocaleString()} reviews
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing and Availability */}
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <div className="flex items-end justify-between">
                <div>
                  {property.availability?.available ? (
                    <div className="text-sm text-green-600 font-medium mb-1">
                      {property.availability.roomsAvailable === 1
                        ? "Only 1 room left!"
                        : property.availability.roomsAvailable <= 3
                        ? `Only ${property.availability.roomsAvailable} rooms left!`
                        : "Available"}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 font-medium mb-1">
                      Sold out
                    </div>
                  )}
                  <div className="text-xs text-neutral-600">
                    {property.pricing?.taxesIncluded
                      ? "Taxes included"
                      : "Taxes not included"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-neutral-900">
                    ${property.pricing?.pricePerNight?.toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-neutral-600">per night</div>
                  {property.pricing?.totalPrice !==
                    property.pricing?.pricePerNight && property.pricing?.totalPrice && (
                    <div className="text-xs text-neutral-500 mt-1">
                      ${property.pricing.totalPrice.toFixed(0)} total
                    </div>
                  )}
                </div>
              </div>

              {property.availability?.available && (
                <div className="mt-3">
                  <div className="w-full bg-primary-600 text-white text-center py-2 rounded-lg font-medium group-hover:bg-primary-700 transition-colors">
                    See availability
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

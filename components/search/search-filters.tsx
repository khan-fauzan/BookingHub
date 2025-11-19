"use client";

import { useState } from "react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  DollarSign,
  Star,
  Home,
  Wifi,
  Utensils,
  Dumbbell,
  Car,
  Coffee,
  Wind,
} from "lucide-react";

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  availableFilters?: {
    priceRange: { min: number; max: number };
    starRatings: number[];
    propertyTypes: string[];
    amenities: string[];
  };
}

export interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
  propertyType?: string[];
  amenities?: string[];
  minGuestRating?: number;
  freeCancellation?: boolean;
}

const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "resort", label: "Resort" },
  { value: "villa", label: "Villa" },
  { value: "hostel", label: "Hostel" },
  { value: "guesthouse", label: "Guesthouse" },
];

const AMENITIES = [
  { value: "wifi", label: "Free WiFi", icon: Wifi },
  { value: "pool", label: "Pool", icon: Wind },
  { value: "gym", label: "Gym", icon: Dumbbell },
  { value: "restaurant", label: "Restaurant", icon: Utensils },
  { value: "parking", label: "Parking", icon: Car },
  { value: "breakfast", label: "Breakfast", icon: Coffee },
];

export function SearchFilters({
  onFilterChange,
  availableFilters,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const handlePriceChange = (min?: number, max?: number) => {
    const newFilters = { ...filters };

    // Only add properties if they have values, otherwise remove them
    if (min !== undefined) {
      newFilters.minPrice = min;
    } else {
      delete newFilters.minPrice;
    }

    if (max !== undefined) {
      newFilters.maxPrice = max;
    } else {
      delete newFilters.maxPrice;
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStarRatingToggle = (rating: number) => {
    const currentRatings = filters.starRating || [];
    const newRatings = currentRatings.includes(rating)
      ? currentRatings.filter((r) => r !== rating)
      : [...currentRatings, rating];

    const newFilters = {
      ...filters,
      starRating: newRatings.length > 0 ? newRatings : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePropertyTypeToggle = (type: string) => {
    const currentTypes = filters.propertyType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    const newFilters = {
      ...filters,
      propertyType: newTypes.length > 0 ? newTypes : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];

    const newFilters = {
      ...filters,
      amenities: newAmenities.length > 0 ? newAmenities : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFreeCancellationToggle = () => {
    const newFilters = {
      ...filters,
      freeCancellation: !filters.freeCancellation,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleGuestRatingChange = (rating?: number) => {
    const newFilters = { ...filters };

    if (rating !== undefined) {
      newFilters.minGuestRating = rating;
    } else {
      delete newFilters.minGuestRating;
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.starRating && filters.starRating.length > 0) count++;
    if (filters.propertyType && filters.propertyType.length > 0) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.minGuestRating) count++;
    if (filters.freeCancellation) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div>
      {/* Filter Toggle Button - Mobile/Tablet */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="info" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 ml-auto" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-auto" />
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <div
        className={`space-y-4 ${
          isOpen ? "block" : "hidden"
        } lg:block transition-all`}
      >
        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
              applied
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-primary-600 hover:text-primary-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}

        {/* Price Range */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              Price per night
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-600 mb-1 block">
                    Min price
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      handlePriceChange(
                        e.target.value ? Number(e.target.value) : undefined,
                        filters.maxPrice
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 mb-1 block">
                    Max price
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      handlePriceChange(
                        filters.minPrice,
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              {availableFilters?.priceRange && (
                <p className="text-xs text-neutral-500">
                  Range: ${availableFilters.priceRange.min} - $
                  {availableFilters.priceRange.max}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Star Rating */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary-600" />
              Star Rating
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label
                  key={rating}
                  className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.starRating?.includes(rating) ?? false}
                    onChange={() => handleStarRatingToggle(rating)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-1">
                    {[...Array(rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-700">{rating} Star</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property Type */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Home className="h-5 w-5 text-primary-600" />
              Property Type
            </h3>
            <div className="space-y-2">
              {PROPERTY_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.propertyType?.includes(type.value) ?? false}
                    onChange={() => handlePropertyTypeToggle(type.value)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => {
                const Icon = amenity.icon;
                return (
                  <button
                    key={amenity.value}
                    onClick={() => handleAmenityToggle(amenity.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      filters.amenities?.includes(amenity.value)
                        ? "border-primary-600 bg-primary-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        filters.amenities?.includes(amenity.value)
                          ? "text-primary-600"
                          : "text-neutral-600"
                      }`}
                    />
                    <span className="text-xs text-center">{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Guest Rating */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Guest Rating
            </h3>
            <div className="space-y-2">
              {[9, 8, 7, 6].map((rating) => (
                <label
                  key={rating}
                  className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    name="guestRating"
                    checked={filters.minGuestRating === rating}
                    onChange={() => handleGuestRatingChange(rating)}
                    className="w-4 h-4 border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">
                    {rating}+ Excellent
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="guestRating"
                  checked={!filters.minGuestRating}
                  onChange={() => handleGuestRatingChange(undefined)}
                  className="w-4 h-4 border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Any rating</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Free Cancellation */}
        <Card>
          <CardContent className="p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-neutral-900">
                  Free Cancellation
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Cancel up to 48 hours before check-in
                </p>
              </div>
              <input
                type="checkbox"
                checked={filters.freeCancellation || false}
                onChange={handleFreeCancellationToggle}
                className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

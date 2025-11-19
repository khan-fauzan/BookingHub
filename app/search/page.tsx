"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SearchBar,
  SearchFilters,
  PropertyCard,
  SearchSort,
  SearchPagination,
  type FilterState,
  type SortOption,
} from "@/components/search";
import { searchProperties } from "@/lib/api";
import type { PropertySearchResult, PropertySearchParams } from "@/types";
import { Loader2, Search, AlertCircle } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [properties, setProperties] = useState<PropertySearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableFilters, setAvailableFilters] = useState<any>(null);

  // Search parameters from URL
  const destination = searchParams.get("destination") || "";
  const city = searchParams.get("city") || "";
  const country = searchParams.get("country") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const resultsPerPage = 20;

  // Load properties when search params or filters change
  useEffect(() => {
    const loadProperties = async () => {
      // Validate required parameters
      if (!checkIn || !checkOut) {
        setError("Please select check-in and check-out dates");
        setLoading(false);
        return;
      }

      if (!city && !country && !destination) {
        setError("Please enter a destination");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build search parameters
        const params: PropertySearchParams = {
          checkIn,
          checkOut,
          adults,
          children: children > 0 ? children : undefined,
          rooms: rooms > 1 ? rooms : undefined,
          sortBy,
          limit: resultsPerPage,
          offset: (currentPage - 1) * resultsPerPage,
        };

        // Add location
        if (city && country) {
          params.city = city;
          params.country = country;
        } else if (destination) {
          // Parse destination - assuming format "City, Country"
          const parts = destination.split(",");
          if (parts.length >= 2) {
            params.city = parts[0].trim();
            params.country = parts[parts.length - 1].trim();
          } else {
            params.city = destination;
          }
        }

        // Add filters
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.starRating && filters.starRating.length > 0) {
          params.starRating = filters.starRating;
        }
        if (filters.propertyType && filters.propertyType.length > 0) {
          params.propertyType = filters.propertyType;
        }
        if (filters.amenities && filters.amenities.length > 0) {
          params.amenities = filters.amenities;
        }
        if (filters.minGuestRating) {
          params.minGuestRating = filters.minGuestRating;
        }
        if (filters.freeCancellation) {
          params.freeCancellation = filters.freeCancellation;
        }

        // Call API
        const response = await searchProperties(params);

        if (response.success && response.data) {
          setProperties(response.data.properties);
          setTotalResults(response.data.pagination.total);
          setAvailableFilters(response.data.filters.available);
        } else {
          setError("Failed to load properties");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load properties"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [
    city,
    country,
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    filters,
    sortBy,
    currentPage,
  ]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Search Bar Section */}
      <section className="bg-primary-600 py-6">
        <div className="container mx-auto px-4">
          <Suspense fallback={<div className="bg-white rounded-xl shadow-2xl p-8 text-center">Loading...</div>}>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <SearchFilters
              onFilterChange={handleFilterChange}
              availableFilters={availableFilters}
            />
          </aside>

          {/* Results Section */}
          <main>
            {/* Header with results count and sorting */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  {loading ? (
                    <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded" />
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-neutral-900">
                        {destination || city
                          ? `${destination || city}${
                              country && !destination ? `, ${country}` : ""
                            }`
                          : "Search Results"}
                      </h1>
                      <p className="text-neutral-600 mt-1">
                        {totalResults} {totalResults === 1 ? "property" : "properties"} •{" "}
                        {checkIn && checkOut && (
                          <>
                            {new Date(checkIn).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(checkOut).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            • {adults} {adults === 1 ? "adult" : "adults"}
                            {children > 0 &&
                              `, ${children} ${
                                children === 1 ? "child" : "children"
                              }`}
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>
                {!loading && !error && (
                  <SearchSort currentSort={sortBy} onSortChange={handleSortChange} />
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
                <p className="text-neutral-600">Searching for properties...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <h3 className="font-semibold text-red-900">Error</h3>
                  </div>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && properties.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center">
                  <Search className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              </div>
            )}

            {/* Results List */}
            {!loading && !error && properties.length > 0 && (
              <>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <PropertyCard key={property.propertyId} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                <SearchPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  resultsPerPage={resultsPerPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

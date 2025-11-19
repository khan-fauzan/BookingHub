import {
  PropertySearchParams,
  PropertySearchResponse,
  PropertyDetailsResponse,
} from "@/types";

// Get the API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Search properties with filters
 * @param params Search parameters
 * @returns Property search results
 */
export async function searchProperties(
  params: PropertySearchParams
): Promise<PropertySearchResponse> {
  const queryParams = new URLSearchParams();

  // Add all parameters to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // For arrays, add multiple parameters with the same key
        value.forEach((item) => queryParams.append(key, String(item)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const url = `${API_BASE_URL}/properties/search?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add next.js specific caching options
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: "Failed to fetch properties" },
      }));
      throw new Error(errorData.error?.message || "Failed to fetch properties");
    }

    const data: PropertySearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching properties:", error);
    throw error;
  }
}

/**
 * Get property details by ID
 * @param propertyId Property ID
 * @param params Optional query parameters (checkIn, checkOut, etc.)
 * @returns Property details
 */
export async function getPropertyDetails(
  propertyId: string,
  params?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
  }
): Promise<PropertyDetailsResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/properties/${propertyId}${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 300, // Revalidate every 5 minutes
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: "Failed to fetch property details" },
      }));
      throw new Error(
        errorData.error?.message || "Failed to fetch property details"
      );
    }

    const data: PropertyDetailsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    throw error;
  }
}

/**
 * Get property by slug
 * @param slug Property slug
 * @param params Optional query parameters
 * @returns Property details
 */
export async function getPropertyBySlug(
  slug: string,
  params?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
  }
): Promise<PropertyDetailsResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/properties/slug/${slug}${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 300, // Revalidate every 5 minutes
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: "Failed to fetch property" },
      }));
      throw new Error(errorData.error?.message || "Failed to fetch property");
    }

    const data: PropertyDetailsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching property by slug:", error);
    throw error;
  }
}

/**
 * Get featured properties
 * @param limit Number of properties to fetch
 * @param category Optional category filter
 * @returns Featured properties
 */
export async function getFeaturedProperties(
  limit: number = 10,
  category?: string
): Promise<PropertySearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(limit));

  if (category) {
    queryParams.append("category", category);
  }

  const url = `${API_BASE_URL}/properties/featured?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: "Failed to fetch featured properties" },
      }));
      throw new Error(
        errorData.error?.message || "Failed to fetch featured properties"
      );
    }

    const data: PropertySearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    throw error;
  }
}

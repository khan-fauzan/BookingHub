"use client";

import { Button, Input } from "@/components/ui";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { useState } from "react";

export function SearchBar() {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", { destination, checkIn, checkOut, guests });
    alert("Search functionality (Frontend only - no backend integration yet)");
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-xl shadow-2xl p-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Destination Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
            <MapPin className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Where are you going?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-lg border border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-neutral-900 placeholder:text-neutral-400"
          />
        </div>

        {/* Check-in Date */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
            <Calendar className="h-5 w-5" />
          </div>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            placeholder="Check-in"
            className="w-full h-14 pl-12 pr-4 rounded-lg border border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-neutral-900"
          />
        </div>

        {/* Check-out Date */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
            <Calendar className="h-5 w-5" />
          </div>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            placeholder="Check-out"
            className="w-full h-14 pl-12 pr-4 rounded-lg border border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-neutral-900"
          />
        </div>

        {/* Guests & Search Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
              <Users className="h-5 w-5" />
            </div>
            <input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Guests"
              className="w-full h-14 pl-12 pr-4 rounded-lg border border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-neutral-900"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="h-14 px-8"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}

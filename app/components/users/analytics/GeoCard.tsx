"use client";

import React, { useMemo } from "react";
import type { User } from "../../../types";
import { I } from "../../icons";

interface GeoCardProps {
  users: User[];
  total: number;
}

const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "Japan": "🇯🇵",
    "India": "🇮🇳",
    "Brazil": "🇧🇷",
    "Russia": "🇷🇺",
    "China": "🇨🇳",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Netherlands": "🇳🇱",
    "Switzerland": "🇨🇭",
    "Sweden": "🇸🇪",
    "Norway": "🇳🇴",
    "Finland": "🇫🇮",
    "Denmark": "🇩🇰",
    "Poland": "🇵🇱",
    "Ukraine": "🇺🇦",
    "Turkey": "🇹🇷",
    "South Africa": "🇿🇦",
    "Mexico": "🇲🇽",
    "New Zealand": "🇳🇿",
  };
  return flags[country] || "🌐";
};

export function GeoCard({ users, total }: GeoCardProps) {
  const geoData = useMemo(() => {
    if (total === 0) return { countries: [], cities: [] };
    const countryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};

    users.forEach((u) => {
      const c = u.address?.country || "Other";
      const ct = u.address?.city || "Other";
      countryCounts[c] = (countryCounts[c] ?? 0) + 1;
      cityCounts[ct] = (cityCounts[ct] ?? 0) + 1;
    });

    const countries = Object.entries(countryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        flag: getCountryFlag(name),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const cities = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return { countries, cities };
  }, [users, total]);

  const maxCountryCount = useMemo(() => {
    if (geoData.countries.length === 0) return 1;
    return Math.max(...geoData.countries.map((c) => c.count), 1);
  }, [geoData.countries]);

  return (
    <div className="analytics-card animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="analytics-card-header">
        <div className="analytics-card-title-wrap">
          <I.Hash size={16} className="analytics-card-icon" />
          <span className="analytics-card-title">Geographical Density</span>
        </div>
        <span className="analytics-card-badge">Global</span>
      </div>
      <div className="analytics-card-body flex-col-geo">
        <div className="geo-country-section">
          {geoData.countries.map((c) => (
            <div key={c.name} className="geo-country-item">
              <div className="geo-country-row">
                <span className="geo-flag" title={c.name}>{c.flag}</span>
                <span className="geo-country-name" title={c.name}>{c.name}</span>
                <span className="geo-country-count tabular">
                  {c.count} <span className="geo-country-pct">{c.percentage}%</span>
                </span>
              </div>
              <div className="geo-progress-track">
                <div
                  className="geo-progress-bar"
                  style={{
                    width: `${(c.count / maxCountryCount) * 100}%`,
                    backgroundColor: "var(--accent)",
                    opacity: 0.35 + (c.count / maxCountryCount) * 0.65,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="geo-city-section">
          <div className="geo-city-title">Top Active Cities</div>
          <div className="geo-cities-grid">
            {geoData.cities.map((ct) => (
              <div key={ct.name} className="geo-city-chip">
                <span className="geo-city-dot" />
                <span className="geo-city-name" title={ct.name}>{ct.name}</span>
                <span className="geo-city-count tabular">{ct.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

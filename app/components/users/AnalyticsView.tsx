"use client";

import { useMemo } from "react";
import type { User } from "../../types";
import { I } from "../icons";

interface AnalyticsViewProps {
  users: User[];
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

export function AnalyticsView({ users }: AnalyticsViewProps) {
  const total = users.length;

  // 1. Department Breakdown
  const deptData = useMemo(() => {
    if (total === 0) return [];
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const d = u.company?.department || "Other";
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [users, total]);

  const maxDeptCount = useMemo(() => {
    if (deptData.length === 0) return 1;
    return Math.max(...deptData.map((d) => d.count), 1);
  }, [deptData]);

  // 2. Age Distribution
  const ageData = useMemo(() => {
    const groups = [
      { label: "18–25", count: 0, range: [18, 25] },
      { label: "26–35", count: 0, range: [26, 35] },
      { label: "36–45", count: 0, range: [36, 45] },
      { label: "46–55", count: 0, range: [46, 55] },
      { label: "56+", count: 0, range: [56, 120] },
    ];

    users.forEach((u) => {
      const age = u.age;
      const group = groups.find((g) => age >= g.range[0] && age <= g.range[1]);
      if (group) {
        group.count++;
      }
    });

    return groups.map((g) => ({
      label: g.label,
      count: g.count,
      percentage: total ? Math.round((g.count / total) * 100) : 0,
    }));
  }, [users, total]);

  const maxAgeCount = useMemo(() => {
    if (ageData.length === 0) return 1;
    return Math.max(...ageData.map((a) => a.count), 1);
  }, [ageData]);

  // 3. Gender Balance (SVG Donut mathematical details: R=40, C=251.3)
  const genderData = useMemo(() => {
    const maleCount = users.filter((u) => u.gender === "male").length;
    const femaleCount = users.filter((u) => u.gender === "female").length;
    const mPct = total ? Math.round((maleCount / total) * 100) : 0;
    const fPct = total ? Math.round((femaleCount / total) * 100) : 0;

    // Circumference = 2 * PI * R (R=40) = 251.327
    const circumference = 251.327;
    const femaleStrokeDash = (fPct / 100) * circumference;
    const maleStrokeDash = (mPct / 100) * circumference;

    return {
      male: maleCount,
      female: femaleCount,
      mPct,
      fPct,
      circumference,
      femaleStrokeDash,
      maleStrokeDash,
    };
  }, [users, total]);

  // 4. Geographical Breakdown
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

  if (total === 0) {
    return (
      <div className="analytics-empty-state">
        <I.Chart size={32} style={{ color: "var(--fg-muted)", marginBottom: 12 }} />
        <h3>No analytics data available</h3>
        <p>There are no users matching your active filters. Try clearing your filters to see metrics.</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* 2x2 Responsive Grid */}
      <div className="analytics-grid">
        
        {/* Card 1: Department Breakdown */}
        <div className="analytics-card animate-fade-in">
          <div className="analytics-card-header">
            <div className="analytics-card-title-wrap">
              <I.Building size={16} className="analytics-card-icon" />
              <span className="analytics-card-title">Departments</span>
            </div>
            <span className="analytics-card-badge">{deptData.length} Sectors</span>
          </div>
          <div className="analytics-card-body">
            <div className="dept-list">
              {deptData.map((d) => (
                <div key={d.name} className="dept-item">
                  <div className="dept-header">
                    <span className="dept-name" title={d.name}>{d.name}</span>
                    <span className="dept-count tabular">
                      {d.count} <span className="dept-percentage">{d.percentage}%</span>
                    </span>
                  </div>
                  <div className="dept-progress-track">
                    <div
                      className="dept-progress-bar"
                      style={{
                        width: `${(d.count / maxDeptCount) * 100}%`,
                        background: "linear-gradient(90deg, var(--accent) 0%, #8B5CF6 100%)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Gender Distribution (SVG Donut + Dual Slider) */}
        <div className="analytics-card animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="analytics-card-header">
            <div className="analytics-card-title-wrap">
              <I.Users size={16} className="analytics-card-icon" />
              <span className="analytics-card-title">Gender Distribution</span>
            </div>
            <span className="analytics-card-badge">Ratio</span>
          </div>
          <div className="analytics-card-body flex-row-layout">
            {/* SVG Donut */}
            <div className="donut-wrapper">
              <svg width="130" height="130" viewBox="0 0 100 100" className="donut-svg">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="donut-bg-ring"
                  stroke="var(--divider)"
                  strokeWidth="8"
                  fill="transparent"
                />
                
                {/* Female Segment (Pinkish Violet) */}
                {genderData.female > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="donut-segment female"
                    stroke="#EC4899"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${genderData.femaleStrokeDash} ${genderData.circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                )}

                {/* Male Segment (Indigo Accent) */}
                {genderData.male > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="donut-segment male"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${genderData.maleStrokeDash} ${genderData.circumference}`}
                    strokeDashoffset={`-${genderData.femaleStrokeDash}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                )}
              </svg>
              
              <div className="donut-center-label">
                <span className="donut-center-value tabular">{total}</span>
                <span className="donut-center-text">Total</span>
              </div>
            </div>

            {/* Legend & Details */}
            <div className="gender-legend">
              <div className="gender-legend-item">
                <div className="gender-legend-color-dot" style={{ backgroundColor: "var(--accent)" }} />
                <div className="gender-legend-text-wrap">
                  <div className="gender-label">Male Employees</div>
                  <div className="gender-stats tabular">
                    <b>{genderData.male}</b> users <span className="gender-pct male">{genderData.mPct}%</span>
                  </div>
                </div>
              </div>
              
              <div className="gender-legend-item">
                <div className="gender-legend-color-dot" style={{ backgroundColor: "#EC4899" }} />
                <div className="gender-legend-text-wrap">
                  <div className="gender-label">Female Employees</div>
                  <div className="gender-stats tabular">
                    <b>{genderData.female}</b> users <span className="gender-pct female">{genderData.fPct}%</span>
                  </div>
                </div>
              </div>

              {/* Balance bar */}
              <div className="gender-balance-slider">
                <div className="gender-balance-track">
                  <div className="gender-balance-fill-male" style={{ width: `${genderData.mPct}%` }} />
                  <div className="gender-balance-fill-female" style={{ width: `${genderData.fPct}%` }} />
                </div>
                <div className="gender-balance-labels">
                  <span>M: {genderData.mPct}%</span>
                  <span>F: {genderData.fPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Age Distribution (Animated vertical histogram) */}
        <div className="analytics-card animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="analytics-card-header">
            <div className="analytics-card-title-wrap">
              <I.Calendar size={16} className="analytics-card-icon" />
              <span className="analytics-card-title">Age Distribution</span>
            </div>
            <span className="analytics-card-badge">Histogram</span>
          </div>
          <div className="analytics-card-body">
            <div className="age-histogram-wrap">
              <div className="age-bars-container">
                {ageData.map((item, idx) => {
                  const barHeight = Math.max(8, (item.count / maxAgeCount) * 130);
                  const colors = [
                    "linear-gradient(180deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 70%, black) 100%)",
                    "linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)",
                    "linear-gradient(180deg, #EC4899 0%, #BE185D 100%)",
                    "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                    "linear-gradient(180deg, #10B981 0%, #047857 100%)",
                  ];
                  return (
                    <div key={item.label} className="age-bar-wrapper">
                      <div className="age-bar-tooltip tabular">
                        <b>{item.count}</b> users ({item.percentage}%)
                      </div>
                      <div
                        className="age-bar"
                        style={{
                          height: `${barHeight}px`,
                          background: colors[idx % colors.length],
                        }}
                      />
                      <span className="age-bar-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="age-grid-lines">
                <div className="age-grid-line" />
                <div className="age-grid-line" />
                <div className="age-grid-line" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Geography & Location Insights */}
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

      </div>
    </div>
  );
}

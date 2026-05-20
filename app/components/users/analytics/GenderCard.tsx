"use client";

import React, { useMemo } from "react";
import type { User } from "../../../types";
import { I } from "../../icons";

interface GenderCardProps {
  users: User[];
  total: number;
}

export function GenderCard({ users, total }: GenderCardProps) {
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

  return (
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
            <circle
              cx="50"
              cy="50"
              r="40"
              className="donut-bg-ring"
              stroke="var(--divider)"
              strokeWidth="8"
              fill="transparent"
            />
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
  );
}

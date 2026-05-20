"use client";

import { useEffect, useState } from "react";
import { I } from "../icons";
import { SettingsSidebar, SET_SECTIONS, type SettingsSection } from "./SettingsSidebar";
import { General } from "./pages/General";
import { Members } from "./pages/Members";
import { Roles } from "./pages/Roles";
import { Departments } from "./pages/Departments";
import { Tags } from "./pages/Tags";
import { Notifications } from "./pages/Notifications";
import { Appearance } from "./pages/Appearance";
import { Api } from "./pages/Api";
import { Integrations } from "./pages/Integrations";
import { Billing } from "./pages/Billing";
import { Security } from "./pages/Security";
import { Audit } from "./pages/Audit";
import { Danger } from "./pages/Danger";

const PAGES: Record<SettingsSection, () => React.ReactElement> = {
  general: General,
  members: Members,
  roles: Roles,
  depts: Departments,
  tags: Tags,
  notifs: Notifications,
  appear: Appearance,
  api: Api,
  integ: Integrations,
  billing: Billing,
  security: Security,
  audit: Audit,
  danger: Danger,
};

const SAVE_BAR_SECTIONS: SettingsSection[] = ["general", "notifs", "appear", "security"];

function getInitialSection(): SettingsSection {
  if (typeof window === "undefined") return "general";
  const hash = window.location.hash.replace(/^#/, "");
  const valid = SET_SECTIONS.flatMap((g) => g.items.map((i) => i.id));
  return (valid.includes(hash as SettingsSection) ? (hash as SettingsSection) : "general");
}

export function SettingsApp() {
  const [section, setSection] = useState<SettingsSection>(getInitialSection);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => setSection(getInitialSection());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleChange = (id: SettingsSection) => {
    setSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const currentItem = SET_SECTIONS.flatMap((g) => g.items).find((i) => i.id === section);
  const Page = PAGES[section];
  const showSaveBar = SAVE_BAR_SECTIONS.includes(section);

  return (
    <div className="settings-app">
      <SettingsSidebar active={section} onChange={handleChange} />

      <div className="set-main">
        <div className="set-topbar">
          <span className="set-topbar-crumb">Settings</span>
          <span className="set-topbar-sep">›</span>
          <span className="set-topbar-title">{currentItem?.label ?? "General"}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" className="ds-icon-btn" title="Help">
              <I.Globe size={13} />
            </button>
            <button type="button" className="ds-icon-btn" title="Notifications">
              <I.Bell size={13} />
            </button>
          </div>
        </div>

        <div className="set-scroll">
          <Page />

          {showSaveBar && (
            <div className="set-savebar">
              <span className="set-savebar-msg">
                <span className="dot" />
                Unsaved changes
              </span>
              <span className="spacer" />
              <button type="button" className="btn-discard">
                Discard
              </button>
              <button type="button" className="btn-save">
                <I.Check size={11} stroke={2.5} /> Save changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { I } from "../icons";
import { InvitationsPage } from "./InvitationsPage";
import { InviteComposer } from "./InviteComposer";
import { BulkInviteModal } from "./BulkInviteModal";
import type { InvTab } from "./data";

type Modal = "none" | "composer" | "bulk";

export function InvitationsApp() {
  const [tab, setTab] = useState<InvTab>("pending");
  const [modal, setModal] = useState<Modal>("none");

  const closeModal = () => setModal("none");

  return (
    <div className="inv-layout">
      <aside className="sidebar">
        <Link href="/" className="workspace" style={{ textDecoration: "none" }}>
          <div className="workspace-logo">U</div>
          <div className="workspace-name">UserBase</div>
          <I.ChevDown size={13} className="workspace-chev" />
        </Link>

        <button className="sidebar-search" type="button" title="Search (⌘K)">
          <I.Search size={13} />
          <span className="sidebar-search-text">Search</span>
          <span className="ds-kbd">⌘K</span>
        </button>

        <div className="nav-section">
          <Link href="/" className="nav-item">
            <I.Users size={14} className="nav-item-icon" />
            <span>Users</span>
          </Link>
          <Link href="/" className="nav-item">
            <I.Chart size={14} className="nav-item-icon" />
            <span>Charts</span>
          </Link>
          <Link href="/" className="nav-item">
            <I.Shield size={14} className="nav-item-icon" />
            <span>Admins</span>
          </Link>
          <button type="button" className="nav-item active">
            <I.Inbox size={14} className="nav-item-icon" />
            <span>Invitations</span>
            <span className="nav-item-count">8</span>
          </button>
        </div>

        <div className="nav-section" style={{ marginTop: 4 }}>
          <div className="nav-header">
            <span>Workspace</span>
          </div>
          <Link href="/" className="nav-item">
            <I.Hash size={13} className="nav-item-icon" />
            <span>Departments</span>
          </Link>
          <Link href="/" className="nav-item">
            <I.Tag size={13} className="nav-item-icon" />
            <span>Tags</span>
          </Link>
          <Link href="/" className="nav-item">
            <I.Settings size={13} className="nav-item-icon" />
            <span>Settings</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar">OM</div>
          <div className="sidebar-footer-name">Oleg M.</div>
          <button type="button" className="ds-icon-btn" title="Notifications">
            <I.Bell size={13} />
          </button>
        </div>
      </aside>

      <div className="inv-main">
        <div className="inv-topbar">
          <span className="topbar-title">
            <I.Inbox size={14} />
            Invitations
          </span>
          <span className="topbar-count">8 pending</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button type="button" className="ds-icon-btn">
              <I.Search size={13} />
            </button>
            <button type="button" className="ds-icon-btn">
              <I.Bell size={13} />
            </button>
            <button type="button" className="ds-icon-btn">
              <I.Settings size={13} />
            </button>
          </div>
        </div>

        <div className="inv-scroll">
          <InvitationsPage
            tab={tab}
            setTab={setTab}
            onOpenComposer={() => setModal("composer")}
            onOpenBulk={() => setModal("bulk")}
            showBulkBar={false}
          />
        </div>
      </div>

      {modal === "composer" && <InviteComposer onClose={closeModal} />}
      {modal === "bulk" && <BulkInviteModal onClose={closeModal} />}
    </div>
  );
}

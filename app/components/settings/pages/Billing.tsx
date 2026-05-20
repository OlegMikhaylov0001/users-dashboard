"use client";

import { I } from "../../icons";

interface Invoice {
  date: string;
  desc: string;
  amount: string;
  status: "green";
  label: string;
}

const INVOICES: Invoice[] = [
  { date: "Oct 14, 2026", desc: "Business · 24 seats", amount: "$576.00", status: "green", label: "Paid" },
  { date: "Sep 14, 2026", desc: "Business · 22 seats", amount: "$528.00", status: "green", label: "Paid" },
  { date: "Aug 14, 2026", desc: "Business · 22 seats", amount: "$528.00", status: "green", label: "Paid" },
  { date: "Jul 14, 2026", desc: "Business · 19 seats", amount: "$456.00", status: "green", label: "Paid" },
];

export function Billing() {
  return (
    <div className="set-content">
      <div className="set-page-head">
        <div className="set-page-title">Plan &amp; billing</div>
        <div className="set-page-sub">
          You&rsquo;re on the Business plan, billed annually. Next renewal: Nov 14, 2026.
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Plan</div>
          <div className="set-block-sub">Compare what&rsquo;s included.</div>
        </div>
        <div className="set-block-body" style={{ paddingBottom: 14 }}>
          <div className="plan-grid">
            <div className="plan-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0</div>
              <div className="plan-price-sub">forever</div>
              <div style={{ height: 8 }} />
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Up to 10 members
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Core dashboard
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Community support
              </div>
            </div>
            <div className="plan-card current">
              <div className="plan-name">Business</div>
              <div className="plan-price">$24</div>
              <div className="plan-price-sub">per member / month</div>
              <div style={{ height: 8 }} />
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Up to 50 members
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> SSO, audit log, API
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Priority email support
              </div>
            </div>
            <div className="plan-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">Custom</div>
              <div className="plan-price-sub">contact sales</div>
              <div style={{ height: 8 }} />
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Unlimited members
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Custom roles, SAML, SCIM
              </div>
              <div className="plan-feat">
                <I.Check size={11} stroke={2.5} /> Dedicated CSM
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Usage this cycle</div>
          <div className="set-block-sub">Billing cycle: Oct 14 → Nov 14.</div>
        </div>
        <div className="set-block-body">
          <div className="usage-row">
            <span>Members</span>
            <div className="usage-bar">
              <div className="usage-bar-fill" style={{ width: "48%" }} />
            </div>
            <span className="usage-num">24 / 50</span>
          </div>
          <div className="usage-row">
            <span>API calls</span>
            <div className="usage-bar">
              <div className="usage-bar-fill warn" style={{ width: "82%" }} />
            </div>
            <span className="usage-num">412k / 500k</span>
          </div>
          <div className="usage-row">
            <span>File storage</span>
            <div className="usage-bar">
              <div className="usage-bar-fill" style={{ width: "22%" }} />
            </div>
            <span className="usage-num">11.2 GB / 50 GB</span>
          </div>
          <div className="usage-row">
            <span>Webhook deliveries</span>
            <div className="usage-bar">
              <div className="usage-bar-fill over" style={{ width: "101%" }} />
            </div>
            <span className="usage-num">102k / 100k</span>
          </div>
        </div>
        <div className="set-block-foot">
          <span>Overages billed at $0.001 / extra delivery.</span>
          <span className="spacer" />
          <a className="console-link" href="#">
            View usage history <I.ArrowUpRight size={11} />
          </a>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head" style={{ display: "flex", alignItems: "center" }}>
          <div>
            <div className="set-block-title">Payment method</div>
            <div className="set-block-sub">Charged automatically on the 14th.</div>
          </div>
          <button
            type="button"
            className="ds-btn-outline"
            style={{ marginLeft: "auto", height: 28 }}
          >
            Update card
          </button>
        </div>
        <div className="set-block-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
            <div
              style={{
                width: 40,
                height: 26,
                borderRadius: 5,
                background: "linear-gradient(135deg, oklch(0.55 0.16 240), oklch(0.45 0.14 270))",
                color: "white",
                fontWeight: 800,
                fontSize: 9,
                letterSpacing: "0.05em",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-mono)",
              }}
            >
              VISA
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                Expires 09 / 2028 · Oleg M.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="set-block">
        <div className="set-block-head">
          <div className="set-block-title">Invoices</div>
          <div className="set-block-sub">PDF invoices for the last 6 cycles.</div>
        </div>
        <table className="set-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.date}>
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    color: "var(--fg-secondary)",
                  }}
                >
                  {inv.date}
                </td>
                <td>{inv.desc}</td>
                <td className="tabular" style={{ fontWeight: 500 }}>
                  {inv.amount}
                </td>
                <td>
                  <span className={`status-pill ${inv.status}`}>{inv.label}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button type="button" className="ds-btn-ghost">
                    <I.Download size={11} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

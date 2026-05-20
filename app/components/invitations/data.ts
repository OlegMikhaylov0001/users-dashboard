export type InvStatus = "sent" | "reminded" | "accepted" | "expired" | "declined";

export interface InvRow {
  email: string;
  role: "Admin" | "Member" | "Viewer";
  dept: string;
  by: string;
  byHue: number;
  byInitials: string;
  sent: string;
  expires?: string;
  accepted?: string;
  status: InvStatus;
  msg?: string;
  soon?: boolean;
}

export const PENDING: InvRow[] = [
  { email: "nia.vargas@acme.io", role: "Member", dept: "HR", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "2 min ago", expires: "in 14 days", status: "sent", msg: "Welcome to the team, Nia!" },
  { email: "theo.gunnarsson@acme.io", role: "Admin", dept: "Engineering", by: "Emma Kowalski", byHue: 280, byInitials: "EK", sent: "14 min ago", expires: "in 13 days", status: "sent" },
  { email: "ruth.mwangi@acme.io", role: "Member", dept: "Finance", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "3 hr ago", expires: "in 13 days", status: "sent" },
  { email: "dimitri.fedorov@acme.io", role: "Member", dept: "Sales", by: "Jasper Tanaka", byHue: 200, byInitials: "JT", sent: "yesterday", expires: "in 12 days", status: "reminded", msg: "Reminded 1×" },
  { email: "priya.ramesh@acme.io", role: "Member", dept: "Engineering", by: "Emma Kowalski", byHue: 280, byInitials: "EK", sent: "2 days ago", expires: "in 11 days", status: "reminded", msg: "Reminded 2×" },
  { email: "jasper.tanaka@acme.io", role: "Admin", dept: "Engineering", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "5 days ago", expires: "in 9 days", status: "sent" },
  { email: "sofia.chen@acme.io", role: "Viewer", dept: "Operations", by: "Aisha Habib", byHue: 120, byInitials: "AH", sent: "8 days ago", expires: "in 6 days", status: "sent" },
  { email: "liam.oconnor@acme.io", role: "Member", dept: "Sales", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "12 days ago", expires: "in 2 days", status: "reminded", msg: "Reminded 3× · expiring soon", soon: true },
];

export const ACCEPTED: InvRow[] = [
  { email: "emma.kowalski@acme.io", role: "Admin", dept: "Engineering", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "3 weeks ago", accepted: "accepted 3 weeks ago", status: "accepted" },
  { email: "aisha.habib@acme.io", role: "Member", dept: "Design", by: "Emma Kowalski", byHue: 280, byInitials: "EK", sent: "2 months ago", accepted: "accepted 2 months ago", status: "accepted" },
  { email: "marco.silva@acme.io", role: "Member", dept: "Marketing", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "4 months ago", accepted: "accepted 4 months ago", status: "accepted" },
];

export const EXPIRED_DECLINED: InvRow[] = [
  { email: "taylor.brooks@example.com", role: "Viewer", dept: "—", by: "Oleg M.", byHue: 30, byInitials: "OM", sent: "6 weeks ago", expires: "expired 4 weeks ago", status: "expired" },
  { email: "r.boateng@example.com", role: "Member", dept: "—", by: "Emma Kowalski", byHue: 280, byInitials: "EK", sent: "8 weeks ago", expires: "expired 6 weeks ago", status: "expired" },
  { email: "kim.park@example.com", role: "Member", dept: "Engineering", by: "Jasper Tanaka", byHue: 200, byInitials: "JT", sent: "9 weeks ago", expires: "declined 9 weeks ago", status: "declined", msg: '"Already have an account elsewhere"' },
];

export type InvTab = "pending" | "accepted" | "expired" | "empty";

export function statusLabel(s: InvStatus): string {
  switch (s) {
    case "sent":
      return "Sent";
    case "reminded":
      return "Reminded";
    case "accepted":
      return "Accepted";
    case "expired":
      return "Expired";
    case "declined":
      return "Declined";
  }
}

export function emailInitials(email: string): string {
  return email
    .split("@")[0]
    .split(".")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

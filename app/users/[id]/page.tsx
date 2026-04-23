import { getUserById, getAllUsers } from "../../lib/api";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const users = await getAllUsers();
  return users.map((u) => ({ id: String(u.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserById(Number(id));
  return {
    title: `${user.firstName} ${user.lastName} — Users Dashboard`,
    description: `${user.company.title} at ${user.company.name}`,
  };
}

const roleStyles: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  moderator: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  user: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 wrap-break-word">
        {value ?? "—"}
      </dd>
    </div>
  );
}


export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(Number(id));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {user.firstName} {user.lastName}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero card */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative w-24 h-24 shrink-0">
            <Image
              src={user.image}
              alt={`${user.firstName} ${user.lastName}`}
              fill
              className="rounded-xl object-cover"
              sizes="96px"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {user.firstName} {user.maidenName ? `"${user.maidenName}" ` : ""}{user.lastName}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleStyles[user.role]}`}>
                {user.role}
              </span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">{user.company.title} · {user.company.name}</p>
            <p className="text-indigo-600 dark:text-indigo-400 text-sm">{user.company.department}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span>@{user.username}</span>
              <a href={`mailto:${user.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {user.email}
              </a>
              <a href={`tel:${user.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {user.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Personal">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Age" value={user.age} />
              <Field label="Gender" value={user.gender} />
              <Field label="Birth date" value={user.birthDate} />
              <Field label="Blood group" value={user.bloodGroup} />
              <Field label="Height" value={`${user.height} cm`} />
              <Field label="Weight" value={`${user.weight} kg`} />
              <Field label="Eye color" value={user.eyeColor} />
              <Field label="Hair" value={`${user.hair.color} · ${user.hair.type}`} />
              <Field label="University" value={user.university} />
            </dl>
          </Section>

          <Section title="Contact & Address">
            <dl className="grid grid-cols-1 gap-y-4">
              <Field label="Address" value={user.address.address} />
              <Field label="City / State" value={`${user.address.city}, ${user.address.state}`} />
              <Field label="ZIP" value={user.address.postalCode} />
              <Field label="Country" value={user.address.country} />
              <Field label="IP address" value={user.ip} />
              <Field label="MAC address" value={user.macAddress} />
            </dl>
          </Section>

          <Section title="Company">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Company" value={user.company.name} />
              <Field label="Department" value={user.company.department} />
              <Field label="Title" value={user.company.title} />
              <Field label="Office address" value={user.company.address.address} />
              <Field label="City" value={`${user.company.address.city}, ${user.company.address.state}`} />
            </dl>
          </Section>

          <Section title="Banking">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Card type" value={user.bank.cardType} />
              <Field label="Expires" value={user.bank.cardExpire} />
              <Field label="Currency" value={user.bank.currency} />
            </dl>
          </Section>

          <Section title="Crypto">
            <dl className="grid grid-cols-1 gap-y-4">
              <Field label="Coin" value={user.crypto.coin} />
              <Field label="Network" value={user.crypto.network} />
              <Field label="Wallet" value={user.crypto.wallet} />
            </dl>
          </Section>

          <Section title="System">
            <dl className="grid grid-cols-1 gap-y-4">
              <Field label="User ID" value={user.id} />
              <Field label="Username" value={user.username} />
              <div>
                <dt className="text-xs text-zinc-400 dark:text-zinc-500">User agent</dt>
                <dd className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 break-all font-mono leading-relaxed">
                  {user.userAgent}
                </dd>
              </div>
            </dl>
          </Section>
        </div>
      </main>
    </div>
  );
}

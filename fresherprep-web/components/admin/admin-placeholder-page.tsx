import Link from "next/link";

import { Card, CardContent } from "@/components/ui";

export function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{description}</p><Card className="mt-8"><CardContent><p className="text-sm font-semibold text-text">Management foundation ready</p><p className="mt-2 text-sm leading-6 text-text-muted">Detailed CRUD workflows are intentionally reserved for the next admin implementation job.</p><Link href="/admin" className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary">Return to admin overview</Link></CardContent></Card></div>;
}

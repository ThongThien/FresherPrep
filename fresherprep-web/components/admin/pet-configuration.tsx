"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, Input, Label, Textarea } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type { AdminPage } from "@/lib/admin/types";
import type { AdminUserPet, PetConfiguration, PetDefinition } from "@/lib/pet/types";
import { useI18n } from "@/lib/i18n";

import {
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminToolbar,
  type AdminTableColumn,
} from "./admin-ui";

export function PetConfigurationPage() {
  const { t } = useI18n();
  const [config, setConfig] = useState<PetConfiguration>();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setConfig(await adminRequest<PetConfiguration>("pet-config"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load Pet configuration."));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!config || pending) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      setConfig(await adminRequest<PetConfiguration>("pet-config", {
        method: "PUT",
        ...jsonBody(config),
      }));
      setSuccess(t("Pet configuration saved."));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to save Pet configuration."));
    } finally { setPending(false); }
  }

  function numberField(field: keyof PetConfiguration, value: string) {
    setConfig((current) => current ? { ...current, [field]: Number(value) } : current);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title={t("Learning Pet configuration")} description={t("Configure rewards and a collection of Pets with any number of levels.")} />
      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}><p>{error}</p>{!config ? <Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>{t("Try again")}</Button> : null}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}
      {loading ? <div className="mt-8 h-80 animate-pulse rounded-lg bg-surface motion-reduce:animate-none" role="status"><span className="sr-only">{t("Loading Pet configuration...")}</span></div> : null}
      {config ? <form className="mt-8 space-y-6" onSubmit={save}>
        <Card><CardContent>
          <h2 className="text-lg font-semibold text-text">{t("Reward and conversion rules")}</h2>
          <p className="mt-1 text-sm text-text-muted">{t("Changes apply to future rewards and actions. Existing totals are preserved.")}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField id="pet-lesson-points" label={t("Points per completed lesson")} min={0} value={config.lessonCompletionPoints} onChange={(value) => numberField("lessonCompletionPoints", value)} />
            <NumberField id="pet-quiz-points" label={t("Points per first Quiz pass")} min={0} value={config.quizPassPoints} onChange={(value) => numberField("quizPassPoints", value)} />
            <NumberField id="pet-points-food" label={t("Points required per Food")} min={1} value={config.pointsPerFood} onChange={(value) => numberField("pointsPerFood", value)} />
            <NumberField id="pet-energy-food" label={t("Energy gained per Food")} min={1} value={config.energyPerFood} onChange={(value) => numberField("energyPerFood", value)} />
          </div>
        </CardContent></Card>

        <Button type="submit" size="lg" loading={pending}>{t("Save Pet configuration")}</Button>
      </form> : null}
      <PetDefinitionManagement />
      <UserPetManagement />
    </div>
  );
}

const emptyPet = (): PetDefinition => ({
  id: "", code: "", active: true, displayOrder: 0,
  name: { vi: "", en: "" }, description: { vi: "", en: "" },
  learningMeaning: { vi: "", en: "" },
  levels: [{ level: 1, name: { vi: "", en: "" }, description: { vi: "", en: "" }, requiredEnergy: 0, assetReference: "pets/pet-code/lv1.webp" }],
});

function PetDefinitionManagement() {
  const { t } = useI18n();
  const [pets, setPets] = useState<PetDefinition[]>([]);
  const [editing, setEditing] = useState<PetDefinition>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    try { setPets(await adminRequest<PetDefinition[]>("pet-config/pets")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t("Unable to load Pets.")); }
  }, [t]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function text(field: "name" | "description" | "learningMeaning", locale: "vi" | "en", value: string) {
    setEditing((pet) => pet ? { ...pet, [field]: { ...pet[field], [locale]: value } } : pet);
  }
  function levelText(index: number, field: "name" | "description", locale: "vi" | "en", value: string) {
    setEditing((pet) => pet ? { ...pet, levels: pet.levels.map((level, i) => i === index ? { ...level, [field]: { ...level[field], [locale]: value } } : level) } : pet);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!editing || pending) return; setPending(true); setError(undefined);
    try {
      const path = editing.id ? "pet-config/pets/" + editing.id : "pet-config/pets";
      await adminRequest(path, { method: editing.id ? "PUT" : "POST", ...jsonBody(editing) });
      setEditing(undefined); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("Unable to save Pet.")); }
    finally { setPending(false); }
  }
  return <section className="mt-12 border-t border-border pt-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-text">{t("Pet definitions")}</h2><p className="mt-2 text-sm text-text-muted">{t("Manage multilingual Pets, level requirements, and static asset references.")}</p></div><Button variant="secondary" onClick={() => setEditing(emptyPet())}>{t("Create Pet")}</Button></div>
    {error ? <Feedback className="mt-4" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{pets.map((pet) => <Card key={pet.id}><CardContent><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-text">{pet.name.vi} / {pet.name.en}</p><p className="mt-1 text-xs text-text-subtle">{pet.code} � {pet.levels.length} {t("levels")}</p></div><Badge variant={pet.active ? "success" : "neutral"}>{pet.active ? t("ACTIVE") : t("INACTIVE")}</Badge></div><Button className="mt-4" size="sm" variant="secondary" onClick={() => setEditing(structuredClone(pet))}>{t("Edit")}</Button></CardContent></Card>)}</div>
    {editing ? <form className="mt-6 space-y-5 rounded-lg border border-border bg-surface p-5" onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="pet-code">{t("Code")}</Label><Input id="pet-code" required value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div><NumberField id="pet-order" label={t("Display order")} min={0} value={editing.displayOrder} onChange={(value) => setEditing({ ...editing, displayOrder: Number(value) })} /></div>
      {(["name", "description", "learningMeaning"] as const).map((field) => <div className="grid gap-4 sm:grid-cols-2" key={field}>{(["vi", "en"] as const).map((locale) => <div key={locale}><Label htmlFor={field + locale}>{t(field === "learningMeaning" ? "Learning meaning" : field === "name" ? "Name" : "Description")} ({locale.toUpperCase()})</Label><Textarea id={field + locale} required value={editing[field][locale]} onChange={(e) => text(field, locale, e.target.value)} /></div>)}</div>)}
      <label className="flex items-center gap-2 text-sm text-text"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />{t("Active")}</label>
      <div className="space-y-4">{editing.levels.map((level, index) => <Card key={index}><CardContent><div className="flex justify-between"><h3 className="font-semibold text-text">{t("Pet Level {{level}}", { level: index + 1 })}</h3>{editing.levels.length > 1 ? <Button type="button" size="sm" variant="ghost" onClick={() => setEditing({ ...editing, levels: editing.levels.filter((_, i) => i !== index).map((item, i) => ({ ...item, level: i + 1 })) })}>{t("Delete")}</Button> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{(["vi", "en"] as const).map((locale) => <div key={locale}><Label htmlFor={"ln"+index+locale}>{t("Name")} ({locale.toUpperCase()})</Label><Input id={"ln"+index+locale} required value={level.name[locale]} onChange={(e) => levelText(index, "name", locale, e.target.value)} /></div>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><NumberField id={"energy"+index} label={t("Energy required to upgrade")} min={0} value={level.requiredEnergy} onChange={(value) => setEditing({ ...editing, levels: editing.levels.map((item, i) => i === index ? { ...item, requiredEnergy: Number(value) } : item) })} /><div><Label htmlFor={"asset"+index}>{t("Static asset reference")}</Label><Input id={"asset"+index} required value={level.assetReference} onChange={(e) => setEditing({ ...editing, levels: editing.levels.map((item, i) => i === index ? { ...item, assetReference: e.target.value } : item) })} /></div></div>{(["vi", "en"] as const).map((locale) => <div className="mt-3" key={locale}><Label htmlFor={"ld"+index+locale}>{t("Description")} ({locale.toUpperCase()})</Label><Textarea id={"ld"+index+locale} required value={level.description[locale]} onChange={(e) => levelText(index, "description", locale, e.target.value)} /></div>)}</CardContent></Card>)}</div>
      <Button type="button" variant="secondary" onClick={() => setEditing({ ...editing, levels: [...editing.levels, { level: editing.levels.length + 1, name: { vi: "", en: "" }, description: { vi: "", en: "" }, requiredEnergy: 0, assetReference: "pets/" + (editing.code || "pet-code").toLowerCase() + "/lv" + (editing.levels.length + 1) + ".webp" }] })}>{t("Add level")}</Button>
      <div className="flex gap-3"><Button type="submit" loading={pending}>{t("Save changes")}</Button><Button type="button" variant="ghost" onClick={() => setEditing(undefined)}>{t("Cancel")}</Button></div>
    </form> : null}
  </section>;
}

function NumberField({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max?: number; onChange: (value: string) => void }) {
  return <div><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={min} max={max} required value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function UserPetManagement() {
  const { locale, t } = useI18n();
  const [pets, setPets] = useState<AdminUserPet[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const params = new URLSearchParams({
      page: String(page),
      size: "20",
      sort: "updatedAt,desc",
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const result = await adminRequest<AdminPage<AdminUserPet>>("pet-config/users?" + params.toString());
      setPets(result.content);
      setTotalPages(result.totalPages);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load user Pets."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ), [locale]);

  const columns: readonly AdminTableColumn<AdminUserPet>[] = [
    {
      key: "user",
      header: t("User"),
      cell: (pet) => <div><p className="font-semibold text-text">{pet.displayName}</p><p className="mt-1 text-xs">{pet.email}</p></div>,
    },
    {
      key: "role",
      header: t("Role"),
      cell: (pet) => <Badge variant={pet.role === "ADMIN" ? "info" : pet.role === "CONTRIBUTOR" ? "warning" : "neutral"}>{pet.role}</Badge>,
    },
    { key: "level", header: t("Pet Level"), cell: (pet) => <span className="font-semibold text-text">{pet.currentLevel}</span> },
    { key: "points", header: t("Learning Points"), cell: (pet) => pet.totalLearningPoints },
    { key: "food", header: t("Available Food"), cell: (pet) => pet.availableFood },
    { key: "energy", header: t("Energy"), cell: (pet) => pet.energy },
    { key: "updated", header: t("Updated at"), cell: (pet) => dateFormatter.format(new Date(pet.updatedAt)) },
  ];

  return (
    <section className="mt-12 border-t border-border pt-8" aria-labelledby="user-pets-title">
      <div>
        <h2 className="text-2xl font-semibold text-text" id="user-pets-title">{t("User Pets")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">{t("Monitor Pet progress for users who have initialized their Learning Pet.")}</p>
      </div>
      <div className="mt-5">
        <AdminToolbar>
          <AdminSearch value={search} onChange={setSearch} label={t("Search Pet users")} placeholder={t("Search by name or email")} />
        </AdminToolbar>
      </div>
      <div className="mt-5">
        {loading ? <AdminLoadingState label={t("Loading user Pets...")} /> : error ? (
          <AdminErrorState title={t("Unable to load user Pets")} message={error} onRetry={() => void load()} />
        ) : pets.length ? (
          <>
            <AdminDataTable columns={columns} rows={pets} rowKey={(pet) => pet.petId} caption={t("Pet user accounts")} />
            <AdminPagination page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
          </>
        ) : (
          <AdminEmptyState
            title={t("No initialized Pets")}
            description={t("A Pet appears here after a user opens their Learning Pet for the first time.")}
          />
        )}
      </div>
    </section>
  );
}

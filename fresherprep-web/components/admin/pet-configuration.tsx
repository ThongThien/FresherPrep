"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, Input, Label, Textarea } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type { AdminPage } from "@/lib/admin/types";
import type { AdminUserPet, PetConfiguration } from "@/lib/pet/types";
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

  function numberField(field: keyof Pick<PetConfiguration, "lessonCompletionPoints" | "quizPassPoints" | "pointsPerFood" | "energyPerFood" | "maximumLevel">, value: string) {
    setConfig((current) => current ? { ...current, [field]: Number(value) } : current);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title={t("Learning Pet configuration")} description={t("Configure rewards, Food conversion, Energy, and the three Pet levels.")} />
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
            <NumberField id="pet-max-level" label={t("Maximum Pet level")} min={1} max={3} value={config.maximumLevel} onChange={(value) => numberField("maximumLevel", value)} />
          </div>
        </CardContent></Card>

        <div className="grid gap-5 lg:grid-cols-3">
          {config.levels.map((level, index) => <Card key={level.level}><CardContent>
            <h2 className="text-lg font-semibold text-text">{t("Pet Level {{level}}", { level: level.level })}</h2>
            <div className="mt-5 space-y-4">
              <div><Label htmlFor={`pet-level-${level.level}-name`}>{t("Name")}</Label><Input id={`pet-level-${level.level}-name`} maxLength={100} required value={level.name} onChange={(event) => setConfig((current) => current ? { ...current, levels: current.levels.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) } : current)} /></div>
              <div><Label htmlFor={`pet-level-${level.level}-description`}>{t("Description")}</Label><Textarea id={`pet-level-${level.level}-description`} className="min-h-28" maxLength={300} required value={level.description} onChange={(event) => setConfig((current) => current ? { ...current, levels: current.levels.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) } : current)} /></div>
              <NumberField id={`pet-level-${level.level}-energy`} label={t("Energy required to upgrade")} min={0} value={level.requiredEnergy} onChange={(value) => setConfig((current) => current ? { ...current, levels: current.levels.map((item, itemIndex) => itemIndex === index ? { ...item, requiredEnergy: Number(value) } : item) } : current)} />
              {level.level === config.maximumLevel ? <p className="text-xs text-text-subtle">{t("Energy is ignored while this is the maximum level.")}</p> : null}
            </div>
          </CardContent></Card>)}
        </div>
        <Button type="submit" size="lg" loading={pending}>{t("Save Pet configuration")}</Button>
      </form> : null}
      <UserPetManagement />
    </div>
  );
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

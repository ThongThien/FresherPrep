"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, FieldError, Input, Label, Select } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type {
  AdminPage,
  ContentStatus,
  KnowledgeNode,
  LearningPathDetail,
  LearningPathItem,
  LearningPathSummary,
  LessonSummary,
} from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

const emptyForm = { name: "", slug: "", technologyId: "" };
const statuses: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];

export function LearningPathManagement() {
  const { t } = useI18n();
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [technologies, setTechnologies] = useState<KnowledgeNode[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [detail, setDetail] = useState<LearningPathDetail>();
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [validation, setValidation] = useState<Record<string, string>>({});

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [pathPage, nodes, lessonPage] = await Promise.all([
        adminRequest<AdminPage<LearningPathSummary>>("learning-paths?page=0&size=200&sort=name,asc"),
        adminRequest<KnowledgeNode[]>("knowledge/nodes"),
        adminRequest<AdminPage<LessonSummary>>("lessons?page=0&size=200&sort=title,asc"),
      ]);
      setPaths(pathPage.content);
      setTechnologies(nodes.filter((node) => node.type === "TECHNOLOGY"));
      setLessons(lessonPage.content);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLists(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLists]);

  const visiblePaths = useMemo(() => paths.filter((path) =>
    `${path.name} ${path.slug} ${path.technologyName}`.toLowerCase().includes(query.toLowerCase()),
  ), [paths, query]);

  async function selectPath(pathId: string) {
    setError(undefined);
    setSuccess(undefined);
    try {
      const selected = await adminRequest<LearningPathDetail>(`learning-paths/${pathId}`);
      setDetail(selected);
      setForm({ name: selected.name, slug: selected.slug, technologyId: selected.technologyId });
      setValidation({});
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  function startCreate() {
    setDetail(undefined);
    setForm(emptyForm);
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = "Use lowercase letters, numbers, and hyphens.";
    if (!detail && !form.technologyId) errors.technologyId = "Select a technology.";
    setValidation(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = detail
        ? { name: form.name.trim(), slug: form.slug.trim() }
        : { name: form.name.trim(), slug: form.slug.trim(), technologyId: form.technologyId };
      const saved = await adminRequest<LearningPathDetail>(
        detail ? `learning-paths/${detail.id}` : "learning-paths",
        { method: detail ? "PUT" : "POST", ...jsonBody(payload) },
      );
      await loadLists();
      await selectPath(saved.id);
      setSuccess(detail ? "Learning path updated." : "Learning path created.");
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(status: ContentStatus) {
    if (!detail) return;
    setPending(true);
    setError(undefined);
    try {
      const saved = await adminRequest<LearningPathDetail>(`learning-paths/${detail.id}/status`, {
        method: "PATCH",
        ...jsonBody({ status }),
      });
      setDetail(saved);
      await loadLists();
      setSuccess(`Status changed to ${status.toLowerCase()}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function deletePath() {
    if (!detail || !window.confirm("Delete this learning path? This cannot be undone.")) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`learning-paths/${detail.id}`, { method: "DELETE" });
      startCreate();
      await loadLists();
      setSuccess("Learning path deleted.");
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function reloadDetail(message?: string) {
    if (!detail) return;
    const refreshed = await adminRequest<LearningPathDetail>(`learning-paths/${detail.id}`);
    setDetail(refreshed);
    if (message) setSuccess(message);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t("Learning paths")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{t("Create curricula and maintain their ordered lesson sequence.")}</p></div>
        <Button onClick={startCreate}>{t("New learning path")}</Button>
      </header>
      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
        <Card><CardContent>
          <Label htmlFor="path-search">{t("Search paths")}</Label>
          <Input id="path-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Name, slug, or technology")} />
          {loading ? <p className="py-10 text-center text-sm text-text-muted">{t("Loading learning paths...")}</p> : visiblePaths.length ? <ul className="mt-5 space-y-2">{visiblePaths.map((path) => <li key={path.id}><button type="button" onClick={() => void selectPath(path.id)} className={`w-full rounded-md border p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${detail?.id === path.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}><span className="flex items-start justify-between gap-2"><span className="font-semibold text-text">{path.name}</span><PathStatus status={path.status} /></span><span className="mt-1 block text-xs text-text-muted">{path.technologyName} · {path.slug}</span></button></li>)}</ul> : <p className="py-10 text-center text-sm text-text-muted">{t("No matching learning paths.")}</p>}
        </CardContent></Card>

        <div className="space-y-6">
          <Card><CardContent>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-text">{detail ? t("Edit learning path") : t("Create learning path")}</h2><p className="mt-1 text-sm text-text-muted">{detail ? t("Technology is fixed after creation by the backend contract.") : t("Choose the technology this path belongs to.")}</p></div>{detail ? <PathStatus status={detail.status} /> : null}</div>
            <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit} noValidate>
              <div><Label htmlFor="path-name">{t("Name")}</Label><Input id="path-name" aria-invalid={Boolean(validation.name)} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />{validation.name ? <FieldError>{validation.name}</FieldError> : null}</div>
              <div><Label htmlFor="path-slug">{t("Slug")}</Label><Input id="path-slug" aria-invalid={Boolean(validation.slug)} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} />{validation.slug ? <FieldError>{validation.slug}</FieldError> : null}</div>
              <div className="sm:col-span-2"><Label htmlFor="path-technology">{t("Technology")}</Label><Select id="path-technology" disabled={Boolean(detail)} aria-invalid={Boolean(validation.technologyId)} value={form.technologyId} onChange={(event) => setForm((current) => ({ ...current, technologyId: event.target.value }))}><option value="">{t("Select technology")}</option>{technologies.map((node) => <option key={node.id} value={node.id}>{node.name} ({node.status})</option>)}</Select>{validation.technologyId ? <FieldError>{validation.technologyId}</FieldError> : null}</div>
              <div className="sm:col-span-2"><Button type="submit" loading={pending}>{detail ? t("Save changes") : t("Create path")}</Button></div>
            </form>
            {detail ? <div className="mt-7 border-t border-border pt-6"><h3 className="text-sm font-semibold text-text">{t("Publishing status")}</h3><div className="mt-3 flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} size="sm" variant="secondary" disabled={pending || detail.status === status} onClick={() => void changeStatus(status)}>{t(status)}</Button>)}</div><Button className="mt-6" size="sm" variant="danger" loading={pending} onClick={() => void deletePath()}>{t("Delete path")}</Button></div> : null}
          </CardContent></Card>

          {detail ? <PathItems key={detail.id} path={detail} lessons={lessons} onChanged={reloadDetail} onError={setError} /> : null}
        </div>
      </div>
    </div>
  );
}

function PathItems({ path, lessons, onChanged, onError }: { path: LearningPathDetail; lessons: LessonSummary[]; onChanged: (message?: string) => Promise<void>; onError: (value: string) => void }) {
  const { t } = useI18n();
  const [lessonId, setLessonId] = useState("");
  const [required, setRequired] = useState(true);
  const [weight, setWeight] = useState(1);
  const [pending, setPending] = useState(false);
  const available = lessons.filter((lesson) => !path.items.some((item) => item.lessonId === lesson.id));

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!lessonId) return onError("Select a lesson to add.");
    setPending(true);
    onError("");
    try {
      await adminRequest(`learning-paths/${path.id}/items`, { method: "POST", ...jsonBody({ lessonId, required, weight }) });
      setLessonId("");
      await onChanged("Lesson added to the learning path.");
    } catch (reason) {
      onError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  return <Card><CardContent><div><h2 className="text-lg font-semibold text-text">{t("Path lessons")}</h2><p className="mt-1 text-sm text-text-muted">{t("Order is controlled by display order; required and weight drive backend progress.")}</p></div>
    {path.items.length ? <div className="mt-5 space-y-3">{[...path.items].sort((a, b) => a.displayOrder - b.displayOrder).map((item) => <PathItemEditor key={item.id} pathId={path.id} item={item} pending={pending} setPending={setPending} onChanged={onChanged} onError={onError} />)}</div> : <p className="mt-5 rounded-md border border-dashed border-border p-5 text-sm text-text-muted">{t("No lessons have been added.")}</p>}
    <form className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2" onSubmit={addItem}>
      <div className="sm:col-span-2"><Label htmlFor="item-lesson">{t("Add lesson")}</Label><Select id="item-lesson" value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">{t("Select lesson")}</option>{available.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} ({lesson.status})</option>)}</Select></div>
      <div className="sm:col-span-2"><p className="text-xs leading-5 text-text-muted">{t("New lessons are appended after the current last lesson. You can reorder them afterward.")}</p></div>
      <div><Label htmlFor="item-weight">{t("Weight")}</Label><Input id="item-weight" type="number" min={1} value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></div>
      <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-text"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} className="size-4 accent-primary" />{t("Required lesson")}</label>
      <div className="sm:text-right"><Button type="submit" loading={pending}>{t("Add lesson")}</Button></div>
    </form>
  </CardContent></Card>;
}

function PathItemEditor({ pathId, item, pending, setPending, onChanged, onError }: { pathId: string; item: LearningPathItem; pending: boolean; setPending: (value: boolean) => void; onChanged: (message?: string) => Promise<void>; onError: (value: string) => void }) {
  const { t } = useI18n();
  const [order, setOrder] = useState(item.displayOrder);
  const [required, setRequired] = useState(item.required);
  const [weight, setWeight] = useState(item.weight);
  async function save() {
    setPending(true);
    try {
      await adminRequest(`learning-paths/${pathId}/items/${item.id}`, { method: "PUT", ...jsonBody({ displayOrder: order, required, weight }) });
      await onChanged("Learning path item updated.");
    } catch (reason) { onError(messageOf(reason)); } finally { setPending(false); }
  }
  async function remove() {
    if (!window.confirm(`Remove ${item.lessonTitle} from this path?`)) return;
    setPending(true);
    try {
      await adminRequest<void>(`learning-paths/${pathId}/items/${item.id}`, { method: "DELETE" });
      await onChanged("Lesson removed from the learning path.");
    } catch (reason) { onError(messageOf(reason)); } finally { setPending(false); }
  }
  return <div className="rounded-md border border-border p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text">{item.lessonTitle}</p><p className="mt-1 text-xs text-text-muted">{t(item.lessonStatus)}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div><Label className="text-xs">{t("Order")}</Label><Input className="w-24" type="number" min={0} value={order} onChange={(event) => setOrder(Number(event.target.value))} /></div><div><Label className="text-xs">{t("Weight")}</Label><Input className="w-24" type="number" min={1} value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></div><label className="flex items-center gap-2 self-end pb-2 text-sm text-text"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} className="size-4 accent-primary" />{t("Required")}</label></div><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={pending} onClick={() => void save()}>{t("Save")}</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => void remove()}>{t("Remove")}</Button></div></div></div>;
}

function PathStatus({ status }: { status: ContentStatus }) {
  const { t } = useI18n();
  return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "DRAFT" ? "info" : "neutral"}>{t(status)}</Badge>;
}
function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "The request could not be completed."; }

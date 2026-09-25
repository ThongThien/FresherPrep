"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Feedback,
  FieldError,
  Input,
  Label,
  Select,
} from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type { ContentStatus, KnowledgeNode, KnowledgeNodeType } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

const nodeTypes: KnowledgeNodeType[] = ["TECHNOLOGY", "CATEGORY", "TOPIC", "SUBTOPIC"];
const expectedParent: Record<KnowledgeNodeType, KnowledgeNodeType | null> = {
  TECHNOLOGY: null,
  CATEGORY: "TECHNOLOGY",
  TOPIC: "CATEGORY",
  SUBTOPIC: "TOPIC",
};
const statuses: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const emptyForm = { type: "TECHNOLOGY" as KnowledgeNodeType, parentId: "", name: "", slug: "", displayOrder: 0 };

export function KnowledgeManagement() {
  const { t } = useI18n();
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [validation, setValidation] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setNodes(await adminRequest<KnowledgeNode[]>("knowledge/nodes"));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const flattened = useMemo(() => flattenTree(nodes), [nodes]);
  const visible = flattened.filter(({ node }) =>
    `${node.name} ${node.slug} ${node.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  const parentType = expectedParent[form.type];
  const parentOptions = parentType ? nodes.filter((node) => node.type === parentType && node.id !== selectedId) : [];

  function startCreate() {
    setSelectedId(undefined);
    setForm(emptyForm);
    clearMessages();
  }

  function selectNode(node: KnowledgeNode) {
    setSelectedId(node.id);
    setForm({
      type: node.type,
      parentId: node.parentId ?? "",
      name: node.name,
      slug: node.slug,
      displayOrder: node.displayOrder,
    });
    clearMessages();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("Name is required.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = t("Use lowercase letters, numbers, and hyphens.");
    if (form.displayOrder < 0) errors.displayOrder = t("Display order cannot be negative.");
    if (parentType && !form.parentId) errors.parentId = t("Select a {{type}} parent.", { type: parentType.toLowerCase() });
    setValidation(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = {
        type: form.type,
        parentId: form.parentId || null,
        name: form.name.trim(),
        slug: form.slug.trim(),
        displayOrder: form.displayOrder,
      };
      const saved = await adminRequest<KnowledgeNode>(
        selectedId ? `knowledge/nodes/${selectedId}` : "knowledge/nodes",
        { method: selectedId ? "PUT" : "POST", ...jsonBody(payload) },
      );
      await load();
      selectNode(saved);
      setSuccess(selectedId ? t("Knowledge node updated.") : t("Knowledge node created."));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(status: ContentStatus) {
    if (!selectedId) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const updated = await adminRequest<KnowledgeNode>(`knowledge/nodes/${selectedId}/status`, {
        method: "PATCH",
        ...jsonBody({ status }),
      });
      await load();
      selectNode(updated);
      setSuccess(t("Status changed to {{status}}.", { status: status.toLowerCase() }));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function deleteNode() {
    if (!selectedId || !window.confirm(t("Delete this knowledge node? This cannot be undone."))) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`knowledge/nodes/${selectedId}`, { method: "DELETE" });
      startCreate();
      await load();
      setSuccess(t("Knowledge node deleted."));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  function clearMessages() {
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        title={t("Knowledge hierarchy")}
        description={t("Manage the Technology → Category → Topic → Subtopic curriculum structure.")}
        action={<Button onClick={startCreate}>{t("New node")}</Button>}
      />
      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <Card>
          <CardContent>
            <Label htmlFor="knowledge-search">{t("Search hierarchy")}</Label>
            <Input id="knowledge-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search by name, slug, or type")} />
            <div className="mt-5">
              {loading ? <Loading label={t("Loading knowledge nodes")} /> : visible.length ? (
                <ul className="space-y-1" aria-label={t("Knowledge hierarchy")}>
                  {visible.map(({ node, depth }) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => selectNode(node)}
                        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${selectedId === node.id ? "border-primary/40 bg-primary-subtle" : "border-transparent"}`}
                        style={{ paddingLeft: `${12 + depth * 18}px` }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text">{node.name}</span>
                          <span className="block truncate text-xs text-text-muted">{node.type} · {node.slug} · {t("order {{order}}", { order: node.displayOrder })}</span>
                        </span>
                        <StatusBadge status={node.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="py-8 text-center text-sm text-text-muted">{t("No matching knowledge nodes.")}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text">{selectedId ? t("Edit node") : t("Create node")}</h2>
                <p className="mt-1 text-sm text-text-muted">{t("Parent choices follow the four-level hierarchy.")}</p>
              </div>
              {selectedId ? <StatusBadge status={nodes.find((node) => node.id === selectedId)?.status ?? "DRAFT"} /> : null}
            </div>
            <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
              <div>
                <Label htmlFor="node-type">{t("Node type")}</Label>
                <Select id="node-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as KnowledgeNodeType, parentId: "" }))}>
                  {nodeTypes.map((type) => <option key={type}>{type}</option>)}
                </Select>
              </div>
              {parentType ? <div>
                <Label htmlFor="node-parent">{t("Parent {{type}}", { type: parentType.toLowerCase() })}</Label>
                <Select id="node-parent" aria-invalid={Boolean(validation.parentId)} value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}>
                  <option value="">{t("Select parent")}</option>
                  {parentOptions.map((node) => <option key={node.id} value={node.id}>{node.name} ({node.status})</option>)}
                </Select>
                {validation.parentId ? <FieldError>{validation.parentId}</FieldError> : null}
              </div> : null}
              <div>
                <Label htmlFor="node-name">{t("Name")}</Label>
                <Input id="node-name" maxLength={150} aria-invalid={Boolean(validation.name)} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                {validation.name ? <FieldError>{validation.name}</FieldError> : null}
              </div>
              <div>
                <Label htmlFor="node-slug">{t("Slug")}</Label>
                <Input id="node-slug" maxLength={180} aria-invalid={Boolean(validation.slug)} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} />
                {validation.slug ? <FieldError>{validation.slug}</FieldError> : null}
              </div>
              <div>
                <Label htmlFor="node-order">{t("Display order")}</Label>
                <Input id="node-order" type="number" min={0} aria-invalid={Boolean(validation.displayOrder)} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} />
                {validation.displayOrder ? <FieldError>{validation.displayOrder}</FieldError> : null}
              </div>
              <Button type="submit" loading={pending}>{selectedId ? t("Save changes") : t("Create node")}</Button>
            </form>

            {selectedId ? <div className="mt-7 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-text">{t("Publishing status")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {statuses.map((status) => <Button key={status} size="sm" variant="secondary" disabled={pending || nodes.find((node) => node.id === selectedId)?.status === status} onClick={() => void changeStatus(status)}>{t(status)}</Button>)}
              </div>
              <Button className="mt-6" size="sm" variant="danger" loading={pending} onClick={() => void deleteNode()}>{t("Delete node")}</Button>
            </div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function flattenTree(nodes: KnowledgeNode[]) {
  const byParent = new Map<string | null, KnowledgeNode[]>();
  nodes.forEach((node) => {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  });
  byParent.forEach((list) => list.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)));
  const result: { node: KnowledgeNode; depth: number }[] = [];
  const seen = new Set<string>();
  function visit(parentId: string | null, depth: number) {
    for (const node of byParent.get(parentId) ?? []) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      result.push({ node, depth });
      visit(node.id, depth + 1);
    }
  }
  visit(null, 0);
  nodes.filter((node) => !seen.has(node.id)).forEach((node) => result.push({ node, depth: 0 }));
  return result;
}

function AdminHeader({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  const { t } = useI18n();
  return <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p></div>{action}</header>;
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const { t } = useI18n();
  return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "ARCHIVED" ? "neutral" : "info"}>{t(status)}</Badge>;
}

function Loading({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-text-muted" role="status"><span className="mx-auto mb-3 block size-5 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none" />{label}</div>;
}

function messageOf(reason: unknown) {
  return reason instanceof Error ? reason.message : "The request could not be completed.";
}

"use client";

import { useCallback, useEffect, useState } from "react";

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
import { KnowledgeTree } from "./knowledge-tree";

const expectedParent: Record<KnowledgeNodeType, KnowledgeNodeType | null> = {
  TECHNOLOGY: null,
  CATEGORY: "TECHNOLOGY",
  TOPIC: "CATEGORY",
  SUBTOPIC: "TOPIC",
};
const statuses: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const emptyForm = { type: "TECHNOLOGY" as KnowledgeNodeType, parentId: "", name: "", displayOrder: 0 };

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
  const [creatingParentId, setCreatingParentId] = useState<string>();
  const [returnSelectedId, setReturnSelectedId] = useState<string>();

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

  const parentType = expectedParent[form.type];
  const parentOptions = parentType ? nodes.filter((node) => node.type === parentType && node.id !== selectedId) : [];
  const selectedNode = selectedId ? nodes.find((node) => node.id === selectedId) : undefined;
  const selectedDescendantCount = selectedId ? countDescendants(nodes, selectedId) : 0;

  function startCreate(parent?: KnowledgeNode, type: KnowledgeNodeType = "TECHNOLOGY") {
    setReturnSelectedId(selectedId);
    setSelectedId(undefined);
    setCreatingParentId(parent?.id);
    setForm({ ...emptyForm, type, parentId: parent?.id ?? "" });
    clearMessages();
    window.requestAnimationFrame(() => document.getElementById("node-name")?.focus());
  }

  function selectNode(node: KnowledgeNode) {
    setSelectedId(node.id);
    setCreatingParentId(undefined);
    setReturnSelectedId(undefined);
    setForm({
      type: node.type,
      parentId: node.parentId ?? "",
      name: node.name,
      displayOrder: node.displayOrder,
    });
    clearMessages();
  }

  function cancelCreate() {
    const previous = returnSelectedId ? nodes.find((node) => node.id === returnSelectedId) : undefined;
    if (previous) {
      selectNode(previous);
      return;
    }
    setCreatingParentId(undefined);
    setForm(emptyForm);
    clearMessages();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("Name is required.");
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
    if (!selectedId || !selectedNode) return;
    const confirmation = selectedDescendantCount > 0
      ? t('Delete "{{name}}" and {{count}} descendant knowledge nodes? This cannot be undone.', {
          name: selectedNode.name,
          count: selectedDescendantCount,
        })
      : t('Delete "{{name}}"? This cannot be undone.', { name: selectedNode.name });
    if (!window.confirm(confirmation)) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`knowledge/nodes/${selectedId}`, { method: "DELETE" });
      startCreate();
      await load();
      setSuccess(t(selectedDescendantCount > 0 ? "Knowledge subtree deleted." : "Knowledge node deleted."));
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
        action={<Button onClick={() => startCreate()}>{t("Add technology")}</Button>}
      />
      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <Card>
          <CardContent>
            <Label htmlFor="knowledge-search">{t("Search hierarchy")}</Label>
            <Input id="knowledge-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search by name, slug, or type")} />
            <div className="mt-5">
              {loading ? <Loading label={t("Loading knowledge nodes")} /> : (
                <KnowledgeTree
                  nodes={nodes}
                  query={query}
                  mode="manage"
                  selectedId={selectedId}
                  creatingUnderId={creatingParentId}
                  onSelect={selectNode}
                  onAddChild={(parent, type) => startCreate(parent, type)}
                  onRefresh={() => void load()}
                  refreshing={loading}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text">{selectedId ? t("Edit node") : t("Create {{type}}", { type: t(form.type).toLowerCase() })}</h2>
                <p className="mt-1 text-sm text-text-muted">{selectedId ? t("Parent choices follow the four-level hierarchy.") : creatingParentId ? t("The parent and node type were selected from the tree.") : t("Create a root technology node.")}</p>
              </div>
              {selectedId ? <StatusBadge status={nodes.find((node) => node.id === selectedId)?.status ?? "DRAFT"} /> : null}
            </div>
            <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
              {selectedId ? <div>
                <Label htmlFor="node-type">{t("Node type")}</Label>
                <Select id="node-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as KnowledgeNodeType, parentId: "" }))}>
                  {(["TECHNOLOGY", "CATEGORY", "TOPIC", "SUBTOPIC"] as KnowledgeNodeType[]).map((type) => <option key={type} value={type}>{t(type)}</option>)}
                </Select>
              </div> : <div className="rounded-md border border-border bg-surface-muted px-3 py-3 text-sm">
                <span className="text-text-muted">{t("Node type")}: </span>
                <span className="font-semibold text-text">{t(form.type)}</span>
                {creatingParentId ? <span className="mt-1 block text-xs text-text-muted">{t("Parent")}: {nodes.find((node) => node.id === creatingParentId)?.name}</span> : null}
              </div>}
              {selectedId && parentType ? <div>
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
              {selectedId ? <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-text-muted">{t("System slug")}: <span className="font-mono text-text">{nodes.find((node) => node.id === selectedId)?.slug}</span></p> : <p className="text-xs text-text-muted">{t("Slug is generated automatically after creation.")}</p>}
              <div>
                <Label htmlFor="node-order">{t("Display order")}</Label>
                <Input id="node-order" type="number" min={0} aria-invalid={Boolean(validation.displayOrder)} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} />
                {validation.displayOrder ? <FieldError>{validation.displayOrder}</FieldError> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={pending}>{selectedId ? t("Save changes") : t("Create {{type}}", { type: t(form.type).toLowerCase() })}</Button>
                {!selectedId && returnSelectedId ? <Button type="button" variant="secondary" disabled={pending} onClick={cancelCreate}>{t("Cancel")}</Button> : null}
              </div>
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

function countDescendants(nodes: KnowledgeNode[], rootId: string) {
  const childrenByParent = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node.id);
    childrenByParent.set(node.parentId, children);
  }

  let count = 0;
  const pending = [...(childrenByParent.get(rootId) ?? [])];
  while (pending.length) {
    const currentId = pending.pop();
    if (!currentId) continue;
    count += 1;
    pending.push(...(childrenByParent.get(currentId) ?? []));
  }
  return count;
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

"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Feedback, Label, Textarea } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { CommentItem, PageResponse } from "@/lib/comments/types";
import { useI18n } from "@/lib/i18n";

type CommentTarget = "lessons" | "quizzes";

export function CommentSection({ targetType, targetId }: { targetType: CommentTarget; targetId: string }) {
  const { locale, t } = useI18n();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(true);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const [editingContent, setEditingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const endpoint = `/api/comments/${targetType}/${encodeURIComponent(targetId)}`;
  const load = useCallback(async (requestedPage = 0) => {
    if (requestedPage === 0) setLoading(true);
    else setLoadingMore(true);
    setError(undefined);
    try {
      const response = await fetch(`${endpoint}?page=${requestedPage}&size=20&sort=createdAt,desc`);
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const value = await response.json() as PageResponse<CommentItem>;
      setComments((current) => requestedPage === 0 ? value.content : [...current, ...value.content]);
      setPage(value.number);
      setLastPage(value.last);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load comments."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [endpoint, t]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${endpoint}?page=0&size=20&sort=createdAt,desc`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await readApiError(response)).message);
        const value = await response.json() as PageResponse<CommentItem>;
        setComments(value.content);
        setPage(value.number);
        setLastPage(value.last);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : t("Unable to load comments."));
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [endpoint, t]);

  useEffect(() => {
    if (loading || !window.location.hash.startsWith("#comment-")) return;
    window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [loading, comments]);

  async function createComment() {
    const value = content.trim();
    if (!value || value.length > 2000 || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const created = await response.json() as CommentItem;
      setComments((current) => [created, ...current]);
      setContent("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to post comment."));
    } finally { setPending(false); }
  }

  async function saveEdit(commentId: string) {
    const value = editingContent.trim();
    if (!value || value.length > 2000 || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const updated = await response.json() as CommentItem;
      setComments((current) => current.map((comment) => comment.id === commentId ? updated : comment));
      setEditingId(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to update comment."));
    } finally { setPending(false); }
  }

  async function removeComment(commentId: string) {
    if (!window.confirm(t("Delete this comment?")) || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to delete comment."));
    } finally { setPending(false); }
  }

  return (
    <section className="mt-12 border-t border-border pt-8" aria-labelledby="comments-heading">
      <div>
        <h2 id="comments-heading" className="text-xl font-semibold text-text">{t("Discussion")}</h2>
        <p className="mt-1 text-sm leading-6 text-text-muted">{t("Ask a question or share an insight about this content.")}</p>
      </div>

      <form className="mt-5" onSubmit={(event) => { event.preventDefault(); void createComment(); }}>
        <Label htmlFor={`comment-${targetType}`}>{t("Your comment")}</Label>
        <Textarea id={`comment-${targetType}`} value={content} maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder={t("Write a comment...")} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-text-subtle">{content.length} / 2000</span>
          <Button type="submit" loading={pending} disabled={!content.trim()}>{t("Post comment")}</Button>
        </div>
      </form>

      {error ? <Feedback className="mt-5" tone="error" title={t("Comment action failed")}><p>{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>{t("Try again")}</Button></Feedback> : null}

      <div className="mt-8 space-y-4" aria-live="polite">
        {loading ? <p className="text-sm text-text-muted" role="status">{t("Loading comments...")}</p> : null}
        {!loading && comments.length === 0 ? <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">{t("No comments yet. Start the discussion.")}</p> : null}
        {comments.map((comment) => (
          <article id={`comment-${comment.id}`} key={comment.id} tabIndex={-1} className="scroll-mt-24 border-b border-border pb-4 outline-none focus-visible:ring-3 focus-visible:ring-focus/20">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-sm font-semibold text-text">{comment.authorName}{comment.ownedByCurrentUser ? <span className="ml-2 font-normal text-primary">{t("You")}</span> : null}</p><p className="mt-0.5 text-xs text-text-subtle">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.createdAt))}{comment.editedAt ? ` · ${t("Edited")}` : ""}</p></div>
              {comment.ownedByCurrentUser && editingId !== comment.id ? <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => { setEditingId(comment.id); setEditingContent(comment.content); }}>{t("Edit")}</Button><Button size="sm" variant="ghost" onClick={() => void removeComment(comment.id)}>{t("Delete")}</Button></div> : null}
            </div>
            {editingId === comment.id ? <div className="mt-3"><Textarea value={editingContent} maxLength={2000} onChange={(event) => setEditingContent(event.target.value)} aria-label={t("Edit comment")} /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setEditingId(undefined)}>{t("Cancel")}</Button><Button size="sm" loading={pending} disabled={!editingContent.trim()} onClick={() => void saveEdit(comment.id)}>{t("Save changes")}</Button></div></div> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-text-muted">{comment.content}</p>}
          </article>
        ))}
      </div>
      {!loading && !lastPage ? <Button className="mt-5" variant="secondary" loading={loadingMore} onClick={() => void load(page + 1)}>{t("Load more comments")}</Button> : null}
    </section>
  );
}

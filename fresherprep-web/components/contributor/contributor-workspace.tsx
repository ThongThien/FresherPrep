"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { useCurrentUser } from "@/components/auth";
import { Badge, Button, Card, CardContent, Feedback, Input, Select, Textarea } from "@/components/ui";
import { KnowledgePathSelect, knowledgePathLabel } from "@/components/content/knowledge-path-select";
import { QuestionBatchEditor, type BatchQuestionPayload } from "@/components/content/question-batch-editor";
import type {
  AdminPage,
  ContributionContentType,
  ContributionDetail,
  ContributionSummary,
  ReviewStatus,
  KnowledgeNode,
  Question,
} from "@/lib/admin/types";
import { contributorJson, contributorRequest } from "@/lib/contributor/client";
import { useI18n } from "@/lib/i18n";

type DraftForm = {
  kind: ContributionContentType;
  subtopicId: string;
  title: string;
  content: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: string;
  minimumReadSeconds: string;
  requiredScrollPercent: string;
  displayOrder: string;
  quizType: "LESSON" | "TOPIC" | "MIXED" | "READINESS";
  selectionMode: "FIXED" | "RULE_BASED";
  passPercentage: string;
};

const initialForm: DraftForm = {
  kind: "LESSON", subtopicId: "", title: "", content: "", explanation: "",
  difficulty: "EASY", option1: "", option2: "", option3: "", option4: "",
  correct: "1", minimumReadSeconds: "60", requiredScrollPercent: "80",
  displayOrder: "0", quizType: "LESSON", selectionMode: "FIXED", passPercentage: "80",
};

export function ContributorWorkspace() {
  const user = useCurrentUser();
  const { locale, t } = useI18n();
  const [items, setItems] = useState<ContributionSummary[]>([]);
  const [detail, setDetail] = useState<ContributionDetail>();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<DraftForm>(initialForm);
  const [editing, setEditing] = useState<ContributionDetail>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [configId, setConfigId] = useState("");
  const [configCount, setConfigCount] = useState("1");
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [showBatch, setShowBatch] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const params = new URLSearchParams({ page: String(page), size: "20" });
    if (status) params.set("status", status);
    try {
      const result = await contributorRequest<AdminPage<ContributionSummary>>(`submissions?${params}`);
      setItems(result.content);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (user.role !== "CONTRIBUTOR") return;
    const timer = window.setTimeout(() => void Promise.all([
      contributorRequest<KnowledgeNode[]>("knowledge"),
      contributorRequest<AdminPage<Question>>("questions?page=0&size=100&sort=code,asc"),
    ]).then(([knowledge, questions]) => {
      setNodes(knowledge);
      setAvailableQuestions(questions.content);
      setForm((current) => current.subtopicId ? current : {
        ...current,
        subtopicId: knowledge.find((node) => node.type === "SUBTOPIC")?.id ?? "",
      });
    }).catch((cause) => setError(messageOf(cause))), 0);
    return () => window.clearTimeout(timer);
  }, [user.role]);

  async function open(id: string) {
    try {
      setDetail(await contributorRequest<ContributionDetail>(`submissions/${id}`));
    } catch (cause) {
      setError(messageOf(cause));
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      let result: ContributionDetail;
      if (form.kind === "LESSON") {
        const body = {
          subtopicId: form.subtopicId, title: form.title, content: form.content,
          displayOrder: Number(form.displayOrder), minimumReadSeconds: Number(form.minimumReadSeconds),
          requiredScrollPercent: Number(form.requiredScrollPercent),
        };
        result = await contributorRequest<ContributionDetail>(
          editing ? `lessons/${editing.submission.contentId}` : "lessons",
          { method: editing ? "PUT" : "POST", ...contributorJson(body) },
        );
      } else if (form.kind === "QUESTION") {
        if (editing) {
          if (editing.submission.status !== "PUBLISHED") {
            await contributorRequest(
              `questions/${editing.submission.contentId}`,
              { method: "PUT", ...contributorJson({ subtopicId: form.subtopicId, difficulty: form.difficulty, language: "VI", category: "TECHNICAL" }) },
            );
          }
          result = await createVersion(editing.submission.contentId, nextVersion(editing));
        } else {
          const created = await contributorRequest<ContributionDetail>("questions", {
            method: "POST",
            ...contributorJson({ subtopicId: form.subtopicId, difficulty: form.difficulty, language: "VI", category: "TECHNICAL" }),
          });
          result = await createVersion(created.submission.contentId, 1);
        }
      } else {
        const body = {
          title: form.title, type: form.quizType, selectionMode: form.selectionMode,
          passPercentage: Number(form.passPercentage), language: "VI",
          category: "TECHNICAL", maximumScore: 100, durationSeconds: null,
        };
        result = await contributorRequest<ContributionDetail>(
          editing ? `quizzes/${editing.submission.contentId}` : "quizzes",
          { method: editing ? "PUT" : "POST", ...contributorJson(body) },
        );
      }
      setDetail(result);
      setEditing(undefined);
      setForm(initialForm);
      setSuccess(t("Draft saved."));
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setPending(false);
    }
  }

  async function createVersion(questionId: string, versionNumber: number) {
    const options = [form.option1, form.option2, form.option3, form.option4].map((content, index) => ({
      position: index + 1, content, correct: Number(form.correct) === index + 1,
      explanation: Number(form.correct) === index + 1 ? form.explanation : "Incorrect option.",
    }));
    return contributorRequest<ContributionDetail>(`questions/${questionId}/versions`, {
      method: "POST",
      ...contributorJson({ versionNumber, content: form.content, explanation: form.explanation, options }),
    });
  }

  async function createQuestionBatch(payload: BatchQuestionPayload) {
    setPending(true); setError(undefined); setSuccess(undefined);
    try {
      await contributorRequest("questions/batch", { method: "POST", ...contributorJson(payload) });
      setSuccess(t("{{count}} question drafts created.", { count: payload.questions.length }));
      setShowBatch(false);
      await load();
    } catch (cause) { setError(messageOf(cause)); throw cause; }
    finally { setPending(false); }
  }

  async function submit(item: ContributionSummary) {
    setPending(true);
    setError(undefined);
    try {
      const result = await contributorRequest<ContributionDetail>(`submissions/${item.id}/submit`, { method: "POST" });
      setDetail(result);
      setSuccess(t("Submitted for review."));
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setPending(false);
    }
  }

  async function configureQuiz() {
    if (!detail || detail.submission.contentType !== "QUIZ" || !configId) return;
    const content = detail.content as { selectionMode?: string; fixedQuestions?: unknown[]; rules?: unknown[] };
    const fixed = content.selectionMode === "FIXED";
    setPending(true);
    try {
      const path = fixed
        ? `quizzes/${detail.submission.contentId}/fixed-questions`
        : `quizzes/${detail.submission.contentId}/rules`;
      const body = fixed
        ? { questionId: configId, position: (content.fixedQuestions?.length ?? 0) + 1 }
        : { knowledgeNodeId: configId, difficulty: null, questionCount: Number(configCount) };
      const result = await contributorRequest<ContributionDetail>(path, { method: "POST", ...contributorJson(body) });
      setDetail(result);
      setConfigId("");
      setSuccess(t("Quiz configuration updated."));
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setPending(false);
    }
  }

  function edit(current: ContributionDetail) {
    const item = current.submission;
    if (item.status !== "DRAFT" && item.status !== "REJECTED" && !(item.contentType === "QUESTION" && item.status === "PUBLISHED")) return;
    const content = current.content as Record<string, unknown>;
    if (item.contentType === "LESSON") {
      const lesson = (content.lesson ?? content) as Record<string, unknown>;
      setForm({ ...initialForm, kind: "LESSON", subtopicId: String(lesson.subtopicId ?? ""), title: String(lesson.title ?? ""), content: String(lesson.content ?? ""), displayOrder: String(lesson.displayOrder ?? 0), minimumReadSeconds: String(lesson.minimumReadSeconds ?? 60), requiredScrollPercent: String(lesson.requiredScrollPercent ?? 80) });
    } else if (item.contentType === "QUESTION") {
      const question = (content.question ?? {}) as Record<string, unknown>;
      setForm({ ...initialForm, kind: "QUESTION", subtopicId: String(question.subtopicId ?? ""), difficulty: (question.difficulty as DraftForm["difficulty"]) ?? "EASY" });
    } else {
      setForm({ ...initialForm, kind: "QUIZ", title: String(content.title ?? ""), quizType: (content.type as DraftForm["quizType"]) ?? "LESSON", selectionMode: (content.selectionMode as DraftForm["selectionMode"]) ?? "FIXED", passPercentage: String(content.passPercentage ?? 80) });
    }
    setEditing(current);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const date = useMemo(() => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }), [locale]);
  if (user.role !== "CONTRIBUTOR") return <Feedback tone="error" title={t("Contributor access required")}>{t("This workspace is available only to contributor accounts.")}</Feedback>;

  return <div className="mx-auto max-w-6xl">
    <header className="border-b border-border pb-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Contributor workspace")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t("My contributions")}</h1><p className="mt-2 text-sm text-text-muted">{t("Create drafts and send them to an administrator for review.")}</p></header>
    {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
    {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}
    <Card className="mt-7"><CardContent>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-text">{editing ? t("Edit contribution") : t("Create a draft")}</h2>{!editing ? <Button variant="secondary" onClick={() => setShowBatch((value) => !value)}>{showBatch ? t("Single item") : t("Batch questions")}</Button> : null}</div>
      {showBatch && !editing ? <div className="mt-5"><QuestionBatchEditor nodes={nodes} pending={pending} onSubmit={createQuestionBatch} /></div> :
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={save}>
        <Field label={t("Content type")}><Select value={form.kind} disabled={Boolean(editing)} onChange={(event) => setForm({ ...initialForm, kind: event.target.value as ContributionContentType })}><option>LESSON</option><option>QUESTION</option><option>QUIZ</option></Select></Field>
        {form.kind !== "QUIZ" ? <div className="sm:col-span-2"><KnowledgePathSelect nodes={nodes} value={form.subtopicId} onChange={(subtopicId) => setForm({ ...form, subtopicId })} idPrefix="contributor-content" />{form.subtopicId ? <p className="mt-2 text-xs text-text-muted">{knowledgePathLabel(nodes, form.subtopicId)}</p> : null}</div> : null}
        {form.kind !== "QUESTION" ? <Field label={t("Title")}><Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field> : null}
        {form.kind === "LESSON" ? <>
          <Field label={t("Minimum read seconds")}><Input type="number" min="1" value={form.minimumReadSeconds} onChange={(event) => setForm({ ...form, minimumReadSeconds: event.target.value })} /></Field>
          <Field label={t("Required scroll percent")}><Input type="number" min="1" max="100" value={form.requiredScrollPercent} onChange={(event) => setForm({ ...form, requiredScrollPercent: event.target.value })} /></Field>
          <Field label={t("Display order")}><Input type="number" min="0" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></Field>
          <Field label={t("Lesson content")} wide><Textarea required rows={10} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></Field>
        </> : null}
        {form.kind === "QUESTION" ? <QuestionFields form={form} setForm={setForm} publishedRevision={editing?.submission.status === "PUBLISHED"} /> : null}
        {form.kind === "QUIZ" ? <>
          <Field label={t("Quiz type")}><Select value={form.quizType} onChange={(event) => setForm({ ...form, quizType: event.target.value as DraftForm["quizType"] })}><option>LESSON</option><option>TOPIC</option><option>MIXED</option><option>READINESS</option></Select></Field>
          <Field label={t("Selection mode")}><Select value={form.selectionMode} onChange={(event) => setForm({ ...form, selectionMode: event.target.value as DraftForm["selectionMode"] })}><option>FIXED</option><option>RULE_BASED</option></Select></Field>
          <Field label={t("Pass percentage")}><Input type="number" min="0" max="100" value={form.passPercentage} onChange={(event) => setForm({ ...form, passPercentage: event.target.value })} /></Field>
        </> : null}
        <div className="flex gap-3 sm:col-span-2"><Button type="submit" loading={pending}>{t("Save draft")}</Button>{editing ? <Button type="button" variant="secondary" onClick={() => { setEditing(undefined); setForm(initialForm); }}>{t("Cancel")}</Button> : null}</div>
      </form>}
    </CardContent></Card>
    <section className="mt-8"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-semibold text-text">{t("My submissions")}</h2><Select aria-label={t("Filter by review status")} className="w-52" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="">{t("All statuses")}</option><option>DRAFT</option><option>PENDING_REVIEW</option><option>REJECTED</option><option>PUBLISHED</option></Select></div>
      {loading ? <p className="mt-5 text-sm text-text-muted" role="status">{t("Loading contributions...")}</p> : items.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-text">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.contentType} · {date.format(new Date(item.updatedAt))}</p></div><StatusBadge status={item.status} /></div>{item.reviewComment ? <p className="mt-4 rounded-md bg-danger-subtle p-3 text-sm text-danger-strong">{item.reviewComment}</p> : null}<div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => void open(item.id)}>{t("View details")}</Button>{item.status === "DRAFT" || item.status === "REJECTED" ? <Button size="sm" loading={pending} onClick={() => void submit(item)}>{t("Submit for review")}</Button> : null}</div></CardContent></Card>)}</div> : <p className="mt-5 rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">{t("No contributions yet.")}</p>}
      {totalPages > 1 ? <div className="mt-5 flex justify-between"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>{t("Previous")}</Button><Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>{t("Next")}</Button></div> : null}
    </section>
    {detail ? <section className="mt-8 border-t border-border pt-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-text">{detail.submission.title}</h2><div className="mt-2"><StatusBadge status={detail.submission.status} /></div></div><div className="flex gap-2">{detail.submission.status !== "PENDING_REVIEW" ? <Button variant="secondary" onClick={() => edit(detail)}>{detail.submission.status === "PUBLISHED" ? t("Create revision") : t("Edit")}</Button> : null}<Button variant="ghost" onClick={() => setDetail(undefined)}>{t("Close details")}</Button></div></div>
      {detail.submission.contentType === "QUIZ" && (detail.submission.status === "DRAFT" || detail.submission.status === "REJECTED") ? <Card className="mt-5"><CardContent><h3 className="font-semibold text-text">{t("Quiz configuration")}</h3><p className="mt-1 text-sm text-text-muted">{(detail.content as { selectionMode?: string }).selectionMode === "FIXED" ? t("FIXED uses the exact published questions you select, in display order.") : t("RULE_BASED selects published questions when an attempt starts. Choose scope, difficulty and count.")}</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Select value={configId} onChange={(event) => setConfigId(event.target.value)}><option value="">{(detail.content as { selectionMode?: string }).selectionMode === "FIXED" ? t("Select a published question") : t("Select a knowledge scope")}</option>{(detail.content as { selectionMode?: string }).selectionMode === "FIXED" ? availableQuestions.map((question) => <option key={question.id} value={question.id}>{question.code} / {question.difficulty}</option>) : nodes.map((node) => <option key={node.id} value={node.id}>{knowledgePathLabel(nodes, node.id)} ({node.type})</option>)}</Select>{(detail.content as { selectionMode?: string }).selectionMode !== "FIXED" ? <Input className="sm:w-32" aria-label={t("Question count")} type="number" min="1" value={configCount} onChange={(event) => setConfigCount(event.target.value)} /> : null}<Button disabled={!configId} loading={pending} onClick={() => void configureQuiz()}>{t("Add configuration")}</Button></div></CardContent></Card> : null}
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card><CardContent><h3 className="font-semibold text-text">{t("Content")}</h3><ContentSummary type={detail.submission.contentType} content={detail.content} /></CardContent></Card><Card><CardContent><h3 className="font-semibold text-text">{t("Review history")}</h3><ol className="mt-4 space-y-4">{detail.history.map((event) => <li className="border-l-2 border-border pl-3 text-sm" key={event.id}><p className="font-medium text-text">{event.action}</p><p className="mt-1 text-xs text-text-muted">{event.actorName} / {date.format(new Date(event.occurredAt))}</p>{event.comment ? <p className="mt-2 text-text-muted">{event.comment}</p> : null}</li>)}</ol></CardContent></Card></div>
    </section> : null}
  </div>;
}

function QuestionFields({ form, setForm, publishedRevision }: { form: DraftForm; setForm: (form: DraftForm) => void; publishedRevision: boolean }) {
  const { t } = useI18n();
  return <>{!publishedRevision ? <Field label={t("Difficulty")}><Select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as DraftForm["difficulty"] })}><option>EASY</option><option>MEDIUM</option><option>HARD</option></Select></Field> : null}<Field label={t("Question")} wide><Textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></Field><Field label={t("Explanation")} wide><Textarea required value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></Field>{[1, 2, 3, 4].map((position) => <Field key={position} label={t("Option {{position}}", { position })}><Input required value={form[`option${position}` as keyof DraftForm]} onChange={(event) => setForm({ ...form, [`option${position}`]: event.target.value })} /></Field>)}<Field label={t("Correct option")}><Select value={form.correct} onChange={(event) => setForm({ ...form, correct: event.target.value })}><option>1</option><option>2</option><option>3</option><option>4</option></Select></Field></>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 block text-sm font-medium text-text">{label}</span>{children}</label>;
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={status === "PUBLISHED" ? "success" : status === "REJECTED" ? "danger" : status === "PENDING_REVIEW" ? "warning" : "neutral"}>{status}</Badge>;
}

function nextVersion(detail: ContributionDetail) {
  const content = detail.content as { versions?: { versionNumber: number }[] };
  return Math.max(0, ...(content.versions ?? []).map((version) => version.versionNumber)) + 1;
}

function ContentSummary({ type, content }: { type: ContributionContentType; content: unknown }) {
  const { t } = useI18n();
  const value = content as Record<string, unknown>;
  if (type === "LESSON") {
    const lesson = (value.lesson ?? value) as Record<string, unknown>;
    return <div className="mt-4 space-y-3 text-sm"><h4 className="text-lg font-semibold text-text">{String(lesson.title ?? "")}</h4><p className="text-text-muted">{t("Reading requirement: {{seconds}} seconds and {{percent}}% scroll.", { seconds: Number(lesson.minimumReadSeconds ?? 0), percent: Number(lesson.requiredScrollPercent ?? 0) })}</p><div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-surface-muted p-4 leading-7 text-text">{String(lesson.content ?? "")}</div></div>;
  }
  if (type === "QUESTION") {
    const question = (value.question ?? {}) as Record<string, unknown>; const versions = (value.versions ?? []) as Record<string, unknown>[];
    return <div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2"><Badge>{String(question.code ?? "")}</Badge><Badge variant="info">{String(question.difficulty ?? "")}</Badge></div>{versions.map((version) => <article key={String(version.id)} className="rounded-md border border-border p-4"><h4 className="font-semibold text-text">{t("Version {{number}}", { number: Number(version.versionNumber ?? 0) })}</h4><p className="mt-2 text-sm text-text">{String(version.content ?? "")}</p><p className="mt-2 text-sm text-text-muted">{String(version.explanation ?? "")}</p></article>)}</div>;
  }
  return <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[["Title", value.title], ["Code", value.code], ["Type", value.type], ["Selection mode", value.selectionMode], ["Pass percentage", `${value.passPercentage ?? 0}%`], ["Status", value.status]].map(([label, field]) => <div key={String(label)}><dt className="text-xs text-text-muted">{t(String(label))}</dt><dd className="mt-1 font-medium text-text">{String(field ?? "-")}</dd></div>)}</dl>;
}

function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : "The request could not be completed.";
}

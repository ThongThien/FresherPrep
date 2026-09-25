"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

import { Button, Card, CardContent, Input, Label, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

export interface AdminBreadcrumb {
  label: string;
  href?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: readonly AdminBreadcrumb[];
}) {
  const { t } = useI18n();

  return (
    <header className="border-b border-border pb-7">
      {breadcrumbs?.length ? (
        <nav aria-label={t("Breadcrumb")} className="mb-3">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            {breadcrumbs.map((item, index) => (
              <li className="flex items-center gap-2" key={item.href ?? item.label}>
                {index ? <span aria-hidden="true">/</span> : null}
                {item.href ? (
                  <Link className="font-medium hover:text-primary" href={item.href}>
                    {t(item.label)}
                  </Link>
                ) : (
                  <span aria-current="page">{t(item.label)}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {t("Administration")}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm font-medium text-text-muted">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-text">{value}</p>
        {hint ? <p className="mt-2 text-xs leading-5 text-text-subtle">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export interface AdminTableColumn<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
}

export function AdminDataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
}: {
  columns: readonly AdminTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  caption: string;
  empty?: ReactNode;
}) {
  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-[0.08em] text-text-subtle">
          <tr>
            {columns.map((column) => (
              <th className={cn("px-4 py-3", column.className)} key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr className="transition-colors hover:bg-surface-muted/60" key={rowKey(row)}>
              {columns.map((column) => (
                <td className={cn("px-4 py-3 align-middle text-text-muted", column.className)} key={column.key}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <Label className="sr-only" htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
      />
    </div>
  );
}

export function AdminFilter({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("w-full sm:w-48", className)}>
      <Label className="sr-only" htmlFor={id}>{label}</Label>
      <Select id={id} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Select>
    </div>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>;
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-5 flex items-center justify-between gap-4" aria-label={t("Pagination")}>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled || page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        {t("Previous")}
      </Button>
      <p className="text-sm tabular-nums text-text-muted">
        {t("Page {{page}} of {{total}}", { page: page + 1, total: totalPages })}
      </p>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled || page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        {t("Next")}
      </Button>
    </nav>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      <h2 className="font-semibold text-text">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted" role="status">
      <span className="mx-auto mb-3 block size-5 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
      {label}
    </div>
  );
}

export function AdminErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-danger/20 bg-danger-subtle p-5">
      <h2 className="font-semibold text-danger-strong">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-danger-strong/90">{message}</p>
      {onRetry ? <Button className="mt-4" size="sm" variant="secondary" onClick={onRetry}>{t("Try again")}</Button> : null}
    </div>
  );
}

export function AdminFormSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <div>
        <CardContent>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p> : null}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
        </CardContent>
        {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </Card>
  );
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending = false,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-lg border border-border bg-surface p-0 text-text shadow-card backdrop:bg-text/35"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-text" id={titleId}>{title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted" id={descriptionId}>{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}

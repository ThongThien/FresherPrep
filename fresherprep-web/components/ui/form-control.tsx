import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-text", className)}
      {...props}
    />
  );
}

const controlClasses =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 text-sm text-text shadow-input outline-none transition-[border-color,box-shadow] placeholder:text-text-subtle hover:border-text-subtle focus:border-primary focus:ring-3 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle aria-invalid:border-danger aria-invalid:ring-danger/15";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClasses, "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-xs leading-5 text-text-muted", className)} {...props} />;
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1.5 text-xs font-medium leading-5 text-danger-strong", className)} {...props} />
  );
}

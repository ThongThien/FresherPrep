"use client";

import { useState } from "react";

import { Input } from "@/components/ui";

interface PasswordFieldProps {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
}

export function PasswordField({
  id,
  name,
  autoComplete,
  describedBy,
  invalid,
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={8}
        maxLength={72}
        required
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="pr-20"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-text-muted transition-colors hover:text-text focus-visible:rounded-sm disabled:opacity-50"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

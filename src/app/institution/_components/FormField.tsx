'use client';

import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InstitutionApiError } from '@/api/institutionApi';
import { FOCUS_RING } from './tokens';

/**
 * Form controls for the institution area.
 *
 * `src/components/common/Input.tsx` is an empty file in this repo, so there is
 * no shared text input to reuse — these are built here to the same visual
 * language as the rest of the product (see the report note on the gap).
 *
 * Rules applied to all of them:
 *   - label ABOVE the input, tied with htmlFor/id (never a placeholder as label)
 *   - a visible focus ring, the same one used everywhere in this area
 *   - the error is announced (`aria-invalid` + `aria-describedby` + `role=alert`)
 *     and sits directly under the field that failed
 *   - required is marked in words, not with a bare asterisk
 */
const CONTROL_CLASS = cn(
  'w-full rounded-lg border bg-white px-3 py-2 text-[13px] leading-5 text-[#0f172a]',
  'placeholder:text-[#94a3b8]',
  'transition-colors duration-150 motion-reduce:transition-none',
  'disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]',
  FOCUS_RING,
);

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline gap-1.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#64748b]"
    >
      {children}
      {required ? (
        <span className="text-[10px] font-medium normal-case tracking-normal text-[#94a3b8]">
          required
        </span>
      ) : null}
    </label>
  );
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p
        id={id}
        role="alert"
        className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-4 text-red-700"
      >
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-[12px] leading-4 text-[#94a3b8]">
        {hint}
      </p>
    );
  }
  return null;
}

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export interface TextFieldProps
  extends BaseFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, required, error, hint, ...props }, ref) => {
    const id = useId();
    const msgId = `${id}-msg`;
    return (
      <div>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        <input
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={cn(CONTROL_CLASS, error ? 'border-red-400' : 'border-[#cbd5e1]')}
        />
        <FieldMessage id={msgId} error={error} hint={hint} />
      </div>
    );
  },
);
TextField.displayName = 'TextField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends BaseFieldProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> {
  options: SelectOption[];
  /** Shown as a disabled first option when the value is empty. */
  placeholder?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, required, error, hint, options, placeholder, ...props }, ref) => {
    const id = useId();
    const msgId = `${id}-msg`;
    return (
      <div>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        <select
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={cn(CONTROL_CLASS, error ? 'border-red-400' : 'border-[#cbd5e1]')}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <FieldMessage id={msgId} error={error} hint={hint} />
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';

/**
 * Turn the server's field errors into a `{ field: message }` map so each input
 * can show the failure on itself. The API returns the failing field name, so
 * the user is taken to the problem instead of being told the form is invalid.
 */
export function fieldErrorMap(error: InstitutionApiError | null): Record<string, string> {
  if (!error || error.fieldErrors.length === 0) return {};
  return error.fieldErrors.reduce<Record<string, string>>((acc, fe) => {
    if (!acc[fe.field]) acc[fe.field] = fe.message;
    return acc;
  }, {});
}

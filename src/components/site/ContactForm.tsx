'use client';

import { useActionState, useId } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { sendContact, type FormState } from '@/lib/actions/public';

type Labels = Record<'name' | 'email' | 'kind' | 'message' | 'send' | 'general' | 'collab' | 'media' | 'submission' | 'other', string>;

export function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, {});
  const id = useId();
  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 border border-line bg-white p-8 text-center">
        <CheckCircle2 aria-hidden size={44} className="text-[#1f8f5f]" />
        <p className="text-lg font-bold text-navy">{state.message}</p>
      </div>
    );
  }
  const field = (name: 'name' | 'email', type = 'text', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${id}-${name}`} className="field-label">
        {labels[name]} <span className="text-orange" aria-hidden>*</span>
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type={type}
        required
        defaultValue={state.data?.[name]}
        aria-invalid={!!state.errors?.[name]}
        aria-describedby={state.errors?.[name] ? `${id}-${name}-err` : undefined}
        className="field"
        {...extra}
      />
      {state.errors?.[name] && (
        <p id={`${id}-${name}-err`} className="field-error">
          {state.errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <form action={action} noValidate className="space-y-5 border border-line bg-white p-5 sm:p-7">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'text', { autoComplete: 'name' })}
        {field('email', 'email', { autoComplete: 'email', inputMode: 'email', dir: 'ltr', className: 'field text-start' })}
      </div>
      <div>
        <label htmlFor={`${id}-kind`} className="field-label">
          {labels.kind}
        </label>
        <select id={`${id}-kind`} name="kind" defaultValue={state.data?.kind ?? 'general'} className="field">
          {(['general', 'collab', 'media', 'submission', 'other'] as const).map((k) => (
            <option key={k} value={k}>
              {labels[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="field-label">
          {labels.message} <span className="text-orange" aria-hidden>*</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          rows={6}
          maxLength={5000}
          defaultValue={state.data?.message}
          aria-invalid={!!state.errors?.message}
          aria-describedby={state.errors?.message ? `${id}-message-err` : undefined}
          className="field min-h-36"
        />
        {state.errors?.message && (
          <p id={`${id}-message-err`} className="field-error">
            {state.errors.message}
          </p>
        )}
      </div>
      {state.message && !state.ok && (
        <p role="alert" className="rounded bg-pink-50 px-4 py-3 text-sm text-burgundy">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto sm:min-w-[11rem]">
        {labels.send}
      </button>
    </form>
  );
}

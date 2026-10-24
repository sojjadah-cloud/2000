'use client';

import { useActionState, useId } from 'react';
import { registerForEvent } from '@/lib/actions/events';
import type { FormState } from '@/lib/actions/public';

export function RegistrationForm({
  eventId,
  waitlist,
  labels,
}: {
  eventId: string;
  waitlist: boolean;
  labels: { name: string; email: string; submit: string; waitlist: string; required: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerForEvent, {});
  const id = useId();
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <label htmlFor={`${id}-name`} className="field-label">
          {labels.name} <span className="text-orange" aria-hidden>*</span>
        </label>
        <input
          id={`${id}-name`}
          name="name"
          required
          autoComplete="name"
          defaultValue={state.data?.name}
          aria-invalid={!!state.errors?.name}
          aria-describedby={state.errors?.name ? `${id}-name-err` : undefined}
          className="field"
        />
        {state.errors?.name && (
          <p id={`${id}-name-err`} className="field-error">
            {state.errors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="field-label">
          {labels.email} <span className="text-orange" aria-hidden>*</span>
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          dir="ltr"
          required
          autoComplete="email"
          defaultValue={state.data?.email}
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? `${id}-email-err` : undefined}
          className="field text-start"
        />
        {state.errors?.email && (
          <p id={`${id}-email-err`} className="field-error">
            {state.errors.email}
          </p>
        )}
      </div>
      {state.message && (
        <p role="alert" className="rounded bg-pink-50 px-4 py-3 text-sm text-burgundy">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {waitlist ? labels.waitlist : labels.submit}
      </button>
    </form>
  );
}

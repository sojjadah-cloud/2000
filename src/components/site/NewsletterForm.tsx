'use client';

import { useActionState, useId } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { subscribe, type FormState } from '@/lib/actions/public';

export function NewsletterForm({
  labels,
  dir,
}: {
  labels: { placeholder: string; subscribe: string; emailLabel: string };
  dir: 'rtl' | 'ltr';
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  const id = useId();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <form action={action} className="w-full max-w-[22.5rem] lg:max-w-[19.5rem]" noValidate>
      <div className="flex h-12 overflow-hidden rounded-[3px] bg-white">
        <label htmlFor={`${id}-email`} className="sr-only">
          {labels.emailLabel}
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          placeholder={labels.placeholder}
          aria-invalid={!!state.errors?.email}
          aria-describedby={`${id}-msg`}
          className="min-w-0 flex-1 bg-white px-4 text-sm text-navy placeholder:text-ink-soft placeholder:[direction:rtl] focus:outline-none focus-visible:outline-2 focus-visible:outline-orange [&:placeholder-shown]:text-end"
        />
        {/* حقل فخ للبرامج الآلية */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button type="submit" disabled={pending} className="btn btn-primary h-12 rounded-none px-6">
          {labels.subscribe} <Arrow aria-hidden size={16} />
        </button>
      </div>
      <p id={`${id}-msg`} role="status" className={`mt-2 min-h-5 text-start text-sm ${state.errors?.email ? 'text-[#ffb4a8]' : 'text-white/85'}`}>
        {state.errors?.email ?? state.message ?? ''}
      </p>
    </form>
  );
}

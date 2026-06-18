'use client'
import { useState } from 'react'

const PHONE_RE = /^(\+?38)?[\s-]?\(?0\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/

interface FormState {
  name: string
  phone_number: string
  email: string
  description: string
}

interface FormErrors {
  name?: string
  phone_number?: string
  email?: string
  description?: string
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Вкажіть ім'я"
  if (!form.phone_number.trim()) {
    errors.phone_number = 'Вкажіть номер телефону'
  } else if (!PHONE_RE.test(form.phone_number.replace(/\s/g, ''))) {
    errors.phone_number = 'Невірний формат: +38 (0XX) XXX-XX-XX'
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
    errors.email = 'Невірний формат email'
  }
  if (!form.description.trim()) errors.description = 'Опишіть суть звернення'
  return errors
}

export default function OrderForm() {
  const [form, setForm] = useState<FormState>({ name: '', phone_number: '', email: '', description: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    setForm(f => ({ ...f, [field]: val }))
    if (touched[field]) {
      setErrors(prev => ({ ...prev, ...validate({ ...form, [field]: val }) }))
    }
  }

  const blur = (field: keyof FormState) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(prev => ({ ...prev, ...validate(form) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = { name: true, phone_number: true, email: true, description: true }
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setStatus('loading')
    setServerError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setServerError(body.error ?? 'Помилка відправки')
        setStatus('error')
        return
      }
      setStatus('success')
      setForm({ name: '', phone_number: '', email: '', description: '' })
      setTouched({})
      setErrors({})
    } catch {
      setServerError('Помилка з\'єднання. Спробуйте ще раз.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <p className="text-white font-semibold text-lg">Дякуємо! Ваша заявка прийнята.</p>
        <p className="text-white/80 mt-2">Ми зв&apos;яжемося з вами найближчим часом.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-white/70 underline text-sm">
          Надіслати ще одну заявку
        </button>
      </div>
    )
  }

  const field = (label: string, key: keyof FormState, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-white font-medium mb-2">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        onBlur={blur(key)}
        className={`w-full bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 ${touched[key] && errors[key] ? 'ring-2 ring-red-400' : ''}`}
        {...extra}
      />
      {touched[key] && errors[key] && (
        <p className="mt-1 text-red-300 text-xs">{errors[key]}</p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {field("Ваше ім'я", 'name', 'text', { maxLength: 100, autoComplete: 'name' })}
      {field('Номер телефону', 'phone_number', 'tel', { maxLength: 20, autoComplete: 'tel', placeholder: '+38 (0XX) XXX-XX-XX' })}
      {field('Email (необов\'язково)', 'email', 'email', { maxLength: 200, autoComplete: 'email' })}
      <div>
        <label className="block text-white font-medium mb-2">Опишіть коротко суть проблеми (це конфіденційно)</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          onBlur={blur('description')}
          rows={5}
          maxLength={1000}
          className={`w-full bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none ${touched.description && errors.description ? 'ring-2 ring-red-400' : ''}`}
        />
        <div className="flex justify-between items-start mt-1">
          {touched.description && errors.description
            ? <p className="text-red-300 text-xs">{errors.description}</p>
            : <span />}
          <p className="text-white/50 text-xs">{form.description.length}/1000</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-site-orange text-white font-bold py-4 rounded-lg text-lg hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
      >
        {status === 'loading' ? 'Відправка...' : 'Записатися на прийом'}
      </button>

      {status === 'error' && (
        <p className="text-red-300 text-center text-sm">{serverError}</p>
      )}

      <p className="text-white/60 text-center text-xs leading-relaxed">
        Натискаючи на кнопку, ви даєте згоду на обробку персональних даних та погоджуєтесь з політикою конфіденційності
      </p>
    </form>
  )
}

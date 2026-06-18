'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Паролі не співпадають'); return }
    if (password.length < 6) { setError('Мінімум 6 символів'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) { setError(data.error ?? 'Помилка'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setError('Помилка мережі')
      setStatus('error')
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium mb-1">Посилання недійсне або прострочене</p>
        <p className="text-gray-400 text-sm mb-6">Запросіть нове посилання для скидання пароля</p>
        <a href="/admin" className="inline-block bg-site-blue text-white font-semibold px-6 py-2.5 rounded hover:opacity-90 transition text-sm">
          Повернутися до входу
        </a>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Пароль оновлено!</h2>
        <p className="text-gray-500 text-sm mb-6">Тепер ви можете увійти з новим паролем</p>
        <a href="/admin" className="inline-block bg-site-blue text-white font-semibold px-6 py-2.5 rounded hover:opacity-90 transition text-sm">
          Увійти в адмін-панель
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Новий пароль</label>
        <input
          type="password" required value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Мінімум 6 символів"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-site-blue focus:ring-1 focus:ring-site-blue transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Підтвердіть пароль</label>
        <input
          type="password" required value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Повторіть пароль"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-site-blue focus:ring-1 focus:ring-site-blue transition"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <button
        type="submit" disabled={status === 'loading'}
        className="w-full bg-site-blue text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60 cursor-pointer text-sm mt-2"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Збереження...
          </span>
        ) : 'Зберегти новий пароль'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Шапка */}
        <div className="bg-site-blue px-8 py-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Скидання пароля</h1>
          <p className="text-blue-100 text-sm mt-1">Введіть новий пароль для входу в адмін-панель</p>
        </div>
        {/* Форма */}
        <div className="px-8 py-7">
          <Suspense fallback={<p className="text-center text-gray-400 text-sm py-4">Завантаження...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

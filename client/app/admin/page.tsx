'use client'
import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TextItem { id: number; text: string }
interface HeaderItem { id: number; address: string; brand_name: string; phone_number_1: string; phone_number_2: string }
interface AboutItem { id: number; photo: string; fio: string; text_about: string; email: string }
interface Order { id: number; name: string; phone_number: string; email: string; description: string; created_at: string }
interface CustomSection { id: number; title: string; text: string; photo: string; photo_side: 'left' | 'right'; sort_order: number; visible: number }
interface LayoutItem { id: number; section_key: string; label: string; sort_order: number; visible: number }

type SectionKey = string

const SECTION_LABELS: Record<string, string> = {
  header: 'Хедер',
  address: 'Адреса',
  about: 'Про лікаря',
  diplomas: 'Дипломи та освіта',
  'work-experience': 'Досвід роботи',
  services: 'Послуги',
  'medical-services': 'Медичні послуги',
  symptoms: 'Симптоми',
  'patient-info': "Пам'ятка для пацієнта",
  'order-bg': 'Фон секції «Запис»',
  orders: 'Заявки',
  'page-layout': 'Структура сторінки',
}

const SECTION_ENDPOINTS: Record<string, string> = {
  header: '/api/header',
  about: '/api/about',
  diplomas: '/api/diplomas',
  'work-experience': '/api/work-experience',
  services: '/api/services',
  'medical-services': '/api/medical-services',
  symptoms: '/api/symptoms',
  'patient-info': '/api/patient-information-sheet',
  orders: '/api/orders',
  'page-layout': '/api/layout',
}

const TEXT_SECTIONS: string[] = ['diplomas', 'work-experience', 'services', 'medical-services', 'symptoms', 'patient-info']
const EMPTY_CS_META = { title: '', photo: '', photo_side: 'right' as 'left' | 'right', visible: 1 }

const SECTION_PHOTO_KEYS: Partial<Record<string, { key: string; label: string }>> = {
  diplomas:           { key: 'education',      label: 'Фото секції «Освіта та дипломи» (права сторона)' },
  'medical-services': { key: 'specialization', label: 'Фото секції «Спеціалізація» (ліва сторона)' },
  symptoms:           { key: 'symptoms',        label: 'Фото секції «Симптоми» (права сторона)' },
}

// ─── Fetch helpers (cookie auth, no token in code) ────────────────────────────
function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...opts, credentials: 'include' })
}
function apiJson(url: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  })
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) { setError(data.error ?? 'Помилка завантаження'); return }
      if (value?.startsWith('/uploads/')) {
        const oldFilename = value.split('/').pop()
        if (oldFilename) await apiFetch(`/api/upload/${encodeURIComponent(oldFilename)}`, { method: 'DELETE' })
      }
      onChange(data.url)
    } catch {
      setError('Помилка мережі')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!value) return
    const filename = value.split('/').pop()
    if (filename) {
      await apiFetch(`/api/upload/${encodeURIComponent(filename)}`, { method: 'DELETE' })
    }
    onChange('')
  }

  return (
    <div className="space-y-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className="h-32 rounded border object-cover" />
      )}
      <div className="flex gap-2 flex-wrap">
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded border text-sm cursor-pointer transition
          ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          {uploading ? 'Завантаження...' : value ? '📷 Змінити фото' : '📷 Вибрати фото'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" onClick={() => void handleDelete()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50 transition cursor-pointer">
            🗑 Видалити фото
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

// ─── Section Photo ────────────────────────────────────────────────────────────
function SectionPhoto({ photoKey, label }: { photoKey: string; label: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    void apiFetch('/api/section-photos')
      .then(r => r.json() as Promise<{ key: string; url: string }[]>)
      .then(rows => setUrl(rows.find(r => r.key === photoKey)?.url ?? ''))
  }, [photoKey])

  const handleChange = async (newUrl: string) => {
    setUrl(newUrl)
    await apiJson(`/api/section-photos/${photoKey}`, {
      method: 'PUT',
      body: JSON.stringify({ url: newUrl }),
    })
  }

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <ImageUpload value={url} onChange={handleChange} />
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Помилка входу'); return }
      onLogin()
    } catch {
      setError('Помилка мережі')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotStatus('loading')
    try {
      const res = await apiJson('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      })
      if (!res.ok) throw new Error()
      setForgotStatus('sent')
    } catch {
      setForgotStatus('error')
    }
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Скидання пароля</h1>
          {forgotStatus === 'sent' ? (
            <div className="text-center">
              <p className="text-green-700 font-medium mb-4">Якщо email існує — посилання надіслано.</p>
              <button onClick={() => { setForgotMode(false); setForgotStatus('idle') }} className="text-blue-600 underline text-sm">
                Повернутися до входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <input type="email" placeholder="Email" required value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400" />
              {forgotStatus === 'error' && <p className="text-red-500 text-sm">Помилка. Спробуйте ще раз.</p>}
              <button type="submit" disabled={forgotStatus === 'loading'}
                className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-60 cursor-pointer">
                {forgotStatus === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Відправка...
                  </span>
                ) : 'Надіслати посилання'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-gray-500 text-sm underline">
                Повернутися до входу
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Адмін-панель</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" required value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400" />
          <input type="password" placeholder="Пароль" required value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-60 cursor-pointer">
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
          <button type="button" onClick={() => setForgotMode(true)} className="w-full text-gray-500 text-sm underline">
            Забули пароль?
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Text table CRUD ──────────────────────────────────────────────────────────
function TextSection({ section }: { section: string }) {
  const [items, setItems] = useState<TextItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const endpoint = SECTION_ENDPOINTS[section]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(endpoint)
      setItems(await res.json() as TextItem[])
    } finally { setLoading(false) }
  }, [endpoint])

  useEffect(() => { void load() }, [load])

  const add = async () => {
    if (!newText.trim()) return
    await apiJson(endpoint, { method: 'POST', body: JSON.stringify({ text: newText.trim() }) })
    setNewText(''); void load()
  }

  const save = async (id: number) => {
    await apiJson(`${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify({ text: editText }) })
    setEditId(null); void load()
  }

  const remove = async (id: number) => {
    if (!confirm('Видалити?')) return
    await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' })
    void load()
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  const photoConfig = SECTION_PHOTO_KEYS[section]

  return (
    <div className="space-y-4">
      {photoConfig && <SectionPhoto photoKey={photoConfig.key} label={photoConfig.label} />}
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex gap-2 items-start bg-gray-50 rounded p-3">
            {editId === item.id ? (
              <>
                <textarea value={editText} onChange={e => setEditText(e.target.value)}
                  rows={3} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                <div className="flex flex-col gap-1">
                  <button onClick={() => void save(item.id)} className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Зберегти</button>
                  <button onClick={() => setEditId(null)} className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Скасувати</button>
                </div>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800 whitespace-pre-wrap">{item.text}</span>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setEditId(item.id); setEditText(item.text) }} className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Ред.</button>
                  <button onClick={() => void remove(item.id)} className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Вид.</button>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-gray-400 text-sm">Немає записів</li>}
      </ul>
      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Додати новий запис</p>
        <textarea value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Текст..." rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-2" />
        <button onClick={() => void add()} disabled={!newText.trim()}
          className="bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
          Додати
        </button>
      </div>
    </div>
  )
}

// ─── Address CRUD ─────────────────────────────────────────────────────────────
function AddressSection() {
  const [item, setItem] = useState<HeaderItem | null>(null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void apiFetch('/api/header')
      .then(r => r.json() as Promise<HeaderItem[]>)
      .then(rows => { if (rows[0]) { setItem(rows[0]); setAddress(rows[0].address) } })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaved(false)
    if (item) {
      await apiJson(`/api/header/${item.id}`, { method: 'PUT', body: JSON.stringify({ ...item, address }) })
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Адреса</label>
        <input type="text" value={address} onChange={e => setAddress(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <button onClick={() => void save()} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition cursor-pointer">
        Зберегти
      </button>
      {saved && <span className="text-green-600 text-sm ml-2">Збережено!</span>}
    </div>
  )
}

// ─── Header CRUD ──────────────────────────────────────────────────────────────
function HeaderSection() {
  const [item, setItem] = useState<HeaderItem | null>(null)
  const [form, setForm] = useState({ address: '', brand_name: '', phone_number_1: '', phone_number_2: '' })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void apiFetch('/api/header')
      .then(r => r.json() as Promise<HeaderItem[]>)
      .then(rows => {
        if (rows[0]) { setItem(rows[0]); setForm({ address: rows[0].address, brand_name: rows[0].brand_name, phone_number_1: rows[0].phone_number_1, phone_number_2: rows[0].phone_number_2 }) }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaved(false)
    if (item) {
      await apiJson(`/api/header/${item.id}`, { method: 'PUT', body: JSON.stringify(form) })
    } else {
      await apiJson('/api/header', { method: 'POST', body: JSON.stringify(form) })
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Логотип / Фото</label>
        <SectionPhoto photoKey="logo" label="" />
      </div>
      {(['phone_number_1', 'phone_number_2'] as const).map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace(/_/g, ' ')}</label>
          <input type="text" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      ))}
      <button onClick={() => void save()} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition cursor-pointer">
        {item ? 'Зберегти' : 'Створити'}
      </button>
      {saved && <span className="text-green-600 text-sm ml-2">Збережено!</span>}
    </div>
  )
}

// ─── About CRUD ───────────────────────────────────────────────────────────────
function AboutSection() {
  const [item, setItem] = useState<AboutItem | null>(null)
  const [form, setForm] = useState({ photo: '', fio: '', text_about: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void apiFetch('/api/about')
      .then(r => r.json() as Promise<AboutItem[]>)
      .then(rows => {
        if (rows[0]) { setItem(rows[0]); setForm({ photo: rows[0].photo, fio: rows[0].fio, text_about: rows[0].text_about, email: rows[0].email }) }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaved(false)
    if (item) {
      await apiJson(`/api/about/${item.id}`, { method: 'PUT', body: JSON.stringify(form) })
    } else {
      await apiJson('/api/about', { method: 'POST', body: JSON.stringify(form) })
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
        <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ПІБ</label>
        <input type="text" value={form.fio} onChange={e => setForm(f => ({ ...f, fio: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Текст про лікаря</label>
        <textarea value={form.text_about} onChange={e => setForm(f => ({ ...f, text_about: e.target.value }))}
          rows={6} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
      </div>
      <button onClick={() => void save()} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition cursor-pointer">
        {item ? 'Зберегти' : 'Створити'}
      </button>
      {saved && <span className="text-green-600 text-sm ml-2">Збережено!</span>}
    </div>
  )
}

// ─── Orders ───────────────────────────────────────────────────────────────────
function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/orders')
      setOrders(await res.json() as Order[])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const remove = async (id: number) => {
    if (!confirm('Видалити заявку?')) return
    await apiFetch(`/api/orders/${id}`, { method: 'DELETE' })
    void load()
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>
  if (orders.length === 0) return <p className="text-gray-400">Заявок немає</p>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-200 px-4 py-2 text-left">ID</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Дата</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Ім&apos;я</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Телефон</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Опис</th>
            <th className="border border-gray-200 px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-4 py-2 text-gray-500">{o.id}</td>
              <td className="border border-gray-200 px-4 py-2 text-gray-500 whitespace-nowrap text-xs">
                {o.created_at
                  ? new Date(o.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </td>
              <td className="border border-gray-200 px-4 py-2">{o.name}</td>
              <td className="border border-gray-200 px-4 py-2">{o.phone_number}</td>
              <td className="border border-gray-200 px-4 py-2 text-xs">{o.email || '—'}</td>
              <td className="border border-gray-200 px-4 py-2 max-w-xs whitespace-pre-wrap">{o.description}</td>
              <td className="border border-gray-200 px-4 py-2">
                <button onClick={() => void remove(o.id)} className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Structure Section ────────────────────────────────────────────────────────
function StructureSection({ onCustomSectionsChange }: { onCustomSectionsChange?: () => void }) {
  const [layout, setLayout] = useState<LayoutItem[]>([])
  const [ordered, setOrdered] = useState<LayoutItem[]>([])
  const [changed, setChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/layout')
      const data = await res.json() as LayoutItem[]
      setLayout(data); setOrdered(data); setChanged(false)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setOrdered(o => { const a = [...o]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a })
    setChanged(true)
  }
  const moveDown = (idx: number) => {
    setOrdered(o => {
      if (idx === o.length - 1) return o
      const a = [...o]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a
    })
    setChanged(true)
  }
  const toggleVisible = async (item: LayoutItem) => {
    await apiJson(`/api/layout/${item.id}/visible`, {
      method: 'PUT',
      body: JSON.stringify({ visible: item.visible ? 0 : 1 }),
    })
    void load()
  }
  const saveOrder = async () => {
    setSaving(true)
    await apiJson('/api/layout/reorder', {
      method: 'PUT',
      body: JSON.stringify(ordered.map((r, idx) => ({ id: r.id, sort_order: idx }))),
    })
    setSaving(false); void load()
  }
  const remove = async (csId: number) => {
    if (!confirm('Видалити секцію?')) return
    await apiFetch(`/api/custom-sections/${csId}`, { method: 'DELETE' })
    void load(); onCustomSectionsChange?.()
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  return (
    <div className="space-y-2 max-w-2xl">
      <p className="text-xs text-gray-400 mb-3">Переміщуйте ▲/▼ щоб змінити порядок. Зніміть галочку — секція зникне з сайту.</p>
      {ordered.map((item, idx) => {
        const isCustom = item.section_key.startsWith('custom-')
        const csId = isCustom ? parseInt(item.section_key.replace('custom-', '')) : 0
        return (
          <div key={item.id} className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${item.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
            <span className="text-gray-400 font-bold text-sm w-6 text-center shrink-0">{idx + 1}</span>
            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => moveUp(idx)} disabled={idx === 0}
                className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 cursor-pointer text-xs">▲</button>
              <button onClick={() => moveDown(idx)} disabled={idx === ordered.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 cursor-pointer text-xs">▼</button>
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input type="checkbox" checked={item.visible === 1} onChange={() => void toggleVisible(item)} />
              <span className="text-xs text-gray-500">{item.visible ? 'видима' : 'прихована'}</span>
            </label>
            {isCustom && (
              <button onClick={() => void remove(csId)}
                className="bg-red-500 text-white text-xs px-2.5 py-1 rounded hover:opacity-90 cursor-pointer shrink-0">Видалити</button>
            )}
          </div>
        )
      })}
      {changed && (
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => void saveOrder()} disabled={saving}
            className="bg-blue-600 text-white font-semibold px-5 py-2 rounded hover:opacity-90 transition disabled:opacity-60 cursor-pointer text-sm">
            {saving ? 'Збереження...' : '💾 Зберегти порядок'}
          </button>
          <button onClick={() => { setOrdered(layout); setChanged(false) }} className="text-gray-500 text-sm underline cursor-pointer">скасувати</button>
        </div>
      )}
    </div>
  )
}

// ─── Custom Section Editor ────────────────────────────────────────────────────
function CustomSectionEditor({ id, onSaved, onDeleted }: {
  id: number | null;
  onSaved?: (newId: number) => void;
  onDeleted?: () => void;
}) {
  const [loading, setLoading] = useState(id !== null)
  const [meta, setMeta] = useState({ ...EMPTY_CS_META })
  const [bullets, setBullets] = useState<string[]>([])
  const [newBullet, setNewBullet] = useState('')
  const [editBulletIdx, setEditBulletIdx] = useState<number | null>(null)
  const [editBulletText, setEditBulletText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (id === null) return
    setLoading(true)
    void apiFetch('/api/custom-sections/all')
      .then(r => r.json() as Promise<CustomSection[]>)
      .then(list => {
        const item = list.find(cs => cs.id === id)
        if (item) {
          setMeta({ title: item.title, photo: item.photo, photo_side: item.photo_side, visible: item.visible })
          setBullets(item.text ? item.text.split('\n').filter(Boolean) : [])
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const addBullet = () => {
    if (!newBullet.trim()) return
    setBullets(b => [...b, newBullet.trim()]); setNewBullet('')
  }
  const saveBullet = (idx: number) => {
    setBullets(b => b.map((x, i) => i === idx ? editBulletText : x)); setEditBulletIdx(null)
  }
  const removeBullet = (idx: number) => setBullets(b => b.filter((_, i) => i !== idx))

  const save = async () => {
    if (!meta.title.trim()) return
    if (id !== null) {
      await apiJson(`/api/custom-sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...meta, text: bullets.join('\n') }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      onSaved?.(id)
    } else {
      const res = await apiJson('/api/custom-sections', {
        method: 'POST',
        body: JSON.stringify({ ...meta, text: bullets.join('\n') }),
      })
      const data = await res.json() as { id: number }
      onSaved?.(data.id)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Видалити секцію?')) return
    await apiFetch(`/api/custom-sections/${id}`, { method: 'DELETE' })
    onDeleted?.()
  }

  if (loading) return <p className="text-gray-500">Завантаження...</p>

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
        <input type="text" value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Пункти тексту</label>
        <ul className="space-y-2 mb-3">
          {bullets.map((b, idx) => (
            <li key={idx} className="flex gap-2 items-start bg-white rounded p-3 border border-gray-200">
              {editBulletIdx === idx ? (
                <>
                  <textarea value={editBulletText} onChange={e => setEditBulletText(e.target.value)}
                    rows={2} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none resize-none" />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => saveBullet(idx)} className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Зберегти</button>
                    <button onClick={() => setEditBulletIdx(null)} className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Скасувати</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{b}</span>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { setEditBulletIdx(idx); setEditBulletText(b) }} className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Ред.</button>
                    <button onClick={() => removeBullet(idx)} className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:opacity-90 cursor-pointer">Вид.</button>
                  </div>
                </>
              )}
            </li>
          ))}
          {bullets.length === 0 && <li className="text-gray-400 text-xs">Пунктів немає</li>}
        </ul>
        <div className="flex gap-2">
          <input type="text" value={newBullet} onChange={e => setNewBullet(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBullet() } }}
            placeholder="Новий пункт..." className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={addBullet} disabled={!newBullet.trim()}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 cursor-pointer">Додати</button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Фото <span className="text-gray-400 font-normal">(необов&apos;язково)</span></label>
        <ImageUpload value={meta.photo} onChange={url => setMeta(m => ({ ...m, photo: url }))} />
      </div>
      {meta.photo && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Розташування фото</label>
          <div className="flex gap-4">
            {(['left', 'right'] as const).map(side => (
              <label key={side} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={meta.photo_side === side} onChange={() => setMeta(m => ({ ...m, photo_side: side }))} />
                <span className="text-sm">{side === 'left' ? 'Зліва' : 'Справа'}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={meta.visible === 1} onChange={e => setMeta(m => ({ ...m, visible: e.target.checked ? 1 : 0 }))} />
        <span className="text-sm font-medium text-gray-700">Показувати на сайті</span>
      </label>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => void save()} disabled={!meta.title.trim()}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50 cursor-pointer text-sm">
          {saved ? '✓ Збережено' : id !== null ? 'Зберегти' : 'Створити секцію'}
        </button>
        {id !== null && (
          <button onClick={() => void handleDelete()}
            className="bg-red-500 text-white font-semibold px-5 py-2 rounded hover:opacity-90 transition cursor-pointer text-sm">
            Видалити секцію
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<SectionKey>('orders')
  const [customSections, setCustomSections] = useState<CustomSection[]>([])

  const loadCustomSections = useCallback(async () => {
    const res = await apiFetch('/api/custom-sections/all')
    setCustomSections(await res.json() as CustomSection[])
  }, [])

  useEffect(() => { void loadCustomSections() }, [loadCustomSections])

  const getSectionTitle = () => {
    if (section === '__new-custom__') return 'Нова секція'
    if (section.startsWith('custom-')) {
      const id = parseInt(section.replace('custom-', ''))
      return customSections.find(cs => cs.id === id)?.title ?? 'Секція'
    }
    return SECTION_LABELS[section] ?? ''
  }

  const renderContent = () => {
    if (section === 'header') return <HeaderSection />
    if (section === 'address') return <AddressSection />
    if (section === 'about') return <AboutSection />
    if (section === 'orders') return <OrdersSection />
    if (section === 'order-bg') return (
      <div className="max-w-lg space-y-2">
        <p className="text-sm text-gray-500">Фонове зображення для секції «Записатися на прийом». Якщо фото не вибрано — використовується стандартне.</p>
        <SectionPhoto photoKey="order-bg" label="Фонове фото" />
      </div>
    )
    if (section === 'page-layout') return <StructureSection onCustomSectionsChange={loadCustomSections} />
    if (TEXT_SECTIONS.includes(section)) return <TextSection section={section} />
    if (section === '__new-custom__') {
      return <CustomSectionEditor key="new" id={null} onSaved={newId => { void loadCustomSections(); setSection(`custom-${newId}`) }} />
    }
    if (section.startsWith('custom-')) {
      const id = parseInt(section.replace('custom-', ''))
      return <CustomSectionEditor key={id} id={id}
        onSaved={() => void loadCustomSections()}
        onDeleted={() => { void loadCustomSections(); setSection('page-layout') }} />
    }
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow">
        <span className="font-bold text-lg">Адмін-панель</span>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" className="text-blue-200 text-sm hover:text-white underline">Сайт ↗</a>
          <button onClick={onLogout} className="bg-white/20 text-white text-sm px-3 py-1 rounded hover:bg-white/30 transition cursor-pointer">
            Вийти
          </button>
        </div>
      </div>
      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
          <ul className="py-2">
            {Object.keys(SECTION_LABELS).map(key => (
              <li key={key}>
                <button onClick={() => setSection(key)}
                  className={`w-full text-left px-5 py-3 text-sm transition cursor-pointer ${
                    section === key ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {key === 'orders' && <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-2 mb-0.5" />}
                  {SECTION_LABELS[key]}
                </button>
              </li>
            ))}
            <li className="px-4 pt-4 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Нові секції</span>
              <button onClick={() => setSection('__new-custom__')}
                className={`text-xs font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                  section === '__new-custom__' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}>+ Нова</button>
            </li>
            {customSections.map(cs => (
              <li key={cs.id} className="flex items-center group">
                <button onClick={() => setSection(`custom-${cs.id}`)}
                  className={`flex-1 text-left pl-5 pr-2 py-2.5 text-sm transition cursor-pointer flex items-center gap-2 min-w-0 ${
                    section === `custom-${cs.id}` ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {cs.visible === 0 && <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" title="прихована" />}
                  <span className="truncate">{cs.title}</span>
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Видалити «${cs.title}»?`)) return
                    void apiFetch(`/api/custom-sections/${cs.id}`, { method: 'DELETE' })
                      .then(() => { void loadCustomSections(); if (section === `custom-${cs.id}`) setSection('page-layout') })
                  }}
                  className="px-2 py-2.5 text-gray-300 hover:text-red-500 transition cursor-pointer opacity-0 group-hover:opacity-100 text-xs shrink-0"
                  title="Видалити">✕</button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 p-8 overflow-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{getSectionTitle()}</h2>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // Проверяем активную сессию через cookie
    apiFetch('/api/auth/me')
      .then(r => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false))
  }, [])

  const handleLogout = async () => {
    await apiJson('/api/auth/logout', { method: 'POST' })
    setLoggedIn(false)
  }

  if (loggedIn === null) return null // проверяем сессию

  if (!loggedIn) return <LoginForm onLogin={() => setLoggedIn(true)} />

  return <Dashboard onLogout={handleLogout} />
}

'use client'
import { useState, useEffect } from 'react'

interface NavItem { label: string; href: string }

export default function BurgerMenu({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false)

  // Закрыть по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Заблокировать прокрутку когда меню открыто
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLink = () => setOpen(false)

  return (
    <>
      {/* Кнопка бургера */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex flex-col gap-1.5 cursor-pointer ml-1 p-1 group"
        aria-label="Меню"
        aria-expanded={open}
      >
        <span className={`block w-7 h-0.5 bg-gray-800 transition-all duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`block w-7 h-0.5 bg-gray-800 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-7 h-0.5 bg-gray-800 transition-all duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      {/* Затемнение фона */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Боковая панель */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Шапка панели */}
        <div className="bg-site-blue text-white px-6 py-5 flex items-center justify-between">
          <span className="font-bold text-lg">Навігація</span>
          <button onClick={() => setOpen(false)} className="cursor-pointer p-1 hover:opacity-70 transition" aria-label="Закрити">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Навигационные ссылки */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={handleLink}
              className="flex items-center gap-3 px-6 py-4 text-gray-700 hover:bg-site-blue/10 hover:text-site-blue transition border-b border-gray-100 last:border-0"
            >
              <span className="w-2 h-2 rounded-full bg-site-blue shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* Кнопка записи внизу */}
        <div className="p-6 border-t border-gray-100">
          <a
            href="#order"
            onClick={handleLink}
            className="block w-full bg-site-orange text-white text-center font-semibold py-3 rounded hover:opacity-90 transition"
          >
            Записатися на прийом
          </a>
        </div>
      </div>
    </>
  )
}

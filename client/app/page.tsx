export const dynamic = 'force-dynamic'

import OrderForm from './_components/OrderForm'
import BurgerMenu from './_components/BurgerMenu'

interface HeaderData { id: number; address: string; brand_name: string; phone_number_1: string; phone_number_2: string }
interface AboutData { id: number; photo: string; fio: string; text_about: string; email: string }
interface TextItem { id: number; text: string }
interface CustomSection { id: number; title: string; text: string; photo: string; photo_side: 'left' | 'right'; sort_order: number; visible: number }
interface LayoutItem { id: number; section_key: string; label: string; sort_order: number; visible: number }

const API = process.env.API_URL || 'http://localhost:3003'

function slugify(text: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye',
    'ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l',
    'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
    'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'',
    'ю':'yu','я':'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map(c => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function get<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}`)
    if (!res.ok) return []
    return res.json() as Promise<T[]>
  } catch { return [] }
}

export default async function HomePage() {
  const [headers, abouts, diplomas, workExp, services, medServices, symptoms, patientInfo, customSections, layout, photoItems] =
    await Promise.all([
      get<HeaderData>('/api/header'),
      get<AboutData>('/api/about'),
      get<TextItem>('/api/diplomas'),
      get<TextItem>('/api/work-experience'),
      get<TextItem>('/api/services'),
      get<TextItem>('/api/medical-services'),
      get<TextItem>('/api/symptoms'),
      get<TextItem>('/api/patient-information-sheet'),
      get<CustomSection>('/api/custom-sections'),
      get<LayoutItem>('/api/layout'),
      get<{key: string; url: string}>('/api/section-photos'),
    ])

  const photos: Record<string, string> = {}
  photoItems.forEach(p => { if (p.url) photos[p.key] = p.url })

  const header = headers[0]
  const about = abouts[0]

  // ─── Section render map ───────────────────────────────────────────────────
  const sectionMap: Record<string, React.ReactNode> = {

    about: about ? (
      <section id="about" className="py-12 px-6 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={about.photo} alt={about.fio} className="w-full max-w-md mx-auto object-cover rounded" />
          </div>
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900 mb-5 leading-tight">{about.fio}</h1>
            <p className="text-gray-700 mb-6 leading-relaxed">{about.text_about}</p>
            <div className="flex items-center gap-2 text-gray-800 mb-7">
              <svg className="w-5 h-5 text-site-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${about.email}`} className="font-semibold hover:text-site-blue transition">{about.email}</a>
            </div>
            <a href="#order" className="inline-block bg-site-orange text-white font-semibold px-8 py-3 rounded hover:opacity-90 transition">
              Записатися на прийом
            </a>
          </div>
        </div>
      </section>
    ) : null,

    education: (diplomas.length > 0 || workExp.length > 0) ? (
      <section id="education" className="py-12 px-6 bg-site-blue text-white scroll-mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
          <div className="md:w-1/2 space-y-8">
            {diplomas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Дипломи</h2>
                <ul className="space-y-2">{diplomas.map(i => <li key={i.id} className="flex gap-2"><span className="mt-1 shrink-0">•</span><span>{i.text}</span></li>)}</ul>
              </div>
            )}
            {workExp.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Досвід роботи</h2>
                <ul className="space-y-2">{workExp.map(i => <li key={i.id} className="flex gap-2"><span className="mt-1 shrink-0">•</span><span>{i.text}</span></li>)}</ul>
              </div>
            )}
          </div>
          <div className="md:w-1/2 flex items-center justify-center">
            {photos['education']
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photos['education']} alt="Освіта" className="w-full max-w-sm rounded-lg object-cover" />
              : <div className="bg-white/20 rounded-lg w-full max-w-sm aspect-[3/4] flex items-center justify-center text-white/60 text-sm">Ліцензія / Диплом</div>
            }
          </div>
        </div>
      </section>
    ) : null,

    specialization: medServices.length > 0 ? (
      <section id="specialization" className="py-12 px-6 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Спектр допомоги</h2>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="md:w-1/2">
              {photos['specialization']
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photos['specialization']} alt="Спеціалізація" className="w-full rounded object-cover" />
                : <div className="bg-gray-100 rounded aspect-[4/3] flex items-center justify-center text-gray-400 text-sm">Фото</div>
              }
            </div>
            <div className="md:w-1/2">
              <ul className="space-y-3">{medServices.map(i => <li key={i.id} className="flex gap-2 text-gray-700"><span className="mt-1 text-site-blue shrink-0">•</span><span>{i.text}</span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    services: services.length > 0 ? (
      <section id="services" className="py-12 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Послуги лікаря&#8209;психіатра</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6">
            {services.map(i => <div key={i.id} className="pb-2 border-b-2 border-site-blue text-gray-700">{i.text}</div>)}
          </div>
        </div>
      </section>
    ) : null,

    symptoms: symptoms.length > 0 ? (
      <section id="symptoms" className="py-12 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Перші ознаки хвороби</h2>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="md:w-1/2">
              <ul className="space-y-2">{symptoms.map(i => <li key={i.id} className="flex gap-2 text-gray-700"><span className="mt-1 text-site-blue shrink-0">•</span><span>{i.text}</span></li>)}</ul>
            </div>
            <div className="md:w-1/2">
              {photos['symptoms']
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photos['symptoms']} alt="Симптоми" className="w-full rounded object-cover" />
                : <div className="bg-gray-100 rounded aspect-[4/3] flex items-center justify-center text-gray-400 text-sm">Фото</div>
              }
            </div>
          </div>
        </div>
      </section>
    ) : null,

    order: (
      <section id="order" className="py-16 px-6 scroll-mt-24 relative bg-gray-700"
        style={{ backgroundImage: `url('${photos['order-bg'] || '/order-bg.jpg'}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-lg mx-auto"><OrderForm /></div>
      </section>
    ),

    contacts: (
      <section id="contacts" className="py-14 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-wide uppercase">Контакти</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 justify-center">
              <svg className="w-7 h-7 text-site-blue shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <div className="text-left">
                {header?.phone_number_1 && <a href={`tel:${header.phone_number_1.replace(/[^+\d]/g, '')}`} className="block font-bold text-gray-900 text-lg hover:text-site-blue transition">{header.phone_number_1}</a>}
                {header?.phone_number_2 && <a href={`tel:${header.phone_number_2.replace(/[^+\d]/g, '')}`} className="block font-bold text-gray-900 text-lg hover:text-site-blue transition">{header.phone_number_2}</a>}
              </div>
            </div>
            {header?.address && (
              <div className="flex items-center gap-4 justify-center">
                <svg className="w-7 h-7 text-site-blue shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <p className="text-gray-700 text-left leading-snug">{header.address}</p>
              </div>
            )}
            {about?.email && (
              <div className="flex items-center gap-4 justify-center">
                <svg className="w-7 h-7 text-site-blue shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href={`mailto:${about.email}`} className="font-bold text-gray-900 text-base hover:text-site-blue transition">{about.email}</a>
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    map: (
      <section id="map" className="py-8 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="w-full h-72 rounded overflow-hidden bg-gray-200">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(header?.address ?? 'Дніпро')}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="Карта"
            />
          </div>
          {header?.address && <p className="text-center text-gray-600 mt-3 text-sm">📍 {header.address}</p>}
        </div>
      </section>
    ),

    'patient-info': patientInfo.length > 0 ? (
      <section id="patient-info" className="py-12 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Пам&apos;ятка для пацієнта</h2>
          <ol className="space-y-3">
            {patientInfo.map((item, idx) => (
              <li key={item.id} className="flex gap-3 text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900 shrink-0">{idx + 1}.</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ) : null,
  }

  // Add custom sections to map
  for (const cs of customSections) {
    const bullets = cs.text.split('\n').filter(Boolean)
    const hasPhoto = cs.photo.trim() !== ''
    const photoFirst = cs.photo_side === 'left'
    sectionMap[`custom-${cs.id}`] = (
      <section key={cs.id} id={slugify(cs.title)} className="py-12 px-6 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">{cs.title}</h2>
          {hasPhoto ? (
            <div className={`flex flex-col gap-10 items-start ${photoFirst ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              <div className="md:w-1/2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cs.photo} alt={cs.title} className="w-full rounded object-cover" />
              </div>
              <div className="md:w-1/2">
                <ul className="space-y-2">{bullets.map((line, i) => <li key={i} className="flex gap-2 text-gray-700"><span className="mt-1 text-site-blue shrink-0">•</span><span>{line}</span></li>)}</ul>
              </div>
            </div>
          ) : (
            <ul className="space-y-2 max-w-3xl mx-auto">
              {bullets.map((line, i) => <li key={i} className="flex gap-2 text-gray-700"><span className="mt-1 text-site-blue shrink-0">•</span><span>{line}</span></li>)}
            </ul>
          )}
        </div>
      </section>
    )
  }

  // Visible sections in DB order (fallback to default keys if no layout yet)
  const orderedKeys = layout.length > 0
    ? layout.filter(l => l.visible).map(l => l.section_key)
    : ['about', 'education', 'specialization', 'services', 'symptoms', 'order', 'contacts', 'map', 'patient-info']

  const defaultLabels: Record<string, string> = {
    about: 'про лікаря',
    education: 'освіта',
    specialization: 'спектр допомоги',
    services: 'послуги лікаря',
    symptoms: 'перші ознаки хвороби',
    contacts: 'контакти',
    map: 'карта',
    'patient-info': "пам'ятка для пацієнта",
  }

  const navItems = orderedKeys
    .filter(key => key !== 'order')
    .map(key => {
      const dbLabel = layout.find(l => l.section_key === key)?.label
      const customSection = customSections.find(cs => `custom-${cs.id}` === key)
      const label = dbLabel || customSection?.title || defaultLabels[key] || key
      const href = key.startsWith('custom-') ? `#${slugify(customSection?.title ?? key)}` : `#${key}`
      return { label: label.toLowerCase(), href }
    })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: about?.fio ?? "Корень Марина Григорівна",
    description: "Лікар-психіатр вищої категорії, стаж більше 27 років. Ліцензія МОЗ №1552 від 06.09.2024.",
    url: "https://www.dr-koren.dp.ua/",
    telephone: ["+380970202495", "+380996443290"],
    email: about?.email ?? "doc.marinakoren@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: header?.address ?? "вул. Святослава Хороброго 33",
      addressLocality: "Дніпро",
      addressCountry: "UA",
    },
    medicalSpecialty: "Psychiatry",
    areaServed: { "@type": "City", name: "Дніпро" },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <main>
      {/* ХЕДЕР */}
      <header className="bg-header-bg py-3 px-6 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center">
            {photos['logo']
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photos['logo']} alt={header?.brand_name ?? 'Логотип'} className="h-14 w-auto object-contain" />
              : <div className="text-xs sm:text-sm font-bold uppercase leading-tight text-gray-800 max-w-xs">{header?.brand_name ?? "ЦЕНТР ЗАБЕЗПЕЧЕННЯ ПСИХІЧНОГО ТА ФІЗИЧНОГО ЗДОРОВ'Я"}</div>
            }
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              {header?.phone_number_1
                ? <a href={`tel:${header.phone_number_1.replace(/[^+\d]/g, '')}`} className="block font-semibold text-gray-800 text-sm hover:text-site-blue transition">{header.phone_number_1}</a>
                : <a href="tel:+380970202495" className="block font-semibold text-gray-800 text-sm hover:text-site-blue transition">+38 (097) 020-24-95</a>}
              {header?.phone_number_2
                ? <a href={`tel:${header.phone_number_2.replace(/[^+\d]/g, '')}`} className="block font-semibold text-gray-800 text-sm hover:text-site-blue transition">{header.phone_number_2}</a>
                : <a href="tel:+380996443290" className="block font-semibold text-gray-800 text-sm hover:text-site-blue transition">+38 (099) 644-32-90</a>}
            </div>
            <svg className="w-8 h-8 text-site-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
            </svg>
            <BurgerMenu navItems={navItems} />
          </div>
        </div>
      </header>

      {/* СЕКЦІЇ У ПОРЯДКУ З БД */}
      {orderedKeys.map(key => {
        const node = sectionMap[key]
        if (!node) return null
        return <div key={key}>{node}</div>
      })}
    </main>
    </>
  )
}

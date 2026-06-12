'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/library', label: 'Library' },
  { href: '/queue', label: 'Queue' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white">
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6 flex items-end justify-between">
        <Link href="/" className="font-serif text-[44px] font-black text-[#000000] tracking-tight leading-none">
          the news.
        </Link>

        <nav className="flex items-center gap-8 pb-1.5">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`group relative font-sans text-[15px] tracking-wide transition-colors duration-200 ${
                  active ? 'text-[#000000]' : 'text-[#6b6b6b] hover:text-[#000000]'
                }`}
              >
                {label}
                <span
                  className={`absolute -bottom-1 left-0 h-[1.5px] bg-[#000000] transition-all duration-300 ease-out ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

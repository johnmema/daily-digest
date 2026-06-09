'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Today' },
  { href: '/library', label: 'Library' },
  { href: '/queue', label: 'Queue' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-[#e8e5e0] bg-[#f9f7f4]">
      <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-[28px] font-bold text-[#1a1a1a] tracking-tight leading-none">
          daily digest.
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-sans text-[13px] tracking-wide transition-colors ${
                pathname === href
                  ? 'text-[#1a1a1a]'
                  : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-px bg-[#1a1a1a] transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-px bg-[#1a1a1a] transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-[#1a1a1a] transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#e8e5e0] px-8 py-5 flex flex-col gap-5 bg-[#f9f7f4]">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`font-sans text-[13px] tracking-wide ${
                pathname === href ? 'text-[#1a1a1a]' : 'text-[#6b6b6b]'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

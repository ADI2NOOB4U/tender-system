'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home',          href: '/' },
  { label: 'Reports',       href: '/reports' },
  { label: 'Guidelines',    href: '/guidelines' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="nav-strip">
      <div className="nav-inner">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`nav-tab${isActive ? ' active' : ''}`}
            >
              {label.toUpperCase()}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

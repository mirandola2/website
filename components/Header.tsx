import Link from 'next/link'
import Image from 'next/image'
import HeaderNavbar from './HeaderNavbar'
import NavLink from './NavLink'
import SiteAccount from './SiteAccount'
import { DRAWER_ID, menuItems, utilityItems } from './navigation'
import { CaretDownIcon, ListIcon, SquaresFourIcon, XIcon } from '@phosphor-icons/react/ssr'

// daisyUI paints the current page with the neutral background: here it is only bold, no other effect.
const onPrimary = '[--menu-active-bg:transparent] [--menu-active-fg:white]'
const onPrimaryLink = 'transition-colors hover:bg-white/10 hover:text-white focus-visible:text-white aria-[current=page]:font-bold'
const onNeutral = '[--menu-active-bg:transparent] [--menu-active-fg:black]'
const onNeutralLink = 'transition-colors hover:bg-black/10 focus-visible:text-black aria-[current=page]:font-bold'
const iconButton =
  'grid size-11 place-items-center rounded-field cursor-pointer text-white transition hover:bg-white/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-white'

// daisyUI speed dial, anchored to the navbar instead of the screen corner and opening downwards
function UtilitiesFab() {
  return (
    <div className="relative size-11 flex-none max-xl:hidden">
      <div className="fab absolute top-0 end-0 bottom-auto flex-col [&_.fab-close]:top-0 [&_.fab-close]:bottom-auto">
        <div tabIndex={0} role="button" className={iconButton} aria-label="Strumenti" title="Strumenti">
          <SquaresFourIcon size={26} weight="bold" aria-hidden />
        </div>
        <div className="fab-close">
          <span className="btn btn-circle size-11 bg-secondary text-white border-0 shadow-lg" aria-label="Chiudi">
            <XIcon size={20} weight="bold" aria-hidden />
          </span>
        </div>
        {utilityItems.map(({ label, href, icon: Icon }) => (
          <NavLink key={href} href={href} className="group">
            <span className="rounded-full bg-neutral text-black px-3 py-1.5 font-medium shadow-lg transition-colors group-hover:bg-primary group-hover:text-white group-aria-[current=page]:font-bold">
              {label}
            </span>
            <span className="btn btn-circle bg-neutral text-primary border-0 shadow-lg group-hover:bg-primary group-hover:text-white">
              <Icon size={22} weight="duotone" aria-hidden />
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function DesktopMenu() {
  return (
    <nav className="hidden xl:block" aria-label="Menu principale">
      <ul className={`menu menu-horizontal gap-1 text-white text-[0.9375rem] ${onPrimary}`}>
        {menuItems.map((item, i) => {
          if (!item.children) {
            return (
              <li key={item.label}>
                <NavLink href={item.href!} className={onPrimaryLink}>
                  {item.label}
                </NavLink>
              </li>
            )
          }
          // Menus open to the right, except the last ones which would overflow the screen
          const alignEnd = i >= menuItems.length - 2
          return (
            <li key={item.label}>
              <div className={`dropdown group rounded-field transition-colors hover:bg-white/10 focus-within:bg-secondary focus-within:hover:bg-secondary focus-within:text-white ${alignEnd ? 'dropdown-end' : 'dropdown-start'}`}>
                <div tabIndex={0} role="button" className="flex items-center gap-1">
                  {item.label}
                  <CaretDownIcon
                    size={14}
                    weight="bold"
                    className="opacity-70 transition-transform duration-200 group-focus-within:rotate-180"
                    aria-hidden
                  />
                </div>
                {/* pt-2 bridges the gap below the trigger, so the menu doesn't close on the way down */}
                <div className={`dropdown-content z-10 pt-2 ${alignEnd ? '' : 'start-0'}`}>
                  <ul
                    tabIndex={0}
                    className={`menu ms-0 before:hidden p-2 shadow-xl bg-neutral text-neutral-content rounded-box w-64 ${onNeutral}`}
                  >
                    {item.children.map(child => (
                      <li key={child.label}>
                        <NavLink href={child.href!} className={onNeutralLink}>
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function MobileDrawer() {
  return (
    <div className="drawer-side z-50">
      <label htmlFor={DRAWER_ID} className="drawer-overlay">
        <span className="sr-only">Chiudi il menu</span>
      </label>
      <div className="flex flex-row min-h-full">
        <div className="bg-[#07ac0f] w-1" />
        <div className="bg-[#ffee18] w-1" />
        <nav aria-label="Menu principale" className="flex w-80 max-w-[calc(100vw-3rem)] min-h-full flex-col bg-secondary text-white">
          <div className="flex items-start justify-between p-4 pb-2">
            <Link href="/" aria-label="Home - Scout Mirandola 2">
              <Image src="/img/graphics/logo_white.svg" alt="" width={96} height={96} className="h-20 w-auto" />
            </Link>
            <label htmlFor={DRAWER_ID} className={iconButton}>
              <XIcon size={24} weight="bold" aria-hidden />
              <span className="sr-only">Chiudi il menu</span>
            </label>
          </div>

          <ul className={`menu w-full px-3 text-base ${onPrimary}`}>
            {menuItems.map(item => (
              <li key={item.label}>
                {item.children ? (
                  <details>
                    <summary className="py-2.5 hover:bg-white/10">{item.label}</summary>
                    <ul className="before:bg-white/20">
                      {item.children.map(child => (
                        <li key={child.label}>
                          <NavLink href={child.href!} className={`py-2 ${onPrimaryLink}`}>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <NavLink href={item.href!} className={`py-2.5 ${onPrimaryLink}`}>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-auto border-t border-white/15 p-3">
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-white/60">Strumenti</p>
            <ul className={`menu w-full p-0 text-base ${onPrimary}`}>
              {utilityItems.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <NavLink href={href} className={`py-2.5 ${onPrimaryLink}`}>
                    <Icon size={20} aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer drawer-end">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" aria-label="Menu" />
      <div className="drawer-content flex flex-col min-h-screen">
        <HeaderNavbar>
          <div className="container max-xl:px-3 flex items-center gap-1">
            <div className="flex-1">
              <Link href="/" aria-label="Home - Scout Mirandola 2" className="inline-block">
                <Image
                  src="/img/graphics/logo_white.svg"
                  alt="Logo Scout Mirandola 2"
                  // Same size as the drawer and Tabù logos: one ImageKit file on every page
                  width={96}
                  height={96}
                  className="h-14 w-auto transition-[height] duration-300 xl:h-16 group-data-scrolled/navbar:h-12 xl:group-data-scrolled/navbar:h-14"
                />
              </Link>
            </div>

            <DesktopMenu />

            <UtilitiesFab />

            {/* Only for a logged-in leader */}
            <SiteAccount />

            <label htmlFor={DRAWER_ID} className={`${iconButton} xl:hidden`}>
              <ListIcon size={28} weight="bold" aria-hidden />
              <span className="sr-only">Apri il menu</span>
            </label>
          </div>
        </HeaderNavbar>

        {children}
      </div>

      <MobileDrawer />
    </div>
  )
}

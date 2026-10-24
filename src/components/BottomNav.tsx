export default function BottomNav({ current }: { current: string | null }) {
  const active =
    current === 'budget'
      ? 'budget'
      : current === 'shopping'
        ? 'shopping'
        : current
          ? 'more'
          : null
  return (
    <nav className="bottom-nav" aria-label="主要分頁">
      {[
        { id: null, href: '#/', label: '首頁', icon: '⌂' },
        { id: 'budget', href: '#/budget', label: '記帳', icon: '▤' },
        { id: 'shopping', href: '#/shopping', label: '想買', icon: '◇' },
        { id: 'more', href: '#/more', label: '更多', icon: '···' },
      ].map((item) => (
        <a
          key={item.label}
          href={item.href}
          data-nav={item.id ?? 'home'}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

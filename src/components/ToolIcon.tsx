export default function ToolIcon({ id }: { id: string }) {
  const shapes: Record<string, string> = {
    cooking: 'M5 7h18v14H5z M9 3h10v4H9z M1 10h4v8H1z M23 10h4v8h-4z',
    shopping: 'M6 9h16v16H6z M10 4h8v5h-3V7h-2v2h-3z',
    budget: 'M3 7h22v18H3z M7 3h14v4H7z M17 13h8v7h-8z M19 15v3h3v-3z',
    dog: 'M9 16h10v3h4v7H5v-7h4z M3 6h5v7H3z M11 2h5v8h-5z M20 6h5v7h-5z',
    tasks:
      'M5 5h18v22H5z M9 1h10v7H9z M8 13h3v3H8z M14 13h6v3h-6z M8 20h3v3H8z M14 20h6v3h-6z',
    date: 'M3 6h7V3h8v3h7v10h-4v4h-4v4h-6v-4H7v-4H3z',
  }
  return (
    <svg
      className="tool-icon"
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={shapes[id] ?? shapes.tasks}
      />
    </svg>
  )
}

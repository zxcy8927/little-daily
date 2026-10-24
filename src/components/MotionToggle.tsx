export default function MotionToggle({
  motion,
  onToggle,
}: {
  motion: boolean
  onToggle: () => void
}) {
  const label = motion ? '暫停小屋動畫' : '播放小屋動畫'
  return (
    <button
      className="room-motion-toggle"
      aria-label={label}
      title={label}
      aria-pressed={!motion}
      onClick={onToggle}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        aria-hidden="true"
        fill="currentColor"
      >
        {motion ? (
          <path d="M4 3h3v12H4zM11 3h3v12h-3z" />
        ) : (
          <path d="m5 3 10 6-10 6z" />
        )}
      </svg>
    </button>
  )
}

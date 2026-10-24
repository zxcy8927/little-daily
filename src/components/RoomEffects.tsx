import type { RoomTheme } from '../data/rooms'

export default function RoomEffects({ theme }: { theme: RoomTheme }) {
  return (
    <svg
      className={'room-effects effects-' + theme}
      viewBox="0 0 720 400"
      aria-hidden="true"
      focusable="false"
    >
      {theme === 'moon' ? (
        <g className="room-starlight" fill="#ffe5a0">
          {[
            [83, 82],
            [185, 153],
            [345, 107],
            [412, 158],
            [620, 110],
          ].map(([x, y], i) => (
            <path
              key={i}
              className="room-star"
              style={{ animationDelay: `-${i * 0.7}s` }}
              d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`}
              stroke="currentColor"
              strokeWidth="3"
            />
          ))}
        </g>
      ) : (
        <path
          className="room-sunbeam"
          d="M60 124L210 124L480 400H220Z"
          fill="#fff5b8"
          opacity=".17"
        />
      )}
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          className="room-mote"
          x={75 + i * 87}
          y={90 + (i % 3) * 73}
          width={i % 2 ? 4 : 6}
          height={i % 2 ? 4 : 6}
          rx="1"
          fill={theme === 'moon' ? '#ffe5b3' : '#fff9e4'}
          style={{ animationDelay: `-${i * 1.3}s` }}
        />
      ))}
      <g
        className="room-steam"
        fill="none"
        stroke={theme === 'moon' ? '#fce2f4' : '#fff9ed'}
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".8"
      >
        <path d="M380 295q-6-8 0-15t0-15" />
        {theme === 'cafe' && <path d="M637 178q-6-8 0-15t0-15" />}
      </g>
    </svg>
  )
}

const pixels: Record<string, string[]> = {
  cooking: [
    '................',
    '......s..s......',
    '.......s..s.....',
    '....ddddd.......',
    '..ddllllldd.....',
    '.dllwwwwwlld....',
    '.dlwwyyywwldkkkk',
    '.dlwwyyywwldkkkk',
    '.dlwwwwwwwld....',
    '.dllwwwwwlld....',
    '..dllllllld.....',
    '....ddddd.......',
    '................',
    '................',
    '................',
    '................',
  ],
  shopping: [
    '................',
    '................',
    '......dddd......',
    '.....d....d.....',
    '.....d....d.....',
    '.....d....d.....',
    '...dddddddddd...',
    '...dllllllllmd..',
    '...dllmmmmmmmd..',
    '...dlmmwmwmmmd..',
    '...dlmwwwwwmmd..',
    '...dlmmwwwmmmd..',
    '...dlmmmwmmmmd..',
    '...dmmmmmmmmmd..',
    '...dddddddddd...',
    '................',
  ],
  budget: [
    '................',
    '................',
    '......d..d......',
    '.......dd.......',
    '......dddd......',
    '.....dlllmd.....',
    '....dllmmmmd....',
    '...dllmmmmmmd...',
    '..dllmmwwwmmmd..',
    '..dlmmwyyywmmd..',
    '..dlmmwyyywmmd..',
    '..dlmmwyyywmmd..',
    '..dmmmmwwwmmmd..',
    '...dmmmmmmmmd...',
    '....dddddddd....',
    '................',
  ],
  dog: [
    '................',
    '................',
    '..dd.dddddd.dd..',
    '.dmmdttttttdmmd.',
    '.dmmdttttttdmmd.',
    '.dmmdtkttktdmmd.',
    '.dmmdtkttktdmmd.',
    '.dmmdttttttdmmd.',
    '.dmmdtwwwwtdmmd.',
    '..dmdtwkkwtdmd..',
    '...dd.twwt.dd...',
    '......dddd......',
    '................',
    '................',
    '................',
    '................',
  ],
  tasks: [
    '................',
    '...dddddddddd...',
    '..kdmmmmmmmmd...',
    '...dmwwwwwwmd...',
    '..kdmwgwlllmd...',
    '...dmwwwwwwmd...',
    '..kdmwgwlllmd...',
    '...dmwwwwwwmd...',
    '..kdmwgwlllmd...',
    '...dmwwwwwwmd...',
    '..kdmmmmmmmmd...',
    '...dddddddddd...',
    '................',
    '................',
    '................',
    '................',
  ],
  date: [
    '................',
    '............y...',
    '...........yyy..',
    '..dddd.dddd.y...',
    '.dllllddmmmd....',
    'dlllmmmmmmmmd...',
    'dllmmmmmmmmmd...',
    'dlmmmmmmmmmmd...',
    '.dmmmmmmmmmd....',
    '..dmmmmmmmd.....',
    '...dmmmmmd......',
    '....dmmmd.......',
    '.....dmd........',
    '......d.........',
    '................',
    '................',
  ],
}

const palette: Record<string, string> = {
  m: 'var(--tool-main)',
  l: 'var(--tool-light)',
  d: 'var(--tool-dark)',
  k: 'var(--tool-ink)',
  w: 'var(--tool-paper)',
  t: 'var(--tool-skin)',
  y: 'var(--tool-gold)',
  g: 'var(--tool-green)',
  s: 'var(--tool-steam)',
}

export default function ToolIcon({ id }: { id: string }) {
  const rows = pixels[id] ?? pixels.tasks
  const icon = id in pixels ? id : 'tasks'
  const rects: { x: number; y: number; w: number; c: string }[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      let w = 1
      while (row[x + w] === c) w++
      if (c !== '.') rects.push({ x, y, w, c })
      x += w
    }
  })
  return (
    <svg
      className={`tool-icon tool-icon-${icon}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {rects.map((r) => (
        <rect
          key={`${r.x}-${r.y}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={palette[r.c]}
        />
      ))}
    </svg>
  )
}

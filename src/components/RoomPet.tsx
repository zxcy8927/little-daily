import { useState, type CSSProperties } from 'react'
import type { FurniturePlacement } from '../data/storage'
import PixelPet from './PixelPet'
function pathClear(layout: FurniturePlacement[], dx: number) {
  return !layout.some(
    (item) =>
      item.x > Math.min(196, 196 + dx) - 75 &&
      item.x < Math.max(196, 196 + dx) + 75 &&
      item.y > 270,
  )
}
export function wanderTarget(
  layout: FurniturePlacement[],
  random = Math.random,
) {
  // Keep the route in the open floor beside the existing lamp and table.
  const free = [-32, -16, 0].filter((dx) => pathClear(layout, dx))
  return free.length ? free[Math.floor(random() * free.length)] : 0
}
export default function RoomPet({
  mini,
  layout,
}: {
  mini: boolean
  layout: FurniturePlacement[]
}) {
  const [target, setTarget] = useState(() => wanderTarget(layout))
  const [duration] = useState(() => 75 + Math.floor(Math.random() * 35))
  const safe = pathClear(layout, target) ? target : 0
  return (
    <g transform="translate(163 272) scale(.83)">
      <g
        className={mini ? '' : 'room-pet-walk'}
        style={
          {
            '--pet-step-x': `${safe}px`,
            '--pet-wander-duration': `calc(var(--motion-slow) * ${duration})`,
          } as CSSProperties
        }
        onAnimationIteration={
          mini
            ? undefined
            : (event) => {
                if (event.target === event.currentTarget)
                  setTarget(wanderTarget(layout))
              }
        }
      >
        <g className={mini ? '' : 'room-pet-sit'}>
          <PixelPet
            room
            interactive={!mini}
            state={mini ? 'idle' : undefined}
          />
        </g>
      </g>
    </g>
  )
}

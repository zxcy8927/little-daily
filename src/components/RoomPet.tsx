import { useState, type CSSProperties } from 'react'
import { furnitureCatalog, type FurniturePlacement } from '../data/storage'
import PixelPet from './PixelPet'

const PET_ORIGIN = { x: 163, y: 272 }
const PET_SCALE = 0.83
const PET_CENTER = PET_ORIGIN.x + 40 * PET_SCALE
const PET_FEET = PET_ORIGIN.y + 75 * PET_SCALE
const PET_HALF_WIDTH = 25
const PET_HEIGHT = 66
const FRONT_LANE_OFFSET = 48
const FLOOR = { left: 12, right: 708, top: 240, bottom: 388 }
const FURNITURE_HALF_WIDTH = 48
const FURNITURE_HEIGHT = 96
const CLEARANCE = 3
const CYCLE_MIN = 75
const CYCLE_VARIATION = 35
const DESTINATIONS = [-150, -130, -110, 110, 130, 150]
type Rect = { left: number; right: number; top: number; bottom: number }
const ROOM_OBSTACLES: Rect[] = [
  { left: 238, right: 244, top: 194, bottom: 305 },
  { left: 225, right: 258, top: 304, bottom: 311 },
  { left: 85, right: 136, top: 208, bottom: 311 },
  { left: 269, right: 487, top: 205, bottom: 315 },
  { left: 325, right: 443, top: 302, bottom: 362 },
]
export function canWander(layout: FurniturePlacement[], dx: number) {
  const obstacles = [
    ...ROOM_OBSTACLES,
    ...layout
      .filter(
        (item) =>
          furnitureCatalog.find((piece) => piece.id === item.id)?.kind !==
          'rug',
      )
      .map((item) => ({
        left: item.x - FURNITURE_HALF_WIDTH,
        right: item.x + FURNITURE_HALF_WIDTH,
        top: item.y - FURNITURE_HEIGHT,
        bottom: item.y,
      })),
  ]
  const points = [
    { x: PET_CENTER, y: PET_FEET },
    { x: PET_CENTER, y: PET_FEET + FRONT_LANE_OFFSET },
    { x: PET_CENTER + dx, y: PET_FEET + FRONT_LANE_OFFSET },
  ]
  // Check the whole body along both legs, rather than only the destination.
  return points.slice(1).every((end, i) => {
    const start = points[i]
    const sweep = {
      left: Math.min(start.x, end.x) - PET_HALF_WIDTH - CLEARANCE,
      right: Math.max(start.x, end.x) + PET_HALF_WIDTH + CLEARANCE,
      top: Math.min(start.y, end.y) - PET_HEIGHT - CLEARANCE,
      bottom: Math.max(start.y, end.y) + CLEARANCE,
    }
    return (
      sweep.left >= FLOOR.left &&
      sweep.right <= FLOOR.right &&
      sweep.top >= FLOOR.top &&
      sweep.bottom <= FLOOR.bottom &&
      !obstacles.some(
        (rect) =>
          sweep.left < rect.right &&
          sweep.right > rect.left &&
          sweep.top < rect.bottom &&
          sweep.bottom > rect.top,
      )
    )
  })
}
export function wanderTarget(
  layout: FurniturePlacement[],
  random = Math.random,
) {
  const free = DESTINATIONS.filter((dx) => canWander(layout, dx))
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
  const [duration] = useState(
    () => CYCLE_MIN + Math.floor(Math.random() * CYCLE_VARIATION),
  )
  const safe = canWander(layout, target) ? target : 0
  return (
    <g
      className={mini ? '' : 'room-pet-walk'}
      style={
        {
          '--pet-step-x': `${safe}px`,
          '--pet-step-y': `${safe ? FRONT_LANE_OFFSET : 0}px`,
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
      <g
        transform={`translate(${PET_ORIGIN.x} ${PET_ORIGIN.y}) scale(${PET_SCALE})`}
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

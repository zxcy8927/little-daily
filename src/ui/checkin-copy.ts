import type { GameState } from '../data/storage'
import { shiftDate } from '../data/workflows'
export function checkInGreeting(game: GameState, today: string) {
  if (game.lastCheckIn && game.lastCheckIn < shiftDate(today, -1))
    return '回來啦，位置一直替你留著。今天想記什麼都好。'
  if (!game.lastCheckIn) return '嗨，小兔在這裡。摸摸牠，替今天留個小記號。'
  return '今天也來坐一下吧。摸摸小兔，就記下你來了。'
}

export type RoomTheme = 'meadow' | 'cafe' | 'moon'
export const roomThemes = [
  {
    id: 'meadow' as const,
    name: '午後的森居',
    subtitle: '窗邊有光，小兔替你留了位置。',
    label: '免費小屋',
    premium: false,
    objects: '以 3 件成長裝飾慢慢佈置',
    items: ['小兔與自然採光', '盆栽、暖心燈與星空窗', '跟著每次不買決定解鎖'],
    color: '#dce6c9',
  },
  {
    id: 'cafe' as const,
    name: '奶油咖啡館',
    subtitle: '咖啡還熱，今天晚一點出門也沒關係。',
    label: '主題擴充',
    premium: true,
    objects: '整組咖啡館家具與暖色氛圍',
    items: ['木質吧檯與咖啡機', '奶油沙發與花瓶', '專屬吊燈、地毯與牆面'],
    color: '#ead7bc',
  },
  {
    id: 'moon' as const,
    name: '月光觀星室',
    subtitle: '燈留一盞，今晚在家看星星。',
    label: '主題擴充',
    premium: true,
    objects: '整組夜色家具與星光氛圍',
    items: ['月亮窗與星光壁飾', '深藍沙發與望遠鏡', '專屬夜燈、地毯與牆面'],
    color: '#d2d4e9',
  },
]

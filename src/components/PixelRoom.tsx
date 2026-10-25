import PixelPet from './PixelPet'
import { FurnitureShape } from './FurnitureArt'
import { furnitureCatalog, type FurniturePlacement } from '../data/storage'
import type { RoomTheme } from '../data/rooms'
export default function PixelRoom({
  theme = 'meadow',
  coins = 0,
  placed = () => true,
  mini = false,
  layout = [],
  preview = null,
}: {
  theme?: RoomTheme
  coins?: number
  placed?: (name: string) => boolean
  mini?: boolean
  layout?: FurniturePlacement[]
  preview?: FurniturePlacement | null
}) {
  const night = theme === 'moon',
    cafe = theme === 'cafe',
    full = theme !== 'meadow'
  const wall = night ? '#41475f' : cafe ? '#ead7bc' : '#f4dfd5',
    floor = night ? '#77728a' : cafe ? '#b38e6c' : '#d9b995',
    wood = night ? '#a99ab0' : '#9a7957'
  return (
    <svg
      className={'room-art' + (mini ? ' room-art-mini' : '')}
      viewBox="0 0 720 400"
      role="group"
      aria-label={
        (night ? '月光觀星室' : cafe ? '奶油咖啡館' : '午後的森居') +
        '像素房間' +
        (full ? '完整主題預覽' : '')
      }
      shapeRendering="crispEdges"
    >
      <rect width="720" height="400" fill={wall} />
      <rect y="276" width="720" height="124" fill={floor} />
      <path d="M0 275H720" stroke={wood} strokeWidth="9" />
      <path
        d="M0 315H720M0 357H720M105 279V315M350 279V315M590 279V315M220 319V353M480 319V353M95 361V400M350 361V400M610 361V400"
        stroke={night ? '#655f77' : cafe ? '#a48161' : '#a1a97f'}
        strokeWidth="3"
      />
      <rect x="49" y="45" width="172" height="161" fill={wood} />
      <rect
        x="60"
        y="56"
        width="150"
        height="139"
        fill={night ? '#2b344e' : '#a9c8bb'}
      />
      {night ? (
        <>
          <rect x="159" y="75" width="26" height="26" fill="#f2dfa1" />
          <rect x="170" y="69" width="22" height="24" fill="#2b344e" />
          <path
            d="M80 86h9m-4-5v10M120 130h9m-4-5v10M178 159h9m-4-5v10"
            stroke="#f3dfaa"
            strokeWidth="3"
          />
          <path d="M60 177l40-37 40 37 30-27 40 27v18H60z" fill="#3c4e61" />
        </>
      ) : (
        <>
          <rect x="60" y="155" width="150" height="40" fill="#7f9b76" />
          <path d="M60 162l30-44 33 44 39-69 48 69v27H60z" fill="#789974" />
          <rect x="167" y="73" width="20" height="20" fill="#f7e8ae" />
        </>
      )}
      <path d="M135 56V195M60 123H210" stroke={wood} strokeWidth="6" />
      <path
        d="M37 43h23v175h-23zM210 43h24v175h-24z"
        fill={night ? '#80768f' : cafe ? '#d7b28d' : '#c5cdac'}
      />
      <rect x="42" y="207" width="18" height="7" fill={wood} />
      <rect x="210" y="207" width="18" height="7" fill={wood} />
      <ellipse
        cx="381"
        cy="343"
        rx="184"
        ry="34"
        fill={night ? '#56536f' : cafe ? '#e5cba7' : '#d6d9b7'}
      />
      <ellipse
        cx="381"
        cy="343"
        rx="157"
        ry="23"
        fill="none"
        stroke={night ? '#8f849f' : cafe ? '#c4a17d' : '#b5bf98'}
        strokeWidth="4"
      />
      <rect
        x="282"
        y="205"
        width="194"
        height="80"
        fill={night ? '#676780' : cafe ? '#f4e5c8' : '#91a47d'}
      />
      <rect
        x="269"
        y="234"
        width="25"
        height="68"
        fill={night ? '#575b76' : cafe ? '#d4b58f' : '#7e956a'}
      />
      <rect
        x="462"
        y="234"
        width="25"
        height="68"
        fill={night ? '#575b76' : cafe ? '#d4b58f' : '#7e956a'}
      />
      <rect
        x="294"
        y="249"
        width="168"
        height="42"
        fill={night ? '#85809b' : cafe ? '#efdab7' : '#a7b88e'}
      />
      <path
        d="M376 249v42"
        stroke={night ? '#676780' : cafe ? '#dcc39f' : '#91a47d'}
        strokeWidth="4"
      />
      <path d="M289 302v13M469 302v13" stroke={wood} strokeWidth="9" />
      <rect
        x="305"
        y="216"
        width="42"
        height="31"
        fill={night ? '#aaa1c0' : cafe ? '#c78f72' : '#dbe0b8'}
      />
      <rect
        x="411"
        y="217"
        width="36"
        height="30"
        fill={night ? '#c0b0ce' : cafe ? '#d9c393' : '#c0ce9f'}
      />
      {full && (
        <>
          <rect x="507" y="75" width="155" height="17" fill={wood} />
          <path d="M524 92v11M644 92v11" stroke={wood} strokeWidth="6" />
          <rect
            x="520"
            y="48"
            width="13"
            height="27"
            fill={night ? '#a6a6c5' : '#bc8067'}
          />
          <rect
            x="537"
            y="43"
            width="12"
            height="32"
            fill={night ? '#c4b6d1' : '#b4ba8a'}
          />
          <rect
            x="553"
            y="51"
            width="11"
            height="24"
            fill={night ? '#8386a9' : '#d2b181'}
          />
          <rect
            x="620"
            y="55"
            width="25"
            height="20"
            fill={night ? '#d2c09d' : '#c28c73'}
          />
          <rect x="628" y="40" width="8" height="16" fill="#8b9c80" />
        </>
      )}
      {cafe && (
        <>
          <rect x="535" y="214" width="134" height="81" fill="#a17d5b" />
          <rect x="524" y="205" width="155" height="14" fill="#e5c8a3" />
          <path d="M580 222v65M629 222v65" stroke="#795d43" strokeWidth="4" />
          <rect x="548" y="168" width="58" height="37" fill="#59645a" />
          <rect x="556" y="176" width="30" height="14" fill="#cbd0b2" />
          <rect x="566" y="194" width="13" height="10" fill="#f4ebd1" />
          <rect x="629" y="183" width="17" height="22" fill="#f4ebd1" />
          <path
            d="M646 187h8v10h-8"
            fill="none"
            stroke="#f4ebd1"
            strokeWidth="4"
          />
          <rect x="361" y="0" width="5" height="46" fill="#a17d5b" />
          <path d="M337 46h54l14 24h-82z" fill="#b28a59" />
          <rect x="345" y="70" width="39" height="8" fill="#f3dda7" />
        </>
      )}
      {night && (
        <>
          <rect x="550" y="199" width="18" height="81" fill="#aaa0b3" />
          <path
            d="M559 250l-37 61M560 250l33 61"
            stroke="#c0b0bd"
            strokeWidth="7"
          />
          <g transform="rotate(-25 562 186)">
            <rect x="525" y="177" width="82" height="21" fill="#c4bdcf" />
            <rect x="600" y="172" width="13" height="31" fill="#e3d6d2" />
            <rect x="525" y="181" width="13" height="13" fill="#777b99" />
          </g>
          <path
            d="M357 88h18m-9-9v18M393 122h13m-6-7v14M342 145h11m-5-6v12"
            stroke="#e6d39d"
            strokeWidth="4"
          />
          <rect x="355" y="0" width="5" height="46" fill="#b5a7ba" />
          <path d="M337 46h42v27h-42z" fill="#cbb68d" />
          <rect x="343" y="73" width="30" height="8" fill="#f0daa6" />
        </>
      )}
      {((coins >= 50 && placed('小盆栽')) || full) && (
        <g>
          <rect
            x="89"
            y="268"
            width="43"
            height="43"
            fill={night ? '#a592ad' : '#c39370'}
          />
          <rect
            x="85"
            y="259"
            width="51"
            height="13"
            fill={night ? '#b8a3bf' : '#d3a581'}
          />
          <rect x="106" y="217" width="9" height="43" fill="#739367" />
          <rect x="91" y="225" width="16" height="19" fill="#87a877" />
          <rect x="115" y="208" width="19" height="21" fill="#87a877" />
        </g>
      )}
      {((coins >= 100 && placed('暖心燈')) || full) && (
        <g>
          <rect x="238" y="194" width="6" height="111" fill={wood} />
          <path
            d="M223 163h36l12 31h-60z"
            fill={night ? '#d2bd94' : '#e3c080'}
          />
          <rect x="225" y="304" width="33" height="7" fill={wood} />
        </g>
      )}
      {coins >= 150 && placed('星空窗') && !full && (
        <g>
          <rect x="535" y="115" width="84" height="87" fill={wood} />
          <rect x="543" y="123" width="68" height="71" fill="#46576d" />
          <path
            d="M560 143h12m-6-6v12M587 168h9m-5-5v10"
            stroke="#ebdba1"
            strokeWidth="3"
          />
        </g>
      )}
      <rect x="325" y="317" width="118" height="14" fill={wood} />
      <rect x="335" y="331" width="8" height="31" fill={wood} />
      <rect x="426" y="331" width="8" height="31" fill={wood} />
      <rect
        x="374"
        y="302"
        width="16"
        height="15"
        fill={night ? '#cfbfd4' : '#f5e7c9'}
      />
      <rect
        x="390"
        y="305"
        width="6"
        height="8"
        fill="none"
        stroke={night ? '#cfbfd4' : '#f5e7c9'}
        strokeWidth="3"
      />
      <g transform="translate(163 272) scale(.83)">
        <PixelPet room interactive={!mini} />
      </g>
      {[
        ...layout.filter((p) => p.id !== preview?.id),
        ...(preview ? [preview] : []),
      ]
        .sort((a, b) => a.y - b.y)
        .map((p) => (
          <g
            key={p.id}
            transform={`translate(${p.x - 48} ${p.y - 96}) scale(.8)`}
            opacity={p.id === preview?.id ? 0.82 : 1}
            data-furniture-id={p.id}
            role="img"
            aria-label={
              furnitureCatalog.find((i) => i.id === p.id)?.name +
              (p.id === preview?.id ? '（試擺中）' : '（已擺放）')
            }
          >
            {p.id === preview?.id && (
              <rect
                x="-4"
                y="-4"
                width="128"
                height="128"
                rx="6"
                fill="#fff9df"
                fillOpacity=".16"
                stroke="#f6e6a9"
                strokeDasharray="7 5"
                strokeWidth="3"
              />
            )}
            <FurnitureShape id={p.id} />
          </g>
        ))}
    </svg>
  )
}

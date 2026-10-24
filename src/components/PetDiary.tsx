import { formatDate } from '../ui/format'
import { errorText } from '../ui/copy'
import ToolIcon from './ToolIcon'
import { useEffect, useRef, useState } from 'react'
import {
  bookKey,
  isBook,
  normalizePetBook,
  readBookSnapshot,
  saveBookSnapshot,
  petSpecies,
  validDate,
  type Entry,
  type Pet,
  type PetBook,
} from '../data/storage'
import './ToolWorkspace.css'
import './PetDiary.css'
import StorageConflict from './StorageConflict'

const categories = ['吃飯', '喝水', '散步', '清潔', '玩耍', '其他']
const icons: Record<Pet['species'], string> = {
  狗: '🐶',
  貓: '🐱',
  兔子: '🐰',
  鳥: '🐦',
  倉鼠: '🐹',
  其他: '🐾',
}
function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function load() {
  const fallback: PetBook = { entries: [], limit: 500, pets: [] }
  try {
    const result = readBookSnapshot(localStorage, 'dog')
    return { book: normalizePetBook(result.book), raw: result.raw, error: '' }
  } catch {
    return {
      book: fallback,
      raw: null,
      error:
        '寵物日記暫時無法讀取。原資料仍保留，請先檢查瀏覽器儲存設定，暫時不要新增資料。',
    }
  }
}
function noteParts(entry: Entry) {
  const index = entry.text.indexOf('｜')
  return index !== -1 && categories.includes(entry.text.slice(0, index))
    ? {
        category: entry.text.slice(0, index),
        content: entry.text.slice(index + 1),
      }
    : { category: '其他', content: entry.text }
}
export default function PetDiary({ onBack }: { onBack: () => void }) {
  const [loaded] = useState(load)
  const snapshot = useRef(loaded.raw)
  const [book, setBook] = useState(loaded.book)
  const [selectedId, setSelectedId] = useState(
    () =>
      loaded.book.pets.find((p) => !p.archived)?.id ??
      loaded.book.pets[0]?.id ??
      '',
  )
  const [profileOpen, setProfileOpen] = useState(!loaded.book.pets.length)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<Pet['species']>('其他')
  const [birthday, setBirthday] = useState('')
  const [date, setDate] = useState(today)
  const [allDates, setAllDates] = useState(false)
  const [category, setCategory] = useState('吃飯')
  const [content, setContent] = useState('')
  const [recordDate, setRecordDate] = useState(today)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [showArchived, setShowArchived] = useState(
    () =>
      loaded.book.pets.length > 0 && loaded.book.pets.every((p) => p.archived),
  )
  const [deleted, setDeleted] = useState<Entry | null>(null)
  const [error, setError] = useState(loaded.error)
  const [feedback, setFeedback] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const profileInput = useRef<HTMLInputElement>(null)
  const noteInput = useRef<HTMLTextAreaElement>(null)
  const selected = book.pets.find((p) => p.id === selectedId)
  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [])
  function save(next: PetBook, message: string) {
    if (loaded.error) {
      setError(loaded.error)
      return false
    }
    if (!isBook(next, 'dog')) {
      setError('資料尚未完整，或已達儲存上限（50 隻寵物、一萬筆紀錄）。')
      return false
    }
    try {
      snapshot.current = saveBookSnapshot(
        localStorage,
        'dog',
        snapshot.current,
        next,
      )
      setBook(next)
      setError('')
      setFeedback(message)
      return true
    } catch (e) {
      setError(errorText(e))
      return false
    }
  }
  function clearNote() {
    setEditingId(null)
    setContent('')
    setCategory('吃飯')
    setRecordDate(date)
  }
  function switchPet(id: string) {
    setSelectedId(id)
    clearNote()
    setSearch('')
    setCategoryFilter('全部')
    setProfileOpen(false)
    setFeedback('')
    setError(loaded.error)
  }
  function openProfile(pet?: Pet) {
    setProfileId(pet?.id ?? null)
    setName(pet?.name ?? '')
    setSpecies(pet?.species ?? '其他')
    setBirthday(pet?.birthday ?? '')
    setProfileOpen(true)
    window.setTimeout(() => profileInput.current?.focus(), 0)
  }
  function saveProfile() {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 40) {
      setError('牠叫什麼名字？請填 1 到 40 個字。')
      return
    }
    if (birthday && (!validDate(birthday) || birthday > today())) {
      setError('生日請選擇今天或更早的有效日期，也可以留白。')
      return
    }
    if (!profileId && book.pets.length >= 50) {
      setError('最多可建立 50 隻寵物的資料。')
      return
    }
    const pet: Pet = {
      id: profileId ?? crypto.randomUUID(),
      name: trimmed,
      species,
      birthday,
      archived: book.pets.find((p) => p.id === profileId)?.archived ?? false,
    }
    const pets = profileId
      ? book.pets.map((p) => (p.id === profileId ? pet : p))
      : [...book.pets, pet]
    if (
      save(
        { ...book, pets, petName: pets[0]?.name },
        `已儲存「${trimmed}」的資料。`,
      )
    ) {
      setSelectedId(pet.id)
      setProfileOpen(false)
      clearNote()
      if (pet.archived) setShowArchived(true)
    }
  }
  function submitNote() {
    if (!selected || selected.archived) {
      setError('先選一位小夥伴；已收起的資料要先恢復使用。')
      return
    }
    if (!content.trim() || content.trim().length > 200) {
      setError('替今天留一句吧，1 到 200 個字就好。')
      return
    }
    if (!validDate(recordDate)) {
      setError('請選擇有效的紀錄日期。')
      return
    }
    const note: Entry = {
      id: editingId ?? crypto.randomUUID(),
      text: `${category}｜${content.trim()}`,
      amount: 0,
      date: recordDate,
      done: false,
      petId: selected.id,
    }
    const entries = editingId
      ? book.entries.map((e) => (e.id === editingId ? { ...e, ...note } : e))
      : [note, ...book.entries]
    if (
      save(
        { ...book, entries },
        editingId ? '紀錄已修改。' : `已記下${selected.name}的日常。`,
      )
    ) {
      setDate(recordDate)
      setSearch('')
      setCategoryFilter('全部')
      setEditingId(null)
      setContent('')
    }
  }
  function editNote(entry: Entry) {
    const parts = noteParts(entry)
    setEditingId(entry.id)
    setContent(parts.content)
    setCategory(parts.category)
    setRecordDate(entry.date)
    window.setTimeout(() => {
      noteInput.current?.focus()
      noteInput.current?.scrollIntoView({ block: 'center', behavior: 'auto' })
    }, 0)
  }
  function removeNote(entry: Entry) {
    if (
      save(
        { ...book, entries: book.entries.filter((e) => e.id !== entry.id) },
        '紀錄已刪除，可以復原上一筆。',
      )
    ) {
      setDeleted(entry)
      if (editingId === entry.id) clearNote()
    }
  }
  function toggleArchive() {
    if (!selected) return
    if (
      save(
        {
          ...book,
          pets: book.pets.map((p) =>
            p.id === selected.id ? { ...p, archived: !p.archived } : p,
          ),
        },
        selected.archived
          ? '已恢復使用，所有紀錄都還在。'
          : '已收起寵物資料，所有紀錄仍保留。',
      )
    ) {
      setShowArchived(true)
      clearNote()
      setProfileOpen(false)
    }
  }
  const petEntries = book.entries.filter((e) => e.petId === selectedId)
  const dateEntries = petEntries.filter((e) => allDates || e.date === date)
  const visible = dateEntries
    .filter(
      (e) =>
        e.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (categoryFilter === '全部' || noteParts(e).category === categoryFilter),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
  const profiles = book.pets.filter((p) => showArchived || !p.archived)
  return (
    <section className="workspace pet-diary" aria-labelledby="pet-title">
      {!loaded.error && (
        <StorageConflict storageKey={bookKey('dog')} snapshot={snapshot} />
      )}
      <button className="back-button" onClick={onBack}>
        ← 回到日常工具
      </button>
      <header className="workspace-heading">
        <ToolIcon id="dog" />
        <div>
          <h1 ref={heading} tabIndex={-1} id="pet-title">
            寵物日記
          </h1>
          <p>
            {selected
              ? `${selected.name}的日常與照護紀錄`
              : '每隻寵物，都有自己的小日子。'}
          </p>
        </div>
      </header>
      <div className="pet-toolbar">
        <div className="pet-switcher" aria-label="選擇寵物">
          {profiles.map((p) => (
            <button
              key={p.id}
              className="pet-tab"
              aria-pressed={selectedId === p.id}
              onClick={() => switchPet(p.id)}
            >
              <span aria-hidden="true">{icons[p.species]}</span> {p.name}
              {p.archived ? '（已收起）' : ''}
            </button>
          ))}
        </div>
        <button
          className="secondary-button"
          onClick={() => openProfile()}
          disabled={!!loaded.error || book.pets.length >= 50}
        >
          ＋ 新增寵物
        </button>
      </div>
      {book.pets.some((p) => p.archived) && (
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => {
              setShowArchived(e.target.checked)
              if (!e.target.checked && selected?.archived) {
                switchPet(book.pets.find((p) => !p.archived)?.id ?? '')
              }
            }}
          />
          顯示已收起的寵物
        </label>
      )}
      {profileOpen && (
        <form
          className="tool-form pixel-panel"
          aria-labelledby="profile-title"
          onSubmit={(e) => {
            e.preventDefault()
            saveProfile()
          }}
        >
          <h2 id="profile-title">
            {profileId ? '編輯寵物資料' : '新增一位小夥伴'}
          </h2>
          <div className="form-row">
            <label>
              寵物名字
              <input
                ref={profileInput}
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：麻糬"
                required
              />
            </label>
            <label>
              寵物種類
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as Pet['species'])}
              >
                {petSpecies.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            生日（選填）
            <input
              type="date"
              value={birthday}
              max={today()}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </label>
          <div className="record-actions">
            <button className="primary-button" disabled={!!loaded.error}>
              儲存寵物資料
            </button>
            {book.pets.length > 0 && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  setError(loaded.error)
                }}
              >
                取消
              </button>
            )}
          </div>
          <p className="field-help">
            每位小夥伴都有自己的日記，改名也不會弄丟。
          </p>
        </form>
      )}
      {selected && (
        <>
          <article className="pet-profile pixel-panel">
            <span className="pet-avatar" aria-hidden="true">
              {icons[selected.species]}
            </span>
            <div className="pet-profile-info">
              <h2>{selected.name}</h2>
              <p>
                {selected.species}
                {selected.birthday
                  ? ` · 生日 ${formatDate(selected.birthday)}`
                  : ' · 生日還沒填'}
                {selected.archived ? ' · 已收起' : ''}
              </p>
              <p>共 {petEntries.length} 筆日常紀錄</p>
            </div>
            <div className="record-actions">
              <button
                className="secondary-button"
                onClick={() => openProfile(selected)}
              >
                編輯寵物資料
              </button>
              <button className="secondary-button" onClick={toggleArchive}>
                {selected.archived ? '恢復使用' : '收起寵物資料'}
              </button>
            </div>
          </article>
          <div className="diary-date-row">
            <label className="date-picker">
              查看日期
              <input
                type="date"
                value={date}
                disabled={allDates}
                required
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(e.target.value)
                    if (!editingId) setRecordDate(e.target.value)
                  }
                }}
              />
            </label>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={allDates}
                onChange={(e) => setAllDates(e.target.checked)}
              />
              查看所有日期
            </label>
          </div>
          <div className="care-summary" aria-label="照護紀錄統計">
            {categories.map((c) => (
              <div key={c}>
                <span>{c}</span>
                <strong>
                  {
                    dateEntries.filter((e) => noteParts(e).category === c)
                      .length
                  }
                  <small> 筆</small>
                </strong>
              </div>
            ))}
          </div>
          <p className="field-help">
            {allDates ? '統計所有日期的紀錄' : `${formatDate(date)} 的紀錄`}
            ，僅供回顧。
          </p>
          {!selected.archived ? (
            <form
              className="tool-form pixel-panel"
              aria-labelledby="note-title"
              onSubmit={(e) => {
                e.preventDefault()
                submitNote()
              }}
            >
              <h2 id="note-title">
                {editingId ? '編輯這筆日記' : `記下${selected.name}的今天`}
              </h2>
              <div className="form-row">
                <label>
                  照護項目
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  紀錄日期
                  <input
                    type="date"
                    value={recordDate}
                    required
                    onChange={(e) => setRecordDate(e.target.value)}
                  />
                </label>
              </div>
              <label>
                日記內容
                <textarea
                  ref={noteInput}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="今天吃了什麼，或一起做了什麼？"
                  required
                />
              </label>
              <div className="record-actions">
                <button className="primary-button">
                  {editingId ? '儲存修改' : '新增紀錄'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearNote}
                  >
                    取消編輯
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="empty-state">
              這隻寵物的資料已收起，日記仍可查看。按「恢復使用」即可繼續記錄。
            </p>
          )}
          <div className="search-row">
            <label>
              搜尋日記
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={200}
                placeholder="找找某一天的小事"
              />
            </label>
            <label>
              篩選照護項目
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {['全部', ...categories].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="records">
            {visible.length ? (
              visible.map((e) => (
                <article className="record" key={e.id}>
                  <div className="record-body">
                    <span className="note-meta">
                      {formatDate(e.date)} · {noteParts(e).category}
                    </span>
                    <h3>{noteParts(e).content}</h3>
                  </div>
                  {!selected.archived && (
                    <div className="record-actions">
                      <button
                        className="secondary-button"
                        aria-label={`編輯 ${noteParts(e).content}`}
                        onClick={() => editNote(e)}
                      >
                        編輯
                      </button>
                      <button
                        className="delete-button"
                        aria-label={`刪除 ${noteParts(e).content}`}
                        onClick={() => removeNote(e)}
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className="empty-state">
                {search || categoryFilter !== '全部'
                  ? '沒找到這段小日子，換個關鍵字或分類看看。'
                  : `${selected.name}在${allDates ? '這本日記' : formatDate(date)}還沒有紀錄。`}
              </p>
            )}
          </div>
        </>
      )}
      {!selected && !profileOpen && (
        <p className="empty-state">先選一位小夥伴，或記下新朋友的名字。</p>
      )}
      {deleted && (
        <div className="undo-row">
          <span>已刪除「{noteParts(deleted).content}」</span>
          <button
            className="secondary-button"
            onClick={() => {
              if (
                save(
                  { ...book, entries: [deleted, ...book.entries] },
                  '已復原紀錄。',
                )
              ) {
                setSelectedId(deleted.petId!)
                setDate(deleted.date)
                setSearch('')
                setCategoryFilter('全部')
                if (book.pets.find((p) => p.id === deleted.petId)?.archived)
                  setShowArchived(true)
                setDeleted(null)
              }
            }}
          >
            復原上一筆刪除
          </button>
        </div>
      )}
      <p role="alert" className="form-error">
        {error}
      </p>
      <p role="status" className="save-feedback">
        {feedback}
      </p>
    </section>
  )
}

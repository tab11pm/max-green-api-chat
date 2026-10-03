# Кайтома — дизайн-система и редизайн чата. Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Применить эстетику референса WhatsApp (cream-фон, крупная типографика, пилюли, без теней) к приложению чата MAX через GREEN-API, переименовать продукт в «Кайтома», заменить единственный акцент на фирменный градиент MAX и добавить систему контурных иконок и light/dark темы.

**Architecture:** Инкрементальный рестайл на месте. Глобальные дизайн-токены с префиксом `--k-` живут в `src/styles.css`; каждый компонент по очереди получает свою секцию CSS и обновлённую разметку. Добавляются два небольших компонента — `Icon` (реестр inline-SVG) и `ThemeToggle`; тема управляется атрибутом `data-theme` на `<html>` с системным fallback через `prefers-color-scheme`. Логика, API, хуки и политика хранения данных не меняются.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest 5 + Testing Library, чистый CSS (без CSS-фреймворков).

**Spec:** `docs/superpowers/specs/2026-10-03-kaitoma-design-system-design.md`

## Global Constraints

- Новых runtime-зависимостей не добавлять. Только React 19 + TypeScript.
- Inter подключается через Google Fonts в `index.html` с системным fallback: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Все токены имеют префикс `--k-`; значения берутся из спеки: canvas `#fcf5eb`, surface `#ffffff`, surface-2 `#f0f4f9`, text `#1c1e21`, ink `#111b21`, muted `#5e5e5e`, accent `#007aff`, border `rgba(28,30,33,.10)`, error `#ff303c`, ok `#39765f`, gradient `linear-gradient(135deg,#8d28c8 0%,#7c42fa 35%,#046ef4 75%,#007aff 100%)`. Dark: canvas `#0d0d0d`, surface `#17181c`, surface-2 `#1f1f24`, text/ink `#ffffff`, muted `#c3c3c3`, accent `#5aa9ff`, border `rgba(255,255,255,.12)`, error `#ce4257`, ok `#4ecb8d`, gradient `linear-gradient(135deg,#aa4cff 0%,#7c42fa 45%,#3a89fb 100%)`.
- `box-shadow` не используется нигде. `border-radius`: pill `9999px`, composer `24px`, panel `20px`, card `16px`, media `25px`, bubble `16px` с хвостом `4px`.
- Единственный акцент — `--k-gradient` / `--k-accent`. Других хроматических цветов не вводить.
- Копирайт: продукт «Кайтома», транспорт «MAX». Слово «WhatsApp» в видимом UI не используется; внутренние идентификаторы API (например `checkWhatsapp`) не переименовываются.
- `localStorage` хранит только ключ `kaitoma-theme` со значением `'light' | 'dark'`. Учётные данные и история остаются в памяти/sessionStorage.
- Сохраняются доступные имена и текст, на которые опираются тесты: heading `Подключение к GREEN-API`; heading с текстом `+7 999 123-45-67`; кнопки `Продолжить`, `Новый чат`, `Отключиться`, `Открыть чат`, `Закрыть окно`, `Отправить`; текст `Выберите, с кем начать разговор`; тексты `Входящее сообщение` / `Исходящее сообщение` остаются в DOM (визуально скрыты).
- Иконки: inline SVG, `viewBox="0 0 24 24"`, `fill: none`, `stroke: currentColor`, `stroke-width: 1.75`, скруглённые окончания, `aria-hidden="true"` и `focusable="false"` по умолчанию.

## Review Focus

1. **Системная тёмная тема без сохранённого выбора** — приложение должно отрисоваться тёмным без вспышки; неверный inline-скрипт даёт вспышку светлой темы или залипание. Проверяется вручную (Task 9).
2. **Повреждённое значение `localStorage['kaitoma-theme']`** (например `'purple'`) — `getStoredTheme`/`resolveInitialTheme` должны вернуть системную тему и не падать. Тест в Task 2.
3. **Отсутствующий или невалидный timestamp** (`NaN`, `undefined`) — `formatTime` не должен бросать исключение или показывать `NaN:NaN`. Тест в Task 6.
4. **Длинный неразрывный текст или длинный номер** — bubble `max-width` + `overflow-wrap: anywhere` не должны ломать layout. Вручную в Task 9.
5. **Контраст** белого текста на градиенте и приглушённого текста ≥ 4.5:1 в обеих темах. Вручную в Task 9.

---

### Task 1: Компонент Icon

**Files:**
- Create: `src/components/Icon.tsx`
- Test: `src/components/Icon.test.tsx`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `export type IconName = 'plus' | 'chat' | 'logout' | 'sun' | 'moon' | 'plug' | 'shield' | 'id-card' | 'lock' | 'phone' | 'send' | 'arrow-right' | 'check-check' | 'clock' | 'more' | 'close' | 'search'`
  - `export default function Icon({ name, size = 20, className }: { name: IconName; size?: 16 | 20 | 24; className?: string }): React.JSX.Element`
  - Классы: база `icon`, плюс `icon-sm` при `size === 16`, `icon-lg` при `size === 24`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Icon, { type IconName } from './Icon'

const names: IconName[] = ['plus','chat','logout','sun','moon','plug','shield','id-card','lock','phone','send','arrow-right','check-check','clock','more','close','search']

describe('Icon', () => {
  it('renders an aria-hidden svg at the default size', () => {
    const { container } = render(<Icon name="plus" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveClass('icon')
  })

  it('renders every icon name with at least one path or shape', () => {
    for (const name of names) {
      const { container, unmount } = render(<Icon name={name} />)
      expect(container.querySelector('path, circle, rect, line, polyline')).not.toBeNull()
      unmount()
    }
  })

  it('applies the size modifier and merges className', () => {
    const { container } = render(<Icon name="send" size={24} className="extra" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('icon', 'icon-lg', 'extra')
    expect(svg).toHaveAttribute('width', '24')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/Icon.test.tsx`
Expected: FAIL — не удаётся импортировать `./Icon`.

- [ ] **Step 3: Implement `Icon` in `src/components/Icon.tsx`**

Реестр `Record<IconName, React.ReactNode>` с path-данными из макета — SVG-спрайт в `.superpowers/brainstorm/<session>/content/kaitoma-design-icons.html` (секция `<svg width="0" height="0">`). Компонент:

```tsx
export default function Icon({ name, size = 20, className }: IconProps) {
  const sizeClass = size === 16 ? 'icon-sm' : size === 24 ? 'icon-lg' : ''
  return (
    <svg className={['icon', sizeClass, className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {registry[name]}
    </svg>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/components/Icon.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Icon.tsx src/components/Icon.test.tsx
git commit -m "feat: add inline SVG icon component"
```

---

### Task 2: Тема и переключатель

**Files:**
- Create: `src/theme.ts`
- Test: `src/theme.test.ts`
- Create: `src/components/ThemeToggle.tsx`
- Test: `src/components/ThemeToggle.test.tsx`
- Modify: `src/test/setup.ts`
- Modify: `index.html`

**Interfaces:**
- Consumes: `Icon` из Task 1.
- Produces:
  - `export type Theme = 'light' | 'dark'`
  - `export const THEME_STORAGE_KEY = 'kaitoma-theme'`
  - `export function getStoredTheme(): Theme | null` — только валидные `'light' | 'dark'`, иначе `null`.
  - `export function resolveInitialTheme(): Theme` — сохранённая тема или системная (`matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`).
  - `export function applyTheme(theme: Theme): void` — ставит `document.documentElement.dataset.theme = theme` и пишет в `localStorage`.
  - `export function toggleTheme(): Theme` — переключает от `resolveInitialTheme()`, применяет и возвращает новую.
  - `export default function ThemeToggle(): React.JSX.Element` — `<button className="theme-toggle" type="button" aria-label="Переключить тему">` с `Icon name="sun"` или `"moon"` и видимым текстом (не только иконка).

- [ ] **Step 1: Обновить `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
```

- [ ] **Step 2: Write the failing tests**

`src/theme.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getStoredTheme, resolveInitialTheme, toggleTheme, THEME_STORAGE_KEY } from './theme'

beforeEach(() => localStorage.clear())

describe('theme', () => {
  it('returns null for a missing or corrupted stored value', () => {
    expect(getStoredTheme()).toBeNull()
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(getStoredTheme()).toBeNull()
  })

  it('applies and persists a theme', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('toggles from the resolved theme', () => {
    applyTheme('dark')
    expect(toggleTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('falls back to the system preference when nothing is stored', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    expect(resolveInitialTheme()).toBe('dark')
  })
})
```

`src/components/ThemeToggle.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ThemeToggle from './ThemeToggle'

it('toggles the document theme and persists it', () => {
  render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Переключить тему' }))
  expect(['light', 'dark']).toContain(document.documentElement.dataset.theme)
  expect(localStorage.getItem('kaitoma-theme')).toBe(document.documentElement.dataset.theme)
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- --run src/theme.test.ts src/components/ThemeToggle.test.tsx`
Expected: FAIL — модули не найдены.

- [ ] **Step 4: Implement `src/theme.ts` и `src/components/ThemeToggle.tsx`**

`theme.ts` реализует функции из Interfaces через `localStorage` и `document.documentElement.dataset.theme`, с защитой от исключений `localStorage`.

- [ ] **Step 5: Добавить bootstrap и метаданные в `index.html`**

В `<head>` до основного скрипта, вместо текущего `<title>`:

```html
<meta name="color-scheme" content="light dark" />
<title>Кайтома — MAX чат через GREEN-API</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
<script>
  (function () {
    try {
      var stored = localStorage.getItem('kaitoma-theme')
      var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    } catch (e) {}
  })()
</script>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- --run src/theme.test.ts src/components/ThemeToggle.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/theme.ts src/theme.test.ts src/components/ThemeToggle.tsx src/components/ThemeToggle.test.tsx src/test/setup.ts index.html
git commit -m "feat: add light/dark theme with toggle and bootstrap"
```

---

### Task 3: Дизайн-токены и базовый слой

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: ничего.
- Produces: CSS-переменные `--k-canvas`, `--k-surface`, `--k-surface-2`, `--k-text`, `--k-ink`, `--k-muted`, `--k-accent`, `--k-border`, `--k-error`, `--k-ok`, `--k-gradient`; шкала `--k-text-display|heading|title|body-lg|body|label|caption`; `--k-space-4..--k-space-64`; `--k-radius-pill|panel|card|media|composer`; утилиты `.icon`, `.icon-sm`, `.icon-lg`, `.visually-hidden`.

- [ ] **Step 1: Заменить блок `:root` и добавить тёмную тему и базу**

В `src/styles.css` заменить текущий `:root` на токены из Global Constraints, добавить:

```css
:root[data-theme="dark"] { /* dark-значения токенов */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* те же dark-значения токенов */ }
}
```

Дублирование dark-значений между двумя блоками намеренно (CSS не позволяет объединить атрибутный и медиа-селектор). Затем базовый слой: `body { background: var(--k-canvas); color: var(--k-text); font-family: Inter, ... }`, `:focus-visible { outline: 3px solid var(--k-accent); outline-offset: 3px }`, `.icon { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round }`, `.icon-sm { width: 16px; height: 16px }`, `.icon-lg { width: 24px; height: 24px }`, `.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }`, правила `prefers-reduced-motion`.

Существующие секции компонентов пока оставить как есть — их заменят Task 4–8.

- [ ] **Step 2: Проверить сборку и тесты**

Run: `npm run build && npm run test -- --run`
Expected: build успешен, все существующие тесты PASS (CSS не влияет на них).

- [ ] **Step 3: Ручная проверка**

Run: `npm run dev`, открыть URL.
Expected: фон страницы тёплый cream `#fcf5eb`; при системной тёмной теме фон `#0d0d0d`; в `document.documentElement` есть `data-theme`.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat: add Kaitoma design tokens and base layer"
```

---

### Task 4: Экран подключения

**Files:**
- Modify: `src/components/ConnectionScreen.tsx`
- Modify: `src/styles.css` (секция connection)
- Test: `src/components/ConnectionScreen.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `ThemeToggle`, токены и классы из Task 1–3.
- Produces: разметка с классами `.app-shell`, `.connection-shell`, `.connection-panel`, `.brand-mark`, `.brand-wordmark`, `.eyebrow`, `.connection-form`, `.field`, `.field-control`, `.field-error`, `.field-hint`, `.primary-button`, `.text-button`.

- [ ] **Step 1: Обновить `ConnectionScreen.test.tsx` (падающие проверки)**

Добавить тесты, сохранив существующие:

```tsx
it('shows the Kaitoma brand and MAX transport label', () => {
  render(<ConnectionScreen onConnect={() => {}} />)
  expect(screen.getByText('Кайтома')).toBeInTheDocument()
  expect(screen.getByText(/GREEN-API · MAX/)).toBeInTheDocument()
})

it('gives each credential field a leading icon', () => {
  const { container } = render(<ConnectionScreen onConnect={() => {}} />)
  expect(container.querySelectorAll('.field-control svg')).toHaveLength(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/ConnectionScreen.test.tsx`
Expected: FAIL — нет текста «Кайтома».

- [ ] **Step 3: Обновить разметку `ConnectionScreen.tsx`**

Ключевое: **сохранить** `<h1 id="connection-title">Подключение к GREEN-API</h1>` (App.test) и кнопку с текстом `Продолжить`. Добавить над заголовком `.brand-mark` (буква «К», `aria-hidden`) и `<p class="brand-wordmark">Кайтома</p>`; eyebrow — `<p class="eyebrow"><Icon name="plug" size={16} />GREEN-API · MAX</p>`. Каждое поле обернуть в `.field-control` с ведущим `Icon` (`id-card`, `lock`) и класс `.field` с меткой, содержащей `Icon` 16px. Кнопку отправки дополнить `<Icon name="arrow-right" />`. Добавить `<ThemeToggle />` в верхнюю часть `.app-shell`. Поля ошибок/подсказки оставить с текущими текстами.

- [ ] **Step 4: Заменить CSS-секцию connection в `src/styles.css`**

Стилизовать по спеке: cream-фон, центрированная колонка ≤ 420px, `.brand-mark` 60px с `background: var(--k-gradient)` и `border-radius: 16px`, `.brand-wordmark` display-размер вес 700, панель `.connection-panel` `background: var(--k-surface)`, `border: 1px solid var(--k-border)`, `border-radius: var(--k-radius-panel)`, `padding: 32px`, **без `box-shadow`**. Поля `.field-control input` — pill (`border-radius: var(--k-radius-pill)`) на `var(--k-surface-2)` с `padding-left: 46px`; `.field-control > .icon` позиционируется абсолютно слева. `.primary-button` — градиентный pill с белым текстом. Ошибки — `var(--k-error)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/components/ConnectionScreen.test.tsx src/App.test.tsx`
Expected: PASS (включая «Подключение к GREEN-API»).

- [ ] **Step 6: Commit**

```bash
git add src/components/ConnectionScreen.tsx src/components/ConnectionScreen.test.tsx src/styles.css
git commit -m "feat: restyle connection screen in Kaitoma theme"
```

---

### Task 5: Оболочка чата, сайдбар и хедер

**Files:**
- Modify: `src/components/ChatScreen.tsx`
- Modify: `src/styles.css` (секции messenger/sidebar/header/empty)
- Test: `src/components/ChatScreen.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `ThemeToggle`, токены.
- Produces: классы `.messenger-shell`, `.chat-sidebar`, `.sidebar-head`, `.brand-mark`, `.new-chat-button`, `.chat-preview`, `.avatar`, `.chat-preview-copy`, `.sidebar-foot`, `.disconnect-button`, `.chat-surface`, `.chat-header`, `.transport-status`, `.icon-button`, `.chat-empty`, `.empty-icon`.

- [ ] **Step 1: Добавить падающие проверки в `ChatScreen.test.tsx`**

```tsx
it('exposes an icon-only close control with an accessible name', async () => {
  /* open a chat as in existing helpers */
  expect(screen.getByRole('button', { name: 'Закрыть чат' })).toHaveClass('icon-button')
})

it('renders a theme toggle in the sidebar', () => {
  /* render connected app */
  expect(screen.getByRole('button', { name: 'Переключить тему' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`
Expected: FAIL — у кнопки закрытия нет класса `icon-button` / нет переключателя.

- [ ] **Step 3: Обновить `ChatScreen.tsx`**

Сохранить тексты и доступные имена: `h1` «Чаты», кнопка `Новый чат`, кнопка `Отключиться`, пустое состояние `h2` «Выберите, с кем начать разговор», heading телефона `+7 999 123-45-67`. Изменения: `brand-mark` + eyebrow; кнопка `Новый чат` с `Icon name="plus"`; `.avatar` с `Icon name="chat"`; футер сайдбара — `<ThemeToggle />` и кнопка `Отключиться` с `Icon name="logout"`; хедер — аватар с инициалами, `h3` с `Icon name="phone"` перед номером, `.transport-status`; кнопку «Закрыть чат» сделать `<button className="icon-button" aria-label="Закрыть чат">` с `Icon name="close"`. Пустой `.empty-icon` — `<Icon name="chat" size={24} />`.

- [ ] **Step 4: Заменить CSS-секции в `src/styles.css`**

`.messenger-shell` — grid `250px minmax(0,1fr)`, border `1px solid var(--k-border)`, `border-radius: var(--k-radius-panel)`, **без тени**; `.chat-sidebar` — `var(--k-surface)` + hairline справа; `.chat-surface` — `var(--k-canvas)`; `.chat-header` — `var(--k-surface)` + hairline снизу; `.icon-button` — 38px круглая кнопка на surface с hairline, цвет `var(--k-muted)`; `.avatar` — градиентный круг; `.empty-icon` — градиентный квадрат `border-radius: var(--k-radius-card)`. Сохранить существующий мобильный `@media (max-width: 680px)` блок, адаптировав под новые размеры.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx src/App.test.tsx`
Expected: PASS (включая heading `+7 999 123-45-67` и клик `Отключиться`).

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatScreen.tsx src/components/ChatScreen.test.tsx src/styles.css
git commit -m "feat: restyle chat shell, sidebar and header"
```

---

### Task 6: Таймлайн сообщений и время

**Files:**
- Create: `src/domain/time.ts`
- Test: `src/domain/time.test.ts`
- Modify: `src/components/MessageTimeline.tsx`
- Modify: `src/styles.css` (секция сообщений)
- Test: `src/components/ChatScreen.test.tsx`

**Interfaces:**
- Consumes: `Icon`, токены.
- Produces:
  - `export function formatTime(timestamp?: number): string` — локальное `HH:MM`; для `undefined`/`NaN` возвращает `'--:--'`, не бросает.
  - Классы `.timeline-scroll`, `.timeline-empty`, `.message-list`, `.message-item` (+ `.incoming` / `.outgoing`), `.message-bubble` (+ `.bubble-in` / `.bubble-out`), `.message-kind`, `.meta`.

- [ ] **Step 1: Write the failing test**

`src/domain/time.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatTime } from './time'

describe('formatTime', () => {
  it('formats a timestamp as local HH:MM', () => {
    const date = new Date(2026, 9, 3, 9, 5)
    expect(formatTime(date.getTime() / 1000)).toBe('09:05')
  })

  it('returns a placeholder for missing or invalid timestamps', () => {
    expect(formatTime(undefined)).toBe('--:--')
    expect(formatTime(Number.NaN)).toBe('--:--')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/domain/time.test.ts`
Expected: FAIL — модуль `./time` не найден.

- [ ] **Step 3: Implement `formatTime` in `src/domain/time.ts`**

Принимает секунды (как `IncomingMessage.timestamp`). Возвращает `'--:--'` при `undefined`/`NaN`, иначе `new Date(timestamp * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })`.

- [ ] **Step 4: Обновить `MessageTimeline.tsx`**

Сохранить `<div className="message-bubble">` с `<p>{message.text}</p>` (тест ищет `.message-bubble p`) и текст `.message-kind` («Входящее сообщение» / «Исходящее сообщение») — добавить класс `visually-hidden`. После `<p>` добавить `<span className="meta">{formatTime(message.timestamp)}{direction === 'outgoing' ? <Icon name="check-check" size={16} /> : <Icon name="clock" size={16} />}</span>`, для входящих иконка перед временем. Класс баббла: `message-bubble bubble-in` / `bubble-out`.

- [ ] **Step 5: Заменить CSS-секцию сообщений**

`.message-list` — вертикальный список с `gap`; `.bubble-in` — `background: var(--k-surface)`, `var(--k-text)`, `border: 1px solid var(--k-border)`, `border-radius: 16px 16px 16px 4px`; `.bubble-out` — `background: var(--k-gradient)`, белый текст, `border-radius: 16px 16px 4px 16px`; `.meta` — flex вправо, `font-size: 11px`, `.bubble-in .meta { color: var(--k-muted) }`, `.bubble-out .meta { color: rgba(255,255,255,.85) }`; `.message-bubble { max-width: min(78%, 34rem); overflow-wrap: anywhere }`.

- [ ] **Step 6: Добавить проверку времени в `ChatScreen.test.tsx`**

```tsx
it('shows the time on an outgoing message', async () => {
  /* send a message via existing helpers */
  expect(document.querySelector('.bubble-out .meta')).not.toBeNull()
})
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run test -- --run src/domain/time.test.ts src/components/ChatScreen.test.tsx`
Expected: PASS (включая `getByText('Входящее сообщение')`).

- [ ] **Step 8: Commit**

```bash
git add src/domain/time.ts src/domain/time.test.ts src/components/MessageTimeline.tsx src/components/ChatScreen.test.tsx src/styles.css
git commit -m "feat: restyle message timeline with timestamps and icons"
```

---

### Task 7: Композер

**Files:**
- Modify: `src/components/Composer.tsx`
- Modify: `src/styles.css` (секция composer)
- Test: `src/components/ChatScreen.test.tsx`

**Interfaces:**
- Consumes: `Icon`, токены.
- Produces: классы `.composer`, `.composer-row`, `.field-control`, `.primary-button`, `.send-status`.

- [ ] **Step 1: Добавить падающую проверку**

```tsx
it('uses an icon send button with an accessible name', async () => {
  /* open chat */
  const send = screen.getByRole('button', { name: 'Отправить' })
  expect(send).toHaveClass('icon-button')
  expect(send.querySelector('svg')).not.toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`
Expected: FAIL — у кнопки нет класса `icon-button`.

- [ ] **Step 3: Обновить `Composer.tsx`**

`textarea` обернуть в `.field-control` с ведущим `Icon name="chat"`; кнопку сделать `<button className="icon-button primary-button" type="submit" aria-label="Отправить" disabled={...}><Icon name="send" /></button>`, сохранив состояние `disabled` и логику. Метку `Сообщение` и тексты `Отправка…`, ошибки оставить.

- [ ] **Step 4: Заменить CSS-секцию composer**

`.composer` — `var(--k-surface)` + hairline сверху; `.field-control` — позиция relative, `flex: 1`; textarea — `background: var(--k-surface-2)`, `border: 1px solid var(--k-border)`, `border-radius: var(--k-radius-composer)`, `padding: 13px 18px 13px 46px`, ведущая иконка абсолютно слева; кнопка отправки — круглая 46×46 с `background: var(--k-gradient)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`
Expected: PASS (кнопка `Отправить`, поле `Сообщение`).

- [ ] **Step 6: Commit**

```bash
git add src/components/Composer.tsx src/styles.css
git commit -m "feat: restyle composer with icon send button"
```

---

### Task 8: Диалог нового чата и копирайт MAX

**Files:**
- Modify: `src/components/NewChatDialog.tsx`
- Modify: `src/styles.css` (секция dialog)
- Test: `src/components/ChatScreen.test.tsx`

**Interfaces:**
- Consumes: `Icon`, токены.
- Produces: классы `.dialog-backdrop`, `.new-chat-dialog`, `.dialog-close`, `.dialog-actions`; копирайт с «MAX».

- [ ] **Step 1: Обновить падающий тест копирайта**

В `ChatScreen.test.tsx` заменить строку проверки ошибки на:

```tsx
expect(await screen.findByText('Этот номер не зарегистрирован в MAX. Проверьте номер и попробуйте снова.')).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`
Expected: FAIL — текст всё ещё про WhatsApp.

- [ ] **Step 3: Обновить `NewChatDialog.tsx` и копирайт**

Заменить в видимом тексте «WhatsApp» на «MAX» (описание диалога и сообщение об ошибке; проверка `client.checkWhatsapp` не переименовывается). Сохранить доступные имена: кнопка `Закрыть окно`, `Открыть чат`, `Отмена`, поле `Номер получателя`. Добавить ведущий `Icon name="phone"` в поле, иконку `close` в кнопку закрытия (`className="icon-button dialog-close"`), `Icon name="arrow-right"` в кнопку `Открыть чат`.

- [ ] **Step 4: Заменить CSS-секцию dialog**

`.dialog-backdrop` — тёплый полупрозрачный фон `rgba(13,13,13,.45)`; `.new-chat-dialog` — `var(--k-surface)`, `border-radius: var(--k-radius-panel)`, `padding: 28px`, **без тени**; `.dialog-close` — `.icon-button` в правом верхнем углу; поле — pill с ведущей иконкой; `.dialog-actions` — flex вправо; основная кнопка — градиентный pill, отмена — ghost pill.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NewChatDialog.tsx src/components/ChatScreen.test.tsx src/styles.css
git commit -m "feat: restyle new chat dialog and rebrand copy to MAX"
```

---

### Task 9: Финальная проверка

**Files:**
- Modify (при необходимости): `src/styles.css`, компоненты — только исправления, найденные на этом шаге.

- [ ] **Step 1: Полный прогон тестов**

Run: `npm run test -- --run`
Expected: все тесты PASS.

- [ ] **Step 2: Сборка**

Run: `npm run build`
Expected: `tsc -b` без ошибок, `vite build` успешен.

- [ ] **Step 3: Ручная проверка light/dark**

Run: `npm run dev`. Проверить в светлой и тёмной теме (системной и через тумблер):
- Экран подключения, пустое состояние, переписка, диалог нового чата.
- Тема сохраняется после перезагрузки; при системной тёмной теме нет вспышки светлой.
- Фокус-кольцо видно на полях, кнопках, тумблере.
- Длинный неразрывный текст в баббле и длинный номер не ломают layout.
- Контраст белого текста на градиенте и приглушённого текста ≥ 4.5:1.
- `prefers-reduced-motion` отключает переходы.

- [ ] **Step 4: Commit (если были правки)**

```bash
git add -A
git commit -m "fix: polish Kaitoma light/dark styling"
```

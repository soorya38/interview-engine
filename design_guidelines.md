# AI MockMate Design Guidelines

## Design Approach: Professional Productivity System

**Selected Approach:** Hybrid Design System combining Linear's minimalist professionalism, Notion's information hierarchy, and enterprise dashboard patterns. This interview platform requires clarity, credibility, and focus—visual polish that builds trust without distraction.

**Core Principles:**
- Professional Credibility: Clean, trustworthy interface that feels serious and legitimate
- Information Clarity: Complex data (scores, feedback, progress) must be instantly scannable
- Focus-Driven: Minimize cognitive load during high-stress interview sessions
- Progress Visibility: Clear visual feedback on improvement and achievements

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 222 10% 10% (deep charcoal)
- Surface: 222 10% 15% (elevated panels)
- Surface Elevated: 222 10% 18% (cards, modals)
- Primary Brand: 210 100% 55% (professional blue - trust, intelligence)
- Success: 142 70% 45% (achievement green)
- Warning: 38 90% 50% (needs improvement yellow)
- Error: 0 70% 50% (critical feedback red)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Border: 222 10% 25%

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary Brand: 210 100% 48%
- Text Primary: 222 20% 15%
- Text Secondary: 222 10% 45%
- Border: 220 10% 88%

**Accent Colors (Sparingly):**
- Interview Active: 160 60% 50% (teal - for live session indicators)
- Score Highlight: 210 100% 55% (matches primary)

### B. Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - body text, UI elements
- Headings: 'Inter' with tighter tracking - professional consistency
- Monospace: 'JetBrains Mono' - code snippets, technical answers

**Scale:**
- Display: 48px/56px (font-bold) - dashboard headers
- H1: 36px/44px (font-semibold) - page titles
- H2: 24px/32px (font-semibold) - section headers
- H3: 20px/28px (font-medium) - card titles
- Body: 16px/24px (font-normal) - primary content
- Small: 14px/20px (font-normal) - metadata, labels
- Caption: 12px/16px (font-medium) - micro-copy

### C. Layout System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 (consistent rhythm)

**Grid Structure:**
- Dashboard: 12-column grid with 24px gutters
- Content Max-Width: max-w-7xl (centered)
- Sidebar: Fixed 280px on desktop, collapsible on tablet
- Card Padding: p-6 (standard), p-8 (featured content)

**Responsive Breakpoints:**
- Mobile: Single column, stack all elements
- Tablet (md:): 2-column for test cards, single for forms
- Desktop (lg:): Full dashboard layout with sidebar

### D. Component Library

**Navigation:**
- Top Bar: Fixed header with logo, user profile, notifications (h-16, border-b)
- Sidebar: Role-based navigation (Admin/Instructor/User views), icon + label, active state with primary background
- Breadcrumbs: For deep navigation (test → topic → question)

**Dashboard Cards:**
- Elevated surface with subtle shadow
- Stat cards: Large number (display scale), label below, trend indicator (arrow + percentage)
- Test cards: Image/icon top, title, metadata, CTA button
- Progress cards: Circular progress indicators for scores, linear bars for skill tracking

**Interview Session UI:**
- Full-screen immersive mode (removes nav during active interview)
- Large question display: centered, max-w-3xl, generous padding
- Voice indicator: Animated waveform when AI is speaking
- Recording status: Pulsing red dot with duration timer
- Response area: Clean text input or voice activation toggle

**Scoring & Feedback:**
- Score breakdown: Horizontal bars with percentages (Grammar 85%, Technical 92%, etc.)
- Overall score: Large circular progress ring with grade (A/B/C/D)
- Feedback cards: Icon + category + detailed text, collapsible sections
- Comparison chart: Line graph showing progress over multiple sessions

**Forms & Inputs:**
- Consistent height (h-12 for inputs, h-10 for buttons)
- Focus states: 2px ring in primary color
- Labels: font-medium, text-sm, mb-2
- Validation: Inline error messages below fields

**Data Tables:**
- Alternating row backgrounds for readability
- Sortable columns with arrow indicators
- Action buttons in last column (view, edit, delete)
- Pagination at bottom

**Modals & Overlays:**
- Backdrop blur with dark overlay (bg-black/50)
- Modal: max-w-2xl, centered, p-8, rounded-xl
- Close button: top-right, subtle hover state

### E. Animations

**Micro-interactions Only:**
- Button hover: Scale 1.02, 150ms ease
- Card hover: Subtle lift with shadow increase, 200ms
- Score counters: Count-up animation on page load (once)
- Loading states: Skeleton loaders, no spinners
- Page transitions: None - instant navigation for responsiveness

**Avoid:** Scroll animations, parallax, excessive transitions

---

## Page-Specific Guidelines

### Dashboard (User View)
- Hero Stats: 3-column grid (lg:) showing Total Tests, Average Score, Improvement %
- Quick Actions: Start New Test CTA (primary button, prominent)
- Recent Tests: Card grid (2-3 columns) with thumbnails, titles, scores, resume button
- Progress Section: Skills radar chart + recent score trend line graph
- Upcoming/Scheduled: If applicable, list view with date/time

### Test Selection Page
- Filter sidebar: Topics, difficulty, duration (checkboxes, sliders)
- Test cards: Grid layout (2-3 columns), image placeholder, title, metadata (questions count, duration), start button
- Search bar: Prominent at top, instant filter

### Live Interview Session
- Minimalist fullscreen layout
- Question display: Large, centered text (max-w-3xl)
- AI avatar or waveform: Subtle animation when speaking
- User response area: Clean text input with mic icon, or voice-only mode
- Progress indicator: Subtle question counter (3/10) in corner
- Emergency exit: Discrete pause/end session button

### Results & Feedback Page
- Overall score: Hero section with large grade display
- Detailed breakdown: Tab navigation (Technical, Communication, Grammar, Depth)
- Each tab: Score visualization + specific feedback + example answers
- Action items: Highlighted recommendations in distinct cards
- Next steps CTA: Retake test or explore related topics

### Admin/Instructor Panel
- Different sidebar navigation (Manage Topics, Questions, Users, Analytics)
- Data-dense tables for content management
- Analytics dashboard: Charts for user engagement, average scores, popular topics
- Quick create: Floating action button for adding questions/topics

### Profile & Resume
- LinkedIn-style layout: Header with photo, name, title, stats
- Skills section: Tag clouds or bar charts
- Test history: Timeline view with score markers
- Resume preview: PDF viewer with download button
- ATS optimization tips: Callout cards with suggestions

---

## Images & Visual Assets

**No Large Hero Image Required** - This is a utility-focused platform where function over form is paramount.

**Strategic Image Placement:**
- Test card thumbnails: Topic-related illustrations (vector graphics, icons)
- Empty states: Friendly illustrations (undraw.co style) with encouraging messages
- Profile avatars: User photos or generated initial avatars
- Admin dashboard: Data visualization charts (no decorative images)

**Icon Usage:**
- Primary: Heroicons (outline for inactive, solid for active states)
- Consistent sizing: w-5 h-5 for inline icons, w-6 h-6 for prominent actions

---

## Accessibility & Quality Standards

- WCAG AA contrast ratios minimum (4.5:1 for text)
- Keyboard navigation: All actions accessible via Tab, Enter, Escape
- Focus indicators: Clear 2px rings on all interactive elements
- Screen reader: Proper ARIA labels on all complex components
- Dark mode: Maintain contrast standards, reduce blue light exposure
- Form inputs: Consistent background (surface color), clear borders, proper focus states

---

**Final Note:** This design prioritizes professional credibility, information clarity, and user focus. Every element serves the core purpose: helping users practice interviews and track improvement. Visual appeal comes from clean execution, not decorative elements.
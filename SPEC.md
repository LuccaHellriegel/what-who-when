# Spec — Current Version (One-Shot Birthday Edition)

## Product

A polished **local-only single-page browser game** inspired by the classic intellectual table format.

Title:

**Что? Где? Когда?**
**Nastia Edition**

Built for one birthday event. No future-proofing, no optional systems.

---

## Tech Stack

* React
* TypeScript
* Vite
* Framer Motion
* Tailwind CSS
* localStorage

---

## Runtime Constraints

* Runs entirely in browser
* No backend
* No login
* No API calls
* No internet required after page load
* Questions loaded from local JSON file

---

## Visual Theme

### Style

Elegant, dramatic, premium game-night atmosphere.

### Colors

```txt
Background: #0B1020
Surface:    #121A2E
Gold:       #D4AF37
Text:       #F8F5EC
Muted:      #9AA4B2
Success:    #2E9B55
Danger:     #C94A4A
```

### Header

Centered top:

```txt
Что? Где? Когда?
Nastia Edition
```

---

## Single Page Layout

```txt
┌──────────────────────────────┐
│ Header                       │
│ Scoreboard                   │
├──────────────┬───────────────┤
│ Wheel        │ Question Area │
│              │ Timer         │
│              │ Answer Input  │
│              │ Reveal Panel  │
├──────────────┴───────────────┤
│ History Drawer               │
└──────────────────────────────┘
```

Responsive for laptop / TV / tablet.

---

## Core Game Rules

* User/team = Experts
* Wrong answers = Viewers get point
* Correct answers = Experts get point
* First side to **6 points wins**

---

## Game Flow

```txt
App loads
→ Resume existing game OR Start new game
→ Click wheel
→ Wheel spins
→ Random unused question selected
→ Question shown
→ 60 second timer auto-starts
→ User types answer
→ Reveal official answer
→ Mark Correct / Wrong / Skip
→ Score updates
→ History saved
→ Next spin
→ First to 6 ends game
→ Final summary shown
```

---

## Wheel

## UI

* Large center wheel
* 12 sectors
* Gold rim
* Pointer marker

## Behavior

On click:

* Spins 2–4 rotations
* Slows naturally
* Lands on random sector

Question selection is random from unused pool.

---

## Timer

Default: **60 seconds**

## Behavior

Starts automatically when question appears.

## Controls

* Pause
* Resume
* Reveal early

At zero:

* visual pulse
* reveal button emphasized

---

## Question Panel

Displays:

* Round number
* Question text
* Optional image

Example:

```txt
Question 3

A man enters a room carrying a newspaper.
Five minutes later everyone applauds him.
Why?
```

---

## Answer Section

### Input

Single text area:

```txt
Type your answer...
```

### Buttons Before Reveal

* Reveal Answer
* Skip

### After Reveal

Show:

* Official answer
* Explanation (if exists)

Then:

* Correct
* Wrong
* Skip

---

## Scoreboard

Top of page:

```txt
Experts 3 — 2 Viewers
Round 5
```

---

## History Drawer

Persistent session memory.

Each round row:

```txt
Q1 ✅
Q2 ❌
Q3 ⏭
Q4 active
```

Expand row shows:

* typed answer
* official answer
* time used

---

## Final Summary Screen

When score reaches 6:

Example:

```txt
Experts win! 6–4
```

Show:

* Correct count
* Wrong count
* Skipped count
* Total rounds played

Buttons:

* New Game
* Close Summary

---

## Data Model

```ts
type Question = {
  id: string;
  text: string;
  answer: string;
  explanation?: string;
  image?: string;
};

type GameSession = {
  id: string;
  startedAt: number;
  endedAt?: number;
  expertScore: number;
  viewerScore: number;
  usedQuestionIds: string[];
  currentQuestionId?: string;
  round: number;
  status:
    | "idle"
    | "spinning"
    | "question"
    | "revealed"
    | "finished";
};

type Attempt = {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  result: "correct" | "wrong" | "skipped";
  shownAt: number;
  answeredAt?: number;
  timeUsedSeconds: number;
};
```

---

## Local Storage

```txt
nastia.currentSession
nastia.attempts
nastia.questions
```

---

## Components

```txt
<App />
<Header />
<Scoreboard />
<Wheel />
<QuestionPanel />
<Timer />
<AnswerInput />
<RevealPanel />
<HistoryDrawer />
<FinalSummary />
```

---

## Keyboard Shortcuts

```txt
Space = spin
R     = reveal
C     = correct
W     = wrong
S     = skip
```

---

## Question Source

Load from:

```txt
src/data/questions.json
```

---

## Build Priority

1. Layout + theme
2. Wheel animation
3. Question loading
4. Timer
5. Reveal + scoring
6. History
7. Persistence
8. Final polish

---

## Success Criteria

The host opens one webpage and can run the full birthday game smoothly with zero setup.

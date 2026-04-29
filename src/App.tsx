import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import questionsData from './questions.json'
import './App.css'

type Question = {
  id: string
  text: string
  answer: string
  explanation?: string
  image?: string
}

type Result = 'correct' | 'wrong' | 'skipped'

type HistoryEntry = {
  questionId: string
  questionText: string
  typedAnswer: string
  officialAnswer: string
  result: Result
  timeUsed: number
}

type ActiveRound = {
  question: Question
  typedAnswer: string
  remaining: number
  revealed: boolean
  paused: boolean
}

type GameState = {
  experts: number
  viewers: number
  usedQuestionIds: string[]
  history: HistoryEntry[]
  activeRound: ActiveRound | null
  wheelRotation: number
}

type PastGame = {
  id: string
  playedAt: string
  experts: number
  viewers: number
  history: HistoryEntry[]
}

const QUESTIONS = questionsData as Question[]
const STORAGE_KEY = 'what-who-when-nastia-game'
const ARCHIVE_STORAGE_KEY = 'what-who-when-nastia-past-games'
const TIMER_SECONDS = 60
const WIN_SCORE = 6
const SECTOR_COUNT = 12

const emptyGame: GameState = {
  experts: 0,
  viewers: 0,
  usedQuestionIds: [],
  history: [],
  activeRound: null,
  wheelRotation: 0,
}

function loadGame(): GameState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return emptyGame
    }

    const parsed = JSON.parse(stored) as GameState

    return {
      ...emptyGame,
      ...parsed,
      activeRound: parsed.activeRound
        ? { ...parsed.activeRound, paused: true }
        : null,
    }
  } catch {
    return emptyGame
  }
}

function loadPastGames(): PastGame[] {
  try {
    const stored = window.localStorage.getItem(ARCHIVE_STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored) as PastGame[]

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatTime(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusLabel(result: Result) {
  if (result === 'correct') {
    return 'Correct'
  }

  if (result === 'wrong') {
    return 'Wrong'
  }

  return 'Skipped'
}

function statusIcon(result: Result) {
  if (result === 'correct') {
    return '✓'
  }

  if (result === 'wrong') {
    return '×'
  }

  return '↷'
}

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame())
  const [pastGames, setPastGames] = useState<PastGame[]>(() => loadPastGames())
  const [spinning, setSpinning] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [viewedPastGameId, setViewedPastGameId] = useState<string | null>(null)

  const viewedPastGame =
    pastGames.find((pastGame) => pastGame.id === viewedPastGameId) ?? null
  const isViewingPast = Boolean(viewedPastGame)
  const displayedExperts = viewedPastGame?.experts ?? game.experts
  const displayedViewers = viewedPastGame?.viewers ?? game.viewers
  const displayedHistory = viewedPastGame?.history ?? game.history
  const roundNumber = game.history.length + (game.activeRound ? 1 : 0) + 1
  const activeRoundNumber = game.history.length + 1
  const winner =
    game.experts >= WIN_SCORE
      ? 'Experts'
      : game.viewers >= WIN_SCORE
        ? 'Viewers'
        : null
  const displayedWinner =
    displayedExperts >= WIN_SCORE
      ? 'Experts'
      : displayedViewers >= WIN_SCORE
        ? 'Viewers'
        : null

  const unusedQuestions = useMemo(
    () =>
      QUESTIONS.filter(
        (question) => !game.usedQuestionIds.includes(question.id),
      ),
    [game.usedQuestionIds],
  )

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  useEffect(() => {
    window.localStorage.setItem(
      ARCHIVE_STORAGE_KEY,
      JSON.stringify(pastGames),
    )
  }, [pastGames])

  useEffect(() => {
    if (
      !game.activeRound ||
      game.activeRound.paused ||
      game.activeRound.revealed ||
      game.activeRound.remaining <= 0
    ) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setGame((current) => {
        if (!current.activeRound || current.activeRound.paused) {
          return current
        }

        return {
          ...current,
          activeRound: {
            ...current.activeRound,
            remaining: Math.max(0, current.activeRound.remaining - 1),
          },
        }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [game.activeRound])

  function startNewGame() {
    if (game.history.length > 0) {
      const archivedGame: PastGame = {
        id: `${Date.now()}`,
        playedAt: new Date().toISOString(),
        experts: game.experts,
        viewers: game.viewers,
        history: game.history,
      }

      setPastGames((current) => [archivedGame, ...current].slice(0, 12))
    }

    setSpinning(false)
    setViewedPastGameId(null)
    setGame(emptyGame)
  }

  function openPastGame(id: string) {
    setViewedPastGameId(id)
    setArchiveOpen(false)
  }

  function returnToCurrentGame() {
    setViewedPastGameId(null)
    setArchiveOpen(false)
  }

  function spinWheel() {
    if (
      isViewingPast ||
      spinning ||
      game.activeRound ||
      winner ||
      unusedQuestions.length === 0
    ) {
      return
    }

    const question =
      unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)]
    const sector = Math.floor(Math.random() * SECTOR_COUNT)
    const extraTurns = 2 + Math.floor(Math.random() * 3)
    const nextRotation =
      game.wheelRotation + extraTurns * 360 + sector * (360 / SECTOR_COUNT)

    setSpinning(true)
    setGame((current) => ({ ...current, wheelRotation: nextRotation }))

    window.setTimeout(() => {
      setGame((current) => ({
        ...current,
        activeRound: {
          question,
          typedAnswer: '',
          remaining: TIMER_SECONDS,
          revealed: false,
          paused: false,
        },
        usedQuestionIds: [...current.usedQuestionIds, question.id],
      }))
      setSpinning(false)
    }, 1800)
  }

  function updateTypedAnswer(typedAnswer: string) {
    setGame((current) => {
      if (!current.activeRound) {
        return current
      }

      return {
        ...current,
        activeRound: { ...current.activeRound, typedAnswer },
      }
    })
  }

  function setPaused(paused: boolean) {
    setGame((current) => {
      if (!current.activeRound || current.activeRound.revealed) {
        return current
      }

      return {
        ...current,
        activeRound: { ...current.activeRound, paused },
      }
    })
  }

  function revealAnswer() {
    setGame((current) => {
      if (!current.activeRound) {
        return current
      }

      return {
        ...current,
        activeRound: {
          ...current.activeRound,
          revealed: true,
          paused: true,
        },
      }
    })
  }

  function finishRound(result: Result) {
    setGame((current) => {
      if (!current.activeRound) {
        return current
      }

      const { question, typedAnswer, remaining } = current.activeRound
      const entry: HistoryEntry = {
        questionId: question.id,
        questionText: question.text,
        typedAnswer,
        officialAnswer: question.answer,
        result,
        timeUsed: TIMER_SECONDS - remaining,
      }

      return {
        ...current,
        experts: current.experts + (result === 'correct' ? 1 : 0),
        viewers: current.viewers + (result === 'wrong' ? 1 : 0),
        history: [...current.history, entry],
        activeRound: null,
      }
    })
  }

  return (
    <main className="app-shell">
      <header className="game-header">
        <p className="kicker">Birthday Game Night</p>
        <h1>
          Что? Где? Когда?
          <span>Nastia Edition</span>
        </h1>
      </header>

      <section className="scoreboard" aria-label="Scoreboard">
        <div>
          <span>Experts</span>
          <strong>{displayedExperts}</strong>
        </div>
        <p aria-label="Current score">
          {displayedExperts} — {displayedViewers}
        </p>
        <div>
          <span>Viewers</span>
          <strong>{displayedViewers}</strong>
        </div>
        <span className="round-pill">
          {isViewingPast ? 'Past game' : `Round ${activeRoundNumber}`}
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </button>
        <button type="button" className="ghost-button" onClick={startNewGame}>
          New game
        </button>
      </section>

      {displayedWinner && (
        <motion.section
          className="final-summary"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
        >
          <p>{displayedWinner} win 6 points.</p>
          <strong>
            Final score: Experts {displayedExperts} — {displayedViewers}{' '}
            Viewers
          </strong>
        </motion.section>
      )}

      <section className="game-board" aria-label="Game board">
        <section className="wheel-stage" aria-label="Wheel">
          <div className="pointer" aria-hidden="true" />
          <motion.button
            type="button"
            className="wheel"
            onClick={spinWheel}
            disabled={
              isViewingPast ||
              Boolean(game.activeRound) ||
              spinning ||
              Boolean(winner)
            }
            animate={{ rotate: game.wheelRotation }}
            transition={{ duration: 1.8, ease: [0.15, 0.82, 0.22, 1] }}
            aria-label="Spin wheel"
          >
            {Array.from({ length: SECTOR_COUNT }, (_, index) => (
              <span
                key={index}
                style={
                  {
                    '--sector-angle': `${index * (360 / SECTOR_COUNT)}deg`,
                  } as CSSProperties
                }
              >
                {index + 1}
              </span>
            ))}
            <strong>
              {isViewingPast ? 'Past' : spinning ? 'Spinning' : 'Spin'}
            </strong>
          </motion.button>
          <p className="wheel-caption">
            {isViewingPast
              ? 'Viewing archived game'
              : `${unusedQuestions.length} unused questions remain`}
          </p>
        </section>

        <section className="question-panel" aria-label="Question area">
          {viewedPastGame ? (
            <div className="empty-question past-view">
              <p>{formatDate(viewedPastGame.playedAt)}</p>
              <h2>
                Archived game: Experts {viewedPastGame.experts} —{' '}
                {viewedPastGame.viewers} Viewers
              </h2>
              <span>
                {viewedPastGame.history.length} completed rounds. Use the
                bottom history drawer to inspect answers from this game.
              </span>
              <button
                type="button"
                className="primary-button"
                onClick={returnToCurrentGame}
              >
                Back to current game
              </button>
            </div>
          ) : game.activeRound ? (
            <>
              <div className="question-meta">
                <p>Question {activeRoundNumber}</p>
                <span>{game.activeRound.question.id}</span>
              </div>

              <h2>{game.activeRound.question.text}</h2>

              {game.activeRound.question.image && (
                <img
                  src={game.activeRound.question.image}
                  alt=""
                  className="question-image"
                />
              )}

              <div
                className={`timer ${game.activeRound.remaining === 0 ? 'is-zero' : ''}`}
                aria-live="polite"
              >
                <strong>{formatTime(game.activeRound.remaining)}</strong>
                <div className="timer-controls">
                  {game.activeRound.paused ? (
                    <button
                      type="button"
                      onClick={() => setPaused(false)}
                      disabled={game.activeRound.revealed}
                    >
                      Resume
                    </button>
                  ) : (
                    <button type="button" onClick={() => setPaused(true)}>
                      Pause
                    </button>
                  )}
                  <button
                    type="button"
                    className={
                      game.activeRound.remaining === 0 ? 'emphasis-button' : ''
                    }
                    onClick={revealAnswer}
                  >
                    Reveal early
                  </button>
                </div>
              </div>

              <label className="answer-field">
                <span>Your answer</span>
                <textarea
                  value={game.activeRound.typedAnswer}
                  onChange={(event) => updateTypedAnswer(event.target.value)}
                  placeholder="Type your answer..."
                  disabled={game.activeRound.revealed}
                />
              </label>

              {!game.activeRound.revealed ? (
                <div className="action-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={revealAnswer}
                  >
                    Reveal Answer
                  </button>
                  <button type="button" onClick={() => finishRound('skipped')}>
                    Skip
                  </button>
                </div>
              ) : (
                <motion.div
                  className="reveal-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p>Official answer</p>
                  <strong>{game.activeRound.question.answer}</strong>
                  {game.activeRound.question.explanation && (
                    <span>{game.activeRound.question.explanation}</span>
                  )}
                  <div className="action-row">
                    <button
                      type="button"
                      className="success-button"
                      onClick={() => finishRound('correct')}
                    >
                      Correct
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => finishRound('wrong')}
                    >
                      Wrong
                    </button>
                    <button
                      type="button"
                      onClick={() => finishRound('skipped')}
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <div className="empty-question">
              <p>Round {roundNumber}</p>
              <h2>{winner ? 'Game complete' : 'Spin the wheel'}</h2>
              <span>
                {winner
                  ? 'Start a new game to play again.'
                  : 'A random unused question will appear here.'}
              </span>
            </div>
          )}
        </section>
      </section>

      <section className="history-drawer" aria-label="History drawer">
        <div className="history-title">
          <h2>{isViewingPast ? 'Past Game History' : 'History'}</h2>
          <span>
            {displayedHistory.length} rounds · {pastGames.length} archived
          </span>
        </div>
        <div className="history-list">
          {displayedHistory.map((entry, index) => (
            <details
              key={`${viewedPastGame?.id ?? 'current'}-${entry.questionId}`}
              className={`history-row ${entry.result}`}
            >
              <summary>
                <span>
                  Q{index + 1} {statusIcon(entry.result)}
                </span>
                <strong>{statusLabel(entry.result)}</strong>
              </summary>
              <dl>
                <div>
                  <dt>Typed answer</dt>
                  <dd>{entry.typedAnswer || 'No answer typed'}</dd>
                </div>
                <div>
                  <dt>Official answer</dt>
                  <dd>{entry.officialAnswer}</dd>
                </div>
                <div>
                  <dt>Time used</dt>
                  <dd>{entry.timeUsed}s</dd>
                </div>
              </dl>
            </details>
          ))}
          {!isViewingPast && game.activeRound && (
            <div className="history-row active">
              <span>Q{activeRoundNumber} active</span>
            </div>
          )}
          {!displayedHistory.length && !game.activeRound && (
            <p className="empty-history">No rounds yet.</p>
          )}
        </div>
      </section>

      {archiveOpen && (
        <>
          <button
            type="button"
            className="archive-backdrop"
            aria-label="Close archive"
            onClick={() => setArchiveOpen(false)}
          />
          <motion.aside
            className="archive-drawer"
            aria-label="Game archive"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="archive-header">
              <div>
                <p className="kicker">Archive</p>
                <h2>Games</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setArchiveOpen(false)}
              >
                Close
              </button>
            </div>

            <button
              type="button"
              className={`archive-game-button ${!isViewingPast ? 'is-active' : ''}`}
              onClick={returnToCurrentGame}
            >
              <span>Current game</span>
              <strong>
                {game.experts} — {game.viewers}
              </strong>
              <small>{game.history.length} completed rounds</small>
            </button>

            <div className="archive-list">
              {pastGames.map((pastGame, gameIndex) => (
                <button
                  type="button"
                  key={pastGame.id}
                  className={`archive-game-button ${
                    viewedPastGameId === pastGame.id ? 'is-active' : ''
                  }`}
                  onClick={() => openPastGame(pastGame.id)}
                >
                  <span>Game {pastGames.length - gameIndex}</span>
                  <strong>
                    {pastGame.experts} — {pastGame.viewers}
                  </strong>
                  <small>
                    {formatDate(pastGame.playedAt)} ·{' '}
                    {pastGame.history.length} rounds
                  </small>
                </button>
              ))}
              {!pastGames.length && (
                <p className="empty-history">
                  Past games will appear here after you start a new game.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </main>
  )
}

export default App

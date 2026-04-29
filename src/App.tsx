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

const QUESTIONS = questionsData as Question[]
const STORAGE_KEY = 'what-who-when-nastia-game'
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

function formatTime(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`
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
  const [spinning, setSpinning] = useState(false)

  const roundNumber = game.history.length + (game.activeRound ? 1 : 0) + 1
  const activeRoundNumber = game.history.length + 1
  const winner =
    game.experts >= WIN_SCORE
      ? 'Experts'
      : game.viewers >= WIN_SCORE
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
    setSpinning(false)
    setGame(emptyGame)
  }

  function spinWheel() {
    if (spinning || game.activeRound || winner || unusedQuestions.length === 0) {
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
          <strong>{game.experts}</strong>
        </div>
        <p aria-label="Current score">
          {game.experts} — {game.viewers}
        </p>
        <div>
          <span>Viewers</span>
          <strong>{game.viewers}</strong>
        </div>
        <span className="round-pill">Round {activeRoundNumber}</span>
        <button type="button" className="ghost-button" onClick={startNewGame}>
          New game
        </button>
      </section>

      {winner && (
        <motion.section
          className="final-summary"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
        >
          <p>{winner} win 6 points.</p>
          <strong>
            Final score: Experts {game.experts} — {game.viewers} Viewers
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
            disabled={Boolean(game.activeRound) || spinning || Boolean(winner)}
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
            <strong>{spinning ? 'Spinning' : 'Spin'}</strong>
          </motion.button>
          <p className="wheel-caption">
            {unusedQuestions.length} unused questions remain
          </p>
        </section>

        <section className="question-panel" aria-label="Question area">
          {game.activeRound ? (
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
          <h2>History</h2>
          <span>{game.history.length} completed</span>
        </div>
        <div className="history-list">
          {game.history.map((entry, index) => (
            <details key={entry.questionId} className={`history-row ${entry.result}`}>
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
          {game.activeRound && (
            <div className="history-row active">
              <span>Q{activeRoundNumber} active</span>
            </div>
          )}
          {!game.history.length && !game.activeRound && (
            <p className="empty-history">No rounds yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App

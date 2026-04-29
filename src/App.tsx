import { motion } from 'framer-motion'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">React + TypeScript + Vite</p>
        <h1>SPA starter with Framer Motion</h1>
        <p>
          This project is initialized with Vite and includes linting, unit
          tests, production builds, and a Framer Motion animation example.
        </p>
      </section>

      <section className="motion-demo" aria-labelledby="motion-title">
        <div>
          <p className="eyebrow">Framer Motion example</p>
          <h2 id="motion-title">Animated status cards</h2>
          <p>
            The cards use entrance animation, hover lift, and staggered timing
            from Framer Motion.
          </p>
        </div>

        <motion.ul
          className="status-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.14,
              },
            },
          }}
        >
          {['Initialize', 'Animate', 'Ship'].map((item) => (
            <motion.li
              key={item}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <span>{item}</span>
              <strong>{item === 'Ship' ? 'Ready' : 'Done'}</strong>
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </main>
  )
}

export default App

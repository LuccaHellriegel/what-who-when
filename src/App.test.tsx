import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Framer Motion example', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /spa starter with framer motion/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /animated status cards/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ship')).toBeInTheDocument()
  })
})

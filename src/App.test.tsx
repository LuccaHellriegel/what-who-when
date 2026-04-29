import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the birthday game shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: /что\? где\? когда\?\s*nastia edition/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/scoreboard/i)).toHaveTextContent(
      /experts0.*0.*viewers/i,
    )
    expect(screen.getByRole('button', { name: /spin wheel/i })).toBeEnabled()
    expect(screen.getByLabelText(/history drawer/i)).toHaveTextContent(
      /no rounds yet/i,
    )
  })
})

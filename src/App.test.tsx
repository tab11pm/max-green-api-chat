import { render, screen } from '@testing-library/react'
import App from './App'

test('shows the GREEN-API connection heading', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Подключение к GREEN-API' }),
  ).toBeInTheDocument()
})

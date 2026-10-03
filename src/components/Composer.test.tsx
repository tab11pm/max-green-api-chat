import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import Composer from './Composer'

it('sends the message on Enter', async () => {
  const onSend = vi.fn().mockResolvedValue(undefined)
  render(<Composer onSend={onSend} />)
  const box = screen.getByRole('textbox', { name: 'Сообщение' })

  fireEvent.change(box, { target: { value: 'Привет' } })
  fireEvent.keyDown(box, { key: 'Enter' })

  expect(onSend).toHaveBeenCalledWith('Привет')
  await act(async () => {})
  expect(box).toHaveValue('')
})

it('does not send on Shift+Enter and keeps the text for a new line', () => {
  const onSend = vi.fn().mockResolvedValue(undefined)
  render(<Composer onSend={onSend} />)
  const box = screen.getByRole('textbox', { name: 'Сообщение' })

  fireEvent.change(box, { target: { value: 'Строка' } })
  fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })

  expect(onSend).not.toHaveBeenCalled()
  expect(box).toHaveValue('Строка')
})

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskFilters from './task-filters'
import type { TaskFilters as TaskFiltersType } from '@/types/task'

describe('TaskFilters', () => {
  const defaultFilters: TaskFiltersType = {
    search: '',
    status: 'all',
    priority: 'all',
  }

  test('should render all filter inputs', () => {
    const onFilterChange = vi.fn()
    
    render(
      <TaskFilters filters={defaultFilters} onFilterChange={onFilterChange} />
    )

    expect(screen.getByPlaceholderText('Buscar tarefas...')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /status/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /prioridade/i })).toBeTruthy()
  })

  test('should call onFilterChange when search input changes', () => {
    const onFilterChange = vi.fn()
    
    render(
      <TaskFilters filters={defaultFilters} onFilterChange={onFilterChange} />
    )

    const searchInput = screen.getByPlaceholderText('Buscar tarefas...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'test search',
    })
  })

  test('should display current search value', () => {
    const filters: TaskFiltersType = {
      search: 'existing search',
      status: 'all',
      priority: 'all',
    }
    
    render(
      <TaskFilters filters={filters} onFilterChange={vi.fn()} />
    )

    const searchInput = screen.getByPlaceholderText('Buscar tarefas...') as HTMLInputElement
    expect(searchInput.value).toBe('existing search')
  })

  test('should have search icon', () => {
    render(
      <TaskFilters filters={defaultFilters} onFilterChange={vi.fn()} />
    )

    const searchIcon = document.querySelector('svg')
    expect(searchIcon).toBeTruthy()
  })
})
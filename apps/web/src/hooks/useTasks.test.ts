import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTasks } from './useTasks'
import * as useApiModule from './useApi'

vi.mock('./useApi')
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTasks', () => {
  let mockApi: any

  beforeEach(() => {
    mockApi = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }

    vi.mocked(useApiModule.useApi).mockReturnValue({ api: mockApi })
  })

  test('should fetch tasks successfully', async () => {
    const mockTasks = {
      tasks: [
        {
          id: 'task-1',
          title: 'Test Task',
          description: 'Description',
          status: 'TODO',
          priority: 'HIGH',
        },
      ],
      total: 1,
      page: 1,
      size: 20,
    }

    mockApi.get.mockResolvedValue({ data: mockTasks })

    const { result } = renderHook(() => useTasks(1, 20), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Test Task')
    expect(result.current.total).toBe(1)
  })

  test('should handle fetch error', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTasks(1, 20), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.tasks).toHaveLength(0)
  })

  test('should create task successfully', async () => {
    mockApi.get.mockResolvedValue({ data: { tasks: [], total: 0, page: 1, size: 20 } })
    mockApi.post.mockResolvedValue({
      data: { task: { id: 'new-task', title: 'New Task' } },
    })

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const taskData = {
      title: 'New Task',
      description: 'Description',
      priority: 'HIGH' as const,
      status: 'TODO' as const,
      assigneeIds: [],
    }

    await result.current.createTask.mutateAsync(taskData)

    expect(mockApi.post).toHaveBeenCalledWith('/api/tasks', {
      ...taskData,
      dueDate: '',
    })
  })

  test('should update task successfully', async () => {
    mockApi.get.mockResolvedValue({ data: { tasks: [], total: 0, page: 1, size: 20 } })
    mockApi.put.mockResolvedValue({
      data: { task: { id: 'task-1', title: 'Updated Task' } },
    })

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.updateTask.mutateAsync({
      taskId: 'task-1',
      payload: {
        title: 'Updated Task',
        description: 'Updated',
        priority: 'LOW',
        status: 'DONE',
        assigneeIds: [],
      },
    })

    expect(mockApi.put).toHaveBeenCalledWith('/api/tasks/task-1', expect.any(Object))
  })

  test('should delete task successfully', async () => {
    mockApi.get.mockResolvedValue({ data: { tasks: [], total: 0, page: 1, size: 20 } })
    mockApi.delete.mockResolvedValue({ data: { message: 'Task deleted' } })

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.deleteTask.mutateAsync('task-1')

    expect(mockApi.delete).toHaveBeenCalledWith('/api/tasks/task-1')
  })

  test('should apply filters correctly', async () => {
    mockApi.get.mockResolvedValue({
      data: { tasks: [], total: 0, page: 1, size: 20 },
    })

    const filters = {
      search: 'test',
      status: 'TODO',
      priority: 'HIGH',
    }

    renderHook(() => useTasks(1, 20, filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          params: expect.objectContaining(filters),
        })
      )
    })
  })
})
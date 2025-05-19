import { create } from 'zustand';
import { Phase, PlanDetail, Task, TaskStatusType } from '../types';

interface TasksFilterOptions {
  status: TaskStatusType | null;
  searchQuery: string;
}

// For creating a new task, we typically only need a few fields.
// Backend will handle ID, dates, order, status defaults, etc.
type NewTaskPayload = Pick<Task, 'name' | 'description'> & { phaseId: string };

interface TasksState {
  currentPlanId: string | null;
  phasesAsColumns: Phase[];
  tasks: Task[];
  selectedTask: Task | null;

  isLoading: boolean;
  error: Error | null;

  filterOptions: TasksFilterOptions;

  // Actions
  loadPlanData: (planDetail: PlanDetail) => void;
  clearPlanData: () => void;

  selectTask: (taskId: string | null) => void;
  addTask: (newTaskPayload: NewTaskPayload) => Promise<void>;
  updateTask: (
    taskId: string,
    updates: Partial<
      Omit<Task, 'id' | 'creationDate' | 'updatedAt' | 'phaseId'>
    >
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (
    taskId: string,
    targetPhaseId: string,
    newOrder: number
  ) => Promise<void>;

  setFilter: (filter: Partial<TasksFilterOptions>) => void;
  clearFilters: () => void;
}

const initialState = {
  currentPlanId: null,
  phasesAsColumns: [],
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  filterOptions: {
    status: null,
    searchQuery: '',
  },
};

export const useTasksStore = create<TasksState>((set, get) => ({
  ...initialState,

  loadPlanData: (planDetail) => {
    if (!planDetail || !planDetail.id) {
      set({
        ...initialState,
        error: new Error('Invalid plan detail provided.'),
      });
      return;
    }
    set({ isLoading: true, error: null, currentPlanId: planDetail.id });

    const phases = planDetail.phases || [];
    let allTasks: Task[] = [];
    phases.forEach((phase) => {
      if (phase.tasks && Array.isArray(phase.tasks)) {
        allTasks = [...allTasks, ...phase.tasks];
      }
    });

    set({
      phasesAsColumns: phases,
      tasks: allTasks,
      isLoading: false,
      currentPlanId: planDetail.id,
    });
  },

  clearPlanData: () => {
    set({ ...initialState });
  },

  selectTask: (taskId) =>
    set((state) => ({
      selectedTask: taskId
        ? state.tasks.find((task) => task.id === taskId) || null
        : null,
    })),

  addTask: async (newTaskPayload: NewTaskPayload) => {
    const currentPlanId = get().currentPlanId;
    if (!currentPlanId) {
      console.error('No plan selected to add task to.');
      set({ error: new Error('No plan selected to add task to.') });
      return;
    }
    console.log(
      'addTask called with:',
      newTaskPayload,
      'for planId:',
      currentPlanId
    );
    set({ isLoading: true });
    try {
      // Example: const createdTask = await apiClient.createTask(currentPlanId, newTaskPayload.phaseId, { name: newTaskPayload.name, description: newTaskPayload.description });
      // set((state) => ({ tasks: [...state.tasks, createdTask], isLoading: false }));
      console.log('Simulating API call for addTask');
      set({
        isLoading: false,
        error: new Error('addTask: API call to be implemented'),
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to add task:', error);
    }
  },

  updateTask: async (taskId, updates) => {
    console.log('updateTask called with:', taskId, updates);
    set({ isLoading: true });
    try {
      // const updatedTask = await apiClient.updateTask(taskId, updates);
      // set((state) => ({
      //   tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task)),
      //   selectedTask: state.selectedTask?.id === taskId ? { ...state.selectedTask, ...updatedTask } : state.selectedTask,
      //   isLoading: false,
      // }));
      console.log('Simulating API call for updateTask');
      set({
        isLoading: false,
        error: new Error('updateTask: API call to be implemented'),
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to update task:', error);
    }
  },

  deleteTask: async (taskId) => {
    console.log('deleteTask called for:', taskId);
    set({ isLoading: true });
    try {
      // await apiClient.deleteTask(taskId);
      // set((state) => ({
      //   tasks: state.tasks.filter((task) => task.id !== taskId),
      //   selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
      //   isLoading: false,
      // }));
      console.log('Simulating API call for deleteTask');
      set({
        isLoading: false,
        error: new Error('deleteTask: API call to be implemented'),
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to delete task:', error);
    }
  },

  moveTask: async (taskId, targetPhaseId, newOrder) => {
    const currentPlanId = get().currentPlanId;
    if (!currentPlanId) {
      console.error('No plan selected for moving task.');
      set({ error: new Error('No plan selected for moving task.') });
      return;
    }
    console.log(
      'moveTask called with:',
      taskId,
      targetPhaseId,
      newOrder,
      'for planId:',
      currentPlanId
    );
    set({ isLoading: true });
    try {
      // const movedTask = await apiClient.moveTask(currentPlanId, taskId, targetPhaseId, newOrder);
      // set((state) => ({
      //   tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...movedTask, phaseId: targetPhaseId, order: newOrder } : t)
      //     .sort((a, b) => a.order - b.order),
      //   isLoading: false
      // }));
      console.log('Simulating API call for moveTask');
      set({
        isLoading: false,
        error: new Error('moveTask: API call to be implemented'),
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to move task:', error);
    }
  },

  setFilter: (filter) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...filter },
    })),

  clearFilters: () =>
    set(() => ({
      filterOptions: {
        ...initialState.filterOptions,
      },
    })),
}));

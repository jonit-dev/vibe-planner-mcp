import { create } from 'zustand';
import { Task, TaskPriority, TaskStatus, Tag, KanbanColumn } from '../types';

type FilterOptions = {
  status: TaskStatus | null;
  priority: TaskPriority | null;
  searchQuery: string;
  tags: string[];
};

interface KanbanState {
  tasks: Task[];
  columns: KanbanColumn[];
  tags: Tag[];
  selectedTask: Task | null;
  filterOptions: FilterOptions;
  
  // Actions
  selectTask: (taskId: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setFilter: (filter: Partial<FilterOptions>) => void;
  clearFilters: () => void;
}

// Initial mock data
const initialTags: Tag[] = [
  { id: '1', name: 'bug', color: '#F38BA8' },
  { id: '2', name: 'feature', color: '#A6E3A1' },
  { id: '3', name: 'documentation', color: '#74C7EC' },
  { id: '4', name: 'design', color: '#CBA6F7' }
];

const initialColumns: KanbanColumn[] = [
  { id: '1', title: 'Backlog', status: TaskStatus.BACKLOG },
  { id: '2', title: 'To Do', status: TaskStatus.TODO },
  { id: '3', title: 'In Progress', status: TaskStatus.IN_PROGRESS },
  { id: '4', title: 'Review', status: TaskStatus.REVIEW },
  { id: '5', title: 'Done', status: TaskStatus.DONE }
];

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Fix authentication bug',
    description: 'Users are experiencing logout issues when session timeout occurs.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [initialTags[0]],
    assignee: 'Jane Doe'
  },
  {
    id: '2',
    title: 'Implement dark mode',
    description: 'Add dark mode support to the application with theme toggle.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [initialTags[3]],
    assignee: 'John Smith'
  },
  {
    id: '3',
    title: 'Update API documentation',
    description: 'The API documentation is out of date and needs to be updated.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
    createdAt: new Date().toISOString(),
    tags: [initialTags[2]],
  },
  {
    id: '4',
    title: 'Implement search functionality',
    description: 'Add search functionality to the application.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    createdAt: new Date().toISOString(),
    tags: [initialTags[1]],
    assignee: 'Alex Johnson'
  },
  {
    id: '5',
    title: 'Design new landing page',
    description: 'Create mockups for the new landing page.',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.MEDIUM,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [initialTags[3]],
    assignee: 'Sarah Williams'
  }
];

export const useKanbanStore = create<KanbanState>((set) => ({
  tasks: initialTasks,
  columns: initialColumns,
  tags: initialTags,
  selectedTask: null,
  filterOptions: {
    status: null,
    priority: null,
    searchQuery: '',
    tags: [],
  },
  
  selectTask: (taskId) => 
    set((state) => ({ 
      selectedTask: taskId ? state.tasks.find(task => task.id === taskId) || null : null 
    })),
    
  addTask: (task) => 
    set((state) => ({ 
      tasks: [...state.tasks, task] 
    })),
    
  updateTask: (taskId, updates) => 
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    })),
    
  deleteTask: (taskId) => 
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask
    })),
    
  setFilter: (filter) => 
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...filter }
    })),
    
  clearFilters: () => 
    set(() => ({
      filterOptions: {
        status: null,
        priority: null,
        searchQuery: '',
        tags: [],
      }
    })),
}));
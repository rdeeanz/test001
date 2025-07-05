class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.theme = localStorage.getItem('todoTheme') || 'light';
        this.viewMode = localStorage.getItem('todoViewMode') || 'list';
        this.currentEditingId = null;
        this.selectedTasks = new Set();
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.setDefaultDueDate();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Task form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Toggle task details
        document.getElementById('toggle-details').addEventListener('click', () => {
            this.toggleTaskDetails();
        });

        // Search functionality
        document.getElementById('search-tasks').addEventListener('input', (e) => {
            this.searchTasks(e.target.value);
        });

        // Filter and sort
        document.getElementById('filter-status').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('sort-tasks').addEventListener('change', () => {
            this.renderTasks();
        });

        // View toggle
        document.getElementById('list-view').addEventListener('click', () => {
            this.setViewMode('list');
        });

        document.getElementById('grid-view').addEventListener('click', () => {
            this.setViewMode('grid');
        });

        // Bulk actions
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.toggleSelectAll();
        });

        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            this.deleteSelectedTasks();
        });

        document.getElementById('mark-completed-btn').addEventListener('click', () => {
            this.markSelectedCompleted();
        });

        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('edit-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Delete confirmation modal
        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Data management
        document.getElementById('export-tasks').addEventListener('click', () => {
            this.exportTasks();
        });

        document.getElementById('import-tasks').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importTasks(e.target.files[0]);
        });

        document.getElementById('clear-all-tasks').addEventListener('click', () => {
            this.clearAllTasks();
        });

        // Modal backdrop clicks
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeModal();
            }
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        document.getElementById('task-title').focus();
                        break;
                    case 'a':
                        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                            e.preventDefault();
                            this.toggleSelectAll();
                        }
                        break;
                    case 'd':
                        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                            e.preventDefault();
                            this.deleteSelectedTasks();
                        }
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
            }
        });
    }

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('todoTheme', this.theme);
        this.showToast('Theme changed successfully!', 'success');
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // View Management
    setViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('todoViewMode', mode);
        
        const listBtn = document.getElementById('list-view');
        const gridBtn = document.getElementById('grid-view');
        const container = document.getElementById('tasks-container');
        
        if (mode === 'list') {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
            container.classList.remove('grid-view');
        } else {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
            container.classList.add('grid-view');
        }
    }

    // Task Management
    addTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;

        if (!title) {
            this.showToast('Please enter a task title!', 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            title,
            description,
            category,
            priority,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.clearForm();
        this.showToast('Task added successfully!', 'success');
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentEditingId = id;
        
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description || '';
        document.getElementById('edit-task-category').value = task.category;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-due-date').value = task.dueDate 
            ? new Date(task.dueDate).toISOString().slice(0, 16) 
            : '';

        this.showModal();
    }

    saveEditedTask() {
        const task = this.tasks.find(t => t.id === this.currentEditingId);
        if (!task) return;

        const title = document.getElementById('edit-task-title').value.trim();
        
        if (!title) {
            this.showToast('Please enter a task title!', 'error');
            return;
        }

        task.title = title;
        task.description = document.getElementById('edit-task-description').value.trim();
        task.category = document.getElementById('edit-task-category').value;
        task.priority = document.getElementById('edit-task-priority').value;
        task.dueDate = document.getElementById('edit-task-due-date').value 
            ? new Date(document.getElementById('edit-task-due-date').value).toISOString() 
            : null;
        task.updatedAt = new Date().toISOString();

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeModal();
        this.showToast('Task updated successfully!', 'success');
    }

    deleteTask(id) {
        this.taskToDelete = id;
        document.getElementById('delete-message').textContent = 'Are you sure you want to delete this task?';
        this.showDeleteModal();
    }

    confirmDelete() {
        if (this.taskToDelete) {
            this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete);
            this.selectedTasks.delete(this.taskToDelete);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateBulkActionButtons();
            this.closeDeleteModal();
            this.showToast('Task deleted successfully!', 'success');
            this.taskToDelete = null;
        }
    }

    toggleTaskCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        const message = task.completed ? 'Task completed!' : 'Task marked as pending!';
        this.showToast(message, 'success');
    }

    // Bulk Operations
    toggleSelectAll() {
        const visibleTasks = this.getFilteredTasks();
        const allSelected = visibleTasks.every(task => this.selectedTasks.has(task.id));

        if (allSelected) {
            visibleTasks.forEach(task => this.selectedTasks.delete(task.id));
        } else {
            visibleTasks.forEach(task => this.selectedTasks.add(task.id));
        }

        this.renderTasks();
        this.updateBulkActionButtons();
    }

    toggleTaskSelection(id) {
        if (this.selectedTasks.has(id)) {
            this.selectedTasks.delete(id);
        } else {
            this.selectedTasks.add(id);
        }
        this.updateBulkActionButtons();
    }

    updateBulkActionButtons() {
        const selectedCount = this.selectedTasks.size;
        const deleteBtn = document.getElementById('delete-selected-btn');
        const completeBtn = document.getElementById('mark-completed-btn');
        const selectAllBtn = document.getElementById('select-all-btn');

        deleteBtn.disabled = selectedCount === 0;
        completeBtn.disabled = selectedCount === 0;

        const visibleTasks = this.getFilteredTasks();
        const allSelected = visibleTasks.length > 0 && visibleTasks.every(task => this.selectedTasks.has(task.id));
        selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';

        selectAllBtn.querySelector('i').className = allSelected ? 'fas fa-square' : 'fas fa-check-square';
    }

    deleteSelectedTasks() {
        if (this.selectedTasks.size === 0) return;

        this.tasksToDelete = Array.from(this.selectedTasks);
        const count = this.selectedTasks.size;
        document.getElementById('delete-message').textContent = 
            `Are you sure you want to delete ${count} selected task${count > 1 ? 's' : ''}?`;
        this.showDeleteModal();
    }

    markSelectedCompleted() {
        const selectedTaskIds = Array.from(this.selectedTasks);
        let completedCount = 0;

        selectedTaskIds.forEach(id => {
            const task = this.tasks.find(t => t.id === id);
            if (task && !task.completed) {
                task.completed = true;
                task.updatedAt = new Date().toISOString();
                completedCount++;
            }
        });

        if (completedCount > 0) {
            this.selectedTasks.clear();
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateBulkActionButtons();
            this.showToast(`${completedCount} task${completedCount > 1 ? 's' : ''} marked as completed!`, 'success');
        }
    }

    // Filtering and Sorting
    getFilteredTasks() {
        let filteredTasks = [...this.tasks];

        // Apply status filter
        const statusFilter = document.getElementById('filter-status').value;
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => {
                switch (statusFilter) {
                    case 'completed':
                        return task.completed;
                    case 'pending':
                        return !task.completed && !this.isOverdue(task);
                    case 'overdue':
                        return !task.completed && this.isOverdue(task);
                    default:
                        return true;
                }
            });
        }

        // Apply category filter
        const categoryFilter = document.getElementById('filter-category').value;
        if (categoryFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
        }

        // Apply search filter
        const searchTerm = document.getElementById('search-tasks').value.toLowerCase().trim();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }

        // Apply sorting
        const sortBy = document.getElementById('sort-tasks').value;
        filteredTasks.sort((a, b) => {
            switch (sortBy) {
                case 'created-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'created-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'due-asc':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'due-desc':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(b.dueDate) - new Date(a.dueDate);
                case 'priority-desc':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'priority-asc':
                    const priorityOrderAsc = { high: 3, medium: 2, low: 1 };
                    return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
                case 'title-asc':
                    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                case 'title-desc':
                    return b.title.toLowerCase().localeCompare(a.title.toLowerCase());
                default:
                    return 0;
            }
        });

        return filteredTasks;
    }

    searchTasks(searchTerm) {
        this.renderTasks();
    }

    // Rendering
    renderTasks() {
        const container = document.getElementById('tasks-container');
        const tasks = this.getFilteredTasks();

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your filters or create a new task!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        this.updateBulkActionButtons();
    }

    createTaskHTML(task) {
        const isOverdue = this.isOverdue(task);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isSelected = this.selectedTasks.has(task.id);

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${task.priority}-priority slide-in">
                <div class="task-bulk-checkbox ${isSelected ? 'checked' : ''}" onclick="todoApp.toggleTaskSelection('${task.id}')"></div>
                
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoApp.toggleTaskCompletion('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        
                        <div class="task-meta">
                            <span class="task-category">
                                <i class="fas fa-tag"></i>
                                ${this.formatCategory(task.category)}
                            </span>
                            <span class="task-priority ${task.priority}">
                                <i class="fas fa-flag"></i>
                                ${this.formatP
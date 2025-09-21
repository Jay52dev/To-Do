class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.activityLog = [];
        this.taskIdCounter = 1;

        this.init();
    }

    init() {
        this.addActivity('Application initialized', 'System');
        this.updateStats();
        this.updateProgress();
    }

    addTask() {
        const titleInput = document.getElementById('taskTitle');
        const descInput = document.getElementById('taskDescription');
        const prioritySelect = document.getElementById('taskPriority');

        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const priority = prioritySelect.value;

        if (!title) {
            this.showNotification('⚠️ Please enter a task title!', 'error');
            titleInput.focus();
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            title,
            description,
            priority,
            completed: false,
            createdAt: new Date(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.addActivity(`Created task: "${title}"`, 'Create');

        // Clear inputs
        titleInput.value = '';
        descInput.value = '';
        prioritySelect.value = 'medium';

        this.renderTasks();
        this.updateStats();
        this.updateProgress();

        this.showNotification('✅ Task created successfully!');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;

        const action = task.completed ? 'Completed' : 'Reopened';
        this.addActivity(`${action} task: "${task.title}"`, action);

        if (task.completed) {
            this.showCelebration('🎉 Task Completed! Great job!');
        }

        this.renderTasks();
        this.updateStats();
        this.updateProgress();
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.addActivity(`Deleted task: "${task.title}"`, 'Delete');

            this.renderTasks();
            this.updateStats();
            this.updateProgress();

            this.showNotification('🗑️ Task deleted successfully!');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle && newTitle.trim() && newTitle.trim() !== task.title) {
            const oldTitle = task.title;
            task.title = newTitle.trim();
            this.addActivity(`Edited task: "${oldTitle}" → "${task.title}"`, 'Edit');
            this.renderTasks();
            this.showNotification('✏️ Task updated successfully!');
        }
    }

    filterTasks(filter) {
        this.currentFilter = filter;

        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.renderTasks();
    }

    searchTasks() {
        this.currentSearch = document.getElementById('searchBox').value.toLowerCase();
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Apply search filter
        if (this.currentSearch) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(this.currentSearch) ||
                task.description.toLowerCase().includes(this.currentSearch)
            );
        }

        // Apply category filter
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'high':
            case 'medium':
            case 'low':
                filtered = filtered.filter(task => task.priority === this.currentFilter);
                break;
        }

        return filtered;
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const noTasksDiv = document.getElementById('noTasks');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            container.appendChild(noTasksDiv);
            return;
        }

        container.innerHTML = '';

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;

        const timeAgo = this.getTimeAgo(task.createdAt);

        div.innerHTML = `
                    <div class="task-header">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="priority-badge ${task.priority}">${task.priority}</div>
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-meta">
                        <span>Created ${timeAgo}</span>
                        ${task.completedAt ? `<span>Completed ${this.getTimeAgo(task.completedAt)}</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" onclick="taskManager.toggleTask(${task.id})">
                            ${task.completed ? '↩️ Reopen' : '✅ Complete'}
                        </button>
                        <button class="action-btn edit-btn" onclick="taskManager.editTask(${task.id})">✏️ Edit</button>
                        <button class="action-btn delete-btn" onclick="taskManager.deleteTask(${task.id})">🗑️ Delete</button>
                    </div>
                `;

        return div;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${percentage}% Complete (${completed}/${total})`;
    }

    addActivity(message, type) {
        const activity = {
            message,
            type,
            timestamp: new Date()
        };

        this.activityLog.unshift(activity);

        // Keep only last 50 activities
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }

        this.renderActivityLog();
    }

    renderActivityLog() {
        const container = document.getElementById('activityLog');
        container.innerHTML = '';

        this.activityLog.forEach(activity => {
            const div = document.createElement('div');
            div.className = 'activity-item';
            div.innerHTML = `
                        <div>${activity.message}</div>
                        <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
                    `;
            container.appendChild(div);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${type === 'error' ? '#f44336' : '#4CAF50'};
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    font-weight: bold;
                    z-index: 1000;
                    animation: slideInRight 0.3s ease-out;
                `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showCelebration(message) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = message;
        document.body.appendChild(celebration);

        setTimeout(() => celebration.remove(), 3000);
    }
}

// Initialize the application
const taskManager = new TaskManager();

// Global functions for onclick handlers
function addTask() {
    taskManager.addTask();
}

function filterTasks(filter) {
    taskManager.filterTasks(filter);
}

function searchTasks() {
    taskManager.searchTasks();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
document.head.appendChild(style);

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                addTask();
                break;
            case '/':
                e.preventDefault();
                document.getElementById('searchBox').focus();
                break;
        }
    }
});

// Add Enter key support for task input
document.getElementById('taskTitle').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
});
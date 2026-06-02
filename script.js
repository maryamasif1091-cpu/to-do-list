document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const errorMessage = document.getElementById('errorMessage');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Load tasks from local storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Render initial tasks
    renderTasks();

    // Event listeners for filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Add task event listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.add('show');
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }

    function addTask() {
        const text = taskInput.value.trim();

        // Validation: Empty Task
        if (text === '') {
            showError('Task cannot be empty!');
            return;
        }

        // Validation: Duplicate Task
        const isDuplicate = tasks.some(task => task.text.toLowerCase() === text.toLowerCase());
        if (isDuplicate) {
            showError('This task already exists!');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        taskInput.value = '';
        taskInput.focus();
    }

    function toggleTask(id) {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function editTask(id, currentText, li) {
        const taskContent = li.querySelector('.task-content');
        const originalHTML = taskContent.innerHTML;

        // Replace with input
        taskContent.innerHTML = `<input type="text" class="task-edit-input" value="${escapeHTML(currentText)}">`;
        const editInput = taskContent.querySelector('.task-edit-input');

        // Move cursor to end
        editInput.focus();
        const val = editInput.value;
        editInput.value = '';
        editInput.value = val;

        // Hide actions temporarily
        const actions = li.querySelector('.actions');
        actions.style.display = 'none';

        let isSaving = false;

        function saveEdit() {
            if (isSaving) return;
            isSaving = true;

            const newText = editInput.value.trim();

            // Validation
            if (newText === '') {
                showError('Task cannot be empty!');
                taskContent.innerHTML = originalHTML;
                actions.style.display = 'flex';
                return;
            }
            if (newText.toLowerCase() !== currentText.toLowerCase() && tasks.some(t => t.text.toLowerCase() === newText.toLowerCase())) {
                showError('This task already exists!');
                taskContent.innerHTML = originalHTML;
                actions.style.display = 'flex';
                return;
            }

            tasks = tasks.map(task =>
                task.id === id ? { ...task, text: newText } : task
            );
            saveTasks();
            renderTasks();
        }

        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });

        editInput.addEventListener('blur', saveEdit);
    }

    function deleteTask(id) {
        const li = document.querySelector(`li[data-id="${id}"]`);
        if (li) {
            li.style.animation = 'slideOut 0.3s ease forwards';

            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
            }, 300);
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';

        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        if (filteredTasks.length === 0) {
            let msg = 'No tasks yet. Add one above!';
            if (tasks.length > 0) {
                msg = currentFilter === 'active' ? 'No active tasks!' : 'No completed tasks yet!';
            }
            taskList.innerHTML = `
                <div class="empty-state">
                    ${msg}
                </div>
            `;
            return;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.setAttribute('data-id', task.id);
            if (task.completed) {
                li.classList.add('completed');
            }

            li.innerHTML = `
                <div class="task-content">
                    <div class="checkbox"></div>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                </div>
                <div class="actions">
                    <button class="edit-btn" aria-label="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Toggle events
            const checkbox = li.querySelector('.checkbox');
            const taskText = li.querySelector('.task-text');
            checkbox.addEventListener('click', () => toggleTask(task.id));
            taskText.addEventListener('click', () => toggleTask(task.id));

            // Edit event
            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(task.id, task.text, li);
            });

            // Delete event
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            taskList.appendChild(li);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});

// DOM Elements
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');

// Load existing tasks from Local Storage, or default to an empty array
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// Function to save tasks array to Local Storage
function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    toggleClearButton();
}

// Show or hide the "Clear All" button depending on task list size
function toggleClearButton() {
    if (tasks.length > 0) {
        clearAllBtn.classList.remove('hidden');
    } else {
        clearAllBtn.classList.add('hidden');
    }
}

// Function to render all tasks onto the screen
function renderTasks() {
    taskList.innerHTML = ''; // Clear current UI list
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group hover:border-slate-300 transition-colors";

        // Determine tag colors based on category
        let tagColor = "bg-blue-100 text-blue-800";
        if (task.category === "Personal") tagColor = "bg-green-100 text-green-800";
        if (task.category === "Urgent") tagColor = "bg-red-100 text-red-800";

        // Setup strike-through styling classes if completed
        const textStyle = task.completed ? 'line-through text-slate-400' : 'text-slate-700';
        const isChecked = task.completed ? 'checked' : '';

        li.innerHTML = `
            <div class="flex items-center gap-3">
                <input type="checkbox" ${isChecked} class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer checkbox-btn">
                <span class="task-text ${textStyle}">${task.text}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}">${task.category}</span>
            </div>
            <button class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 delete-btn">
                🗑️
            </button>
        `;

        // Checkbox Toggle Listener
        const checkbox = li.querySelector('.checkbox-btn');
        checkbox.addEventListener('change', () => {
            tasks[index].completed = checkbox.checked;
            saveTasks();
            renderTasks(); // Re-render to apply classes cleanly
        });

        // Individual Delete Button Listener
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            tasks.splice(index, 1); // Remove from array
            saveTasks();
            renderTasks();
        });

        taskList.appendChild(li);
    });

    toggleClearButton();
}

// Function to handle adding a brand new task
function addTask() {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    // Push new task object to global array
    tasks.push({
        text: taskText,
        category: category,
        completed: false
    });

    saveTasks();
    renderTasks();
    taskInput.value = ''; // Reset input field
}

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Clear All Functionality
clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = []; // Reset array
        saveTasks();
        renderTasks();
    }
});

// Initial load build out
renderTasks();
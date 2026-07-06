// DOM Element Registry
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressBar = document.getElementById('progressBar');
const statsText = document.getElementById('statsText');
const emptyState = document.getElementById('emptyState');
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');

// Application States
let tasks = JSON.parse(localStorage.getItem('zenTasks')) || [];
let currentFilter = 'all';
let soundEnabled = JSON.parse(localStorage.getItem('zenSound')) ?? true;

// Web Audio API Synthesizer Pipeline (No external files required!)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'add') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'complete') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5 node
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5 node
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'delete') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// Data Synchronizers
function saveTasks() {
    localStorage.setItem('zenTasks', JSON.stringify(tasks));
    updateMetrics();
}

// Metrics Engine
function updateMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    progressBar.style.width = `${percentage}%`;
    statsText.textContent = `${completed}/${total} completed`;

    if (total > 0) {
        clearAllBtn.classList.remove('hidden');
    } else {
        clearAllBtn.classList.add('hidden');
    }
}

// Advanced UI Tab Management
function updateTabUI() {
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === currentFilter) {
            btn.className = "flex-1 py-2 rounded-lg transition-all filter-btn bg-white text-indigo-600 shadow-sm";
        } else {
            btn.className = "flex-1 py-2 rounded-lg transition-all filter-btn text-slate-500 hover:text-slate-800 hover:bg-slate-200/50";
        }
    });
}

// Render Engine
function renderTasks() {
    taskList.innerHTML = '';
    let renderedCount = 0;
    
    tasks.forEach((task, index) => {
        if (currentFilter === 'active' && task.completed) return;
        if (currentFilter === 'completed' && !task.completed) return;

        renderedCount++;
        const li = document.createElement('li');
        li.className = "flex items-center justify-between p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl group hover:bg-white hover:border-indigo-100 transition-all duration-200";

        let tagColor = "bg-blue-50 text-blue-600 border border-blue-100";
        if (task.category === "Personal") tagColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
        if (task.category === "Urgent") tagColor = "bg-rose-50 text-rose-600 border border-rose-100";

        const textStyle = task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium';
        const isChecked = task.completed ? 'checked' : '';

        li.innerHTML = `
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <input type="checkbox" ${isChecked} class="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500/30 border-slate-300 cursor-pointer checkbox-btn transition-all">
                <span class="task-text truncate text-sm transition-all ${textStyle}">${task.text}</span>
                <span class="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md font-bold shrink-0 ${tagColor}">${task.category}</span>
            </div>
            <button class="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 p-1 ml-2 delete-btn transform scale-90 group-hover:scale-100">
                ✕
            </button>
        `;

        // Interactive Checkbox Engine
        const checkbox = li.querySelector('.checkbox-btn');
        checkbox.addEventListener('change', () => {
            tasks[index].completed = checkbox.checked;
            if (checkbox.checked) playSound('complete');
            saveTasks();
            renderTasks(); 
        });

        // Interactive Delete Engine
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            playSound('delete');
            tasks.splice(index, 1); 
            saveTasks();
            renderTasks();
        });

        taskList.appendChild(li);
    });

    // Handle Empty Placeholder States
    if (renderedCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    updateTabUI();
}

// Interactive Task Creation
function addTask() {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;

    if (taskText === '') return;

    tasks.unshift({ // Add items to top of list
        text: taskText,
        category: category,
        completed: false
    });

    playSound('add');
    saveTasks();
    renderTasks();
    taskInput.value = ''; 
}

// User Action Inbound Handlers
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear entire canvas?')) {
        tasks = []; 
        playSound('delete');
        saveTasks();
        renderTasks();
    }
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.getAttribute('data-filter');
        renderTasks();
    });
});

// Sound Configurations Manager
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('zenSound', JSON.stringify(soundEnabled));
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundToggle.className = soundEnabled 
        ? "text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-all text-xs flex items-center gap-1 font-medium"
        : "text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all text-xs flex items-center gap-1 font-medium";
    soundToggle.innerHTML = `<span>${soundEnabled ? '🔊' : '🔇'}</span> Sound ${soundEnabled ? 'On' : 'Off'}`;
});

// App Startup Bootstrapper
soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
updateMetrics();
renderTasks();
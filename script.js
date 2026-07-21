// DOM Element Registry
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const dateInput = document.getElementById('dateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const statsText = document.getElementById('statsText');
const radialCircle = document.getElementById('radialCircle');
const radialPercent = document.getElementById('radialPercent');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

// Gamification Registry
const streakBadge = document.getElementById('streakBadge');
const streakCount = document.getElementById('streakCount');
const focalTimerBanner = document.getElementById('focalTimerBanner');
const focalTaskPreview = document.getElementById('focalTaskPreview');
const timerClock = document.getElementById('timerClock');
const cancelFocalBtn = document.getElementById('cancelFocalBtn');
const bodyBg = document.getElementById('bodyBg');
const mainContainer = document.getElementById('mainContainer');
const brandLogo = document.getElementById('brandLogo');
const inputFormGroup = document.getElementById('inputFormGroup');
const filterTabs = document.getElementById('filterTabs');

// Insight Panel Registry
const insightsToggleBtn = document.getElementById('insightsToggleBtn');
const insightsPanel = document.getElementById('insightsPanel');
const closeInsightsBtn = document.getElementById('closeInsightsBtn');
const completionRateStat = document.getElementById('completionRateStat');
const topCategoryStat = document.getElementById('topCategoryStat');
const insightsReportText = document.getElementById('insightsReportText');

// Soundscape Registry
const soundscapeSelect = document.getElementById('soundscapeSelect');

// State Variables
let tasks = JSON.parse(localStorage.getItem('zenTasks')) || [];
let currentFilter = 'all';
let searchQuery = '';
let soundscape = localStorage.getItem('zenSoundscape') || 'arcade';
let activeFocalId = null;
let focalCountdown = null;
let secondsLeft = 60;
let streak = JSON.parse(localStorage.getItem('zenStreakScore')) || 0;
let expandedTaskId = null;
let draggedIndex = null;

const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
soundscapeSelect.value = soundscape;

// Web Audio Synthesizer
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (soundscape === 'silent') return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (soundscape === 'arcade') {
        if (type === 'add') {
            osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.setValueAtTime(450, now + 0.05);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'complete') {
            osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.06); osc.frequency.setValueAtTime(784, now + 0.12);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        } else if (type === 'delete') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(60, now + 0.12);
            gainNode.gain.setValueAtTime(0.06, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now); osc.stop(now + 0.12);
        }
    } else if (soundscape === 'zen') {
        osc.type = 'sine';
        if (type === 'add') {
            osc.frequency.setValueAtTime(642, now);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'complete') {
            osc.frequency.setValueAtTime(880, now);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            osc.start(now); osc.stop(now + 0.7);
        }
    } else if (soundscape === 'cyber') {
        osc.type = 'triangle';
        if (type === 'add') {
            osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);
            gainNode.gain.setValueAtTime(0.06, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'complete') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.setValueAtTime(2400, now + 0.05);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        }
    }
}

// Data Synchronizers
function saveTasks() {
    localStorage.setItem('zenTasks', JSON.stringify(tasks));
    localStorage.setItem('zenStreakScore', JSON.stringify(streak));
    updateMetrics();
    updateGamificationThemes();
    calculateInsights();
}

function updateMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    radialCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
    radialPercent.textContent = `${percentage}%`;
    statsText.textContent = `${completed}/${total} completed`;
    clearAllBtn.classList.toggle('hidden', total === 0);
}

function calculateInsights() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    completionRateStat.textContent = `${percentage}%`;

    if (total === 0) {
        topCategoryStat.textContent = "None";
        insightsReportText.textContent = `"Your canvas is clear. Add tasks to discover your workflow archetype."`;
        return;
    }

    const counts = {};
    let maxCat = "None";
    let maxCount = 0;
    
    tasks.forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
        if (counts[t.category] > maxCount) {
            maxCount = counts[t.category];
            maxCat = t.category;
        }
    });
    
    topCategoryStat.textContent = maxCat;

    if (percentage === 0) {
        insightsReportText.textContent = `"Plan mapped, but momentum stalled. Select a task, tap 🎯, and complete a sprint to launch focus momentum!"`;
    } else if (percentage < 50) {
        insightsReportText.textContent = `"Focus is currently heavy in ${maxCat}. Be mindful of backlog accumulating across other domains."`;
    } else {
        insightsReportText.textContent = `"High execution efficiency! You are maintaining firm control over your ${maxCat} priorities."`;
    }
}

function updateGamificationThemes() {
    if (streak === 0) {
        streakBadge.classList.add('hidden');
    } else {
        streakBadge.classList.remove('hidden');
        streakCount.textContent = streak;
    }
}

function updateTabUI() {
    filterButtons.forEach(btn => {
        const isCurrent = btn.getAttribute('data-filter') === currentFilter;
        btn.className = isCurrent 
            ? "px-3 py-1.5 rounded-lg transition-all filter-btn bg-indigo-600 text-white shadow-sm font-bold"
            : "px-3 py-1.5 rounded-lg transition-all filter-btn text-slate-400 hover:text-slate-200 hover:bg-slate-800/50";
    });
}

function triggerFocalFocus(task) {
    activeFocalId = task.id;
    secondsLeft = 60;
    focalTaskPreview.textContent = task.text;
    timerClock.textContent = `${secondsLeft}s`;
    
    focalTimerBanner.classList.remove('hidden');
    focalTimerBanner.classList.add('flex');
    
    inputFormGroup.classList.add('opacity-10', 'pointer-events-none');
    renderTasks();
}

function breakFocalStreak(failedChallenge = false) {
    clearInterval(focalCountdown);
    activeFocalId = null;
    focalTimerBanner.classList.add('hidden');
    focalTimerBanner.classList.remove('flex');
    
    inputFormGroup.classList.remove('opacity-10', 'pointer-events-none');

    if (failedChallenge) {
        streak = 0;
        playSound('delete');
        saveTasks();
    }
    renderTasks();
}

// Render Engine
function renderTasks() {
    taskList.innerHTML = '';
    let renderedCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    
    tasks.forEach((task, index) => {
        if (activeFocalId && task.id !== activeFocalId) return;

        // Apply tab filters
        if (!activeFocalId) {
            if (currentFilter === 'active' && task.completed) return;
            if (currentFilter === 'completed' && !task.completed) return;
        }

        // Apply search filtering
        if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
        }

        renderedCount++;
        const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
        const isExpanded = expandedTaskId === task.id;
        
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.index = index;
        li.className = `group flex flex-col border rounded-2xl overflow-hidden transition-all duration-200 ${
            activeFocalId ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20' :
            isOverdue ? 'bg-rose-950/30 border-rose-800/80 overdue-pulse shadow-lg shadow-rose-950/20' : 
            'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
        }`;

        let tagColor = "bg-blue-950/80 text-blue-400 border-blue-800/50";
        if (task.category === "Personal") tagColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800/50";
        if (task.category === "Urgent") tagColor = "bg-rose-950/80 text-rose-400 border-rose-800/50";

        const textStyle = task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-semibold';
        const isChecked = task.completed ? 'checked' : '';

        let dateBadge = '';
        if (task.dueDate) {
            const displayDate = new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
            dateBadge = isOverdue 
                ? `<span class="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">Overdue (${displayDate})</span>`
                : `<span class="text-[11px] text-slate-400">📅 ${displayDate}</span>`;
        }

        let subtasksHtml = '';
        (task.subtasks || []).forEach((sub, subIdx) => {
            const subDoneStyle = sub.completed ? 'line-through text-slate-500' : 'text-slate-300';
            const subChecked = sub.completed ? 'checked' : '';
            subtasksHtml += `
                <div class="flex items-center gap-2 text-xs py-1">
                    <input type="checkbox" ${subChecked} data-sub-idx="${subIdx}" class="subtask-checkbox w-3.5 h-3.5 accent-indigo-500 rounded cursor-pointer">
                    <span class="${subDoneStyle}">${sub.text}</span>
                </div>
            `;
        });

        li.innerHTML = `
            <div class="flex items-center justify-between p-3.5 cursor-pointer task-main-row select-none">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span class="text-slate-600 hover:text-slate-400 cursor-grab drag-handle text-xs font-bold">⋮⋮</span>
                    <input type="checkbox" ${isChecked} class="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer checkbox-btn transition-all shrink-0">
                    <div class="flex flex-col flex-1 min-w-0 gap-1">
                        <span class="task-text truncate text-sm transition-all ${textStyle}">${task.text}</span>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full font-extrabold border ${tagColor}">${task.category}</span>
                            ${dateBadge}
                            ${task.subtasks?.length ? `<span class="text-[10px] text-slate-400">📋 ${task.subtasks.filter(s=>s.completed).length}/${task.subtasks.length}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    ${(!task.completed && !activeFocalId) ? '<button title="Start Sprint" class="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all focal-target-btn text-xs">🎯</button>' : ''}
                    <button class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all delete-btn text-xs">✕</button>
                </div>
            </div>

            <!-- Expandable Drawer -->
            <div class="detail-drawer border-t border-slate-800/80 bg-slate-950/60 px-4 pb-4 pt-3 ${isExpanded ? 'block' : 'hidden'}">
                <div class="mb-3">
                    <p class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Subtasks Milestone Checklist</p>
                    <div class="space-y-1 subtasks-container">${subtasksHtml}</div>
                    <div class="flex gap-2 mt-2.5">
                        <input type="text" placeholder="Add milestone..." class="new-subtask-input flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                        <button class="add-subtask-btn bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs font-bold text-white rounded-lg transition-colors">+</button>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Context & Notes</p>
                    <textarea placeholder="Write context, links, or documentation..." class="task-notes-area w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 h-16 focus:outline-none focus:border-indigo-500 resize-none">${task.notes || ''}</textarea>
                </div>
            </div>
        `;

        // Add Drag and Drop Events
        li.addEventListener('dragstart', (e) => {
            draggedIndex = index;
            li.classList.add('dragging');
        });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.addEventListener('dragover', (e) => e.preventDefault());
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(li.dataset.index);
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                const movedItem = tasks.splice(draggedIndex, 1)[0];
                tasks.splice(targetIndex, 0, movedItem);
                saveTasks();
                renderTasks();
            }
        });

        const mainRow = li.querySelector('.task-main-row');
        const checkbox = li.querySelector('.checkbox-btn');
        const notesArea = li.querySelector('.task-notes-area');
        const newSubtaskInput = li.querySelector('.new-subtask-input');
        const addSubtaskBtn = li.querySelector('.add-subtask-btn');

        mainRow.addEventListener('click', (e) => {
            if (e.target.closest('input') || e.target.closest('button') || e.target.closest('.drag-handle')) return;
            expandedTaskId = expandedTaskId === task.id ? null : task.id;
            renderTasks();
        });

        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            if (checkbox.checked) {
                if (activeFocalId && task.id === activeFocalId) {
                    streak++;
                    clearInterval(focalCountdown);
                    activeFocalId = null;
                    breakFocalStreak(false);
                }
                playSound('complete');
            }
            saveTasks();
            renderTasks(); 
        });

        const focalBtn = li.querySelector('.focal-target-btn');
        if (focalBtn) {
            focalBtn.addEventListener('click', () => triggerFocalFocus(task));
        }

        li.querySelector('.delete-btn').addEventListener('click', () => {
            playSound('delete');
            if (activeFocalId && task.id === activeFocalId) breakFocalStreak(false);
            if (expandedTaskId === task.id) expandedTaskId = null;
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.querySelectorAll('.subtask-checkbox').forEach(box => {
            box.addEventListener('change', () => {
                const idx = parseInt(box.getAttribute('data-sub-idx'));
                task.subtasks[idx].completed = box.checked;
                if (box.checked) playSound('complete');
                saveTasks();
                renderTasks();
            });
        });

        const createSubtask = () => {
            const subText = newSubtaskInput.value.trim();
            if (!subText) return;
            if (!task.subtasks) task.subtasks = [];
            task.subtasks.push({ text: subText, completed: false });
            newSubtaskInput.value = '';
            playSound('add');
            saveTasks();
            renderTasks();
        };
        addSubtaskBtn.addEventListener('click', createSubtask);
        newSubtaskInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') createSubtask(); });

        notesArea.addEventListener('input', () => {
            task.notes = notesArea.value;
            localStorage.setItem('zenTasks', JSON.stringify(tasks));
        });

        taskList.appendChild(li);
    });

    emptyState.classList.toggle('hidden', renderedCount > 0);
    updateTabUI();
}

function addTask() {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = dateInput.value;

    if (taskText === '') return;

    tasks.unshift({
        id: Date.now().toString(),
        text: taskText,
        category: category,
        dueDate: dueDate || null,
        completed: false,
        subtasks: [],
        notes: ""
    });

    playSound('add');
    saveTasks();
    renderTasks();
    taskInput.value = '';
    dateInput.value = today;
}

// User Action Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
cancelFocalBtn.addEventListener('click', () => breakFocalStreak(true));

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
});

// Keyboard Shortcuts (Power-User Experience)
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    } else if (e.key === 'n' && document.activeElement !== taskInput && document.activeElement !== searchInput) {
        e.preventDefault();
        taskInput.focus();
    } else if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        document.activeElement.blur();
        renderTasks();
    }
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear entire executive workspace?')) {
        tasks = [];
        streak = 0;
        expandedTaskId = null;
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

soundscapeSelect.addEventListener('change', (e) => {
    soundscape = e.target.value;
    localStorage.setItem('zenSoundscape', soundscape);
    playSound('add');
});

insightsToggleBtn.addEventListener('click', () => {
    insightsPanel.classList.toggle('hidden');
    insightsPanel.classList.toggle('flex');
});
closeInsightsBtn.addEventListener('click', () => {
    insightsPanel.classList.add('hidden');
    insightsPanel.classList.remove('flex');
});

// Initialization
saveTasks();
renderTasks();
// DOM Element Registry
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const dateInput = document.getElementById('dateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressBar = document.getElementById('progressBar');
const statsText = document.getElementById('statsText');
const emptyState = document.getElementById('emptyState');

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

// SOUNDSCAPE REGISTRY (NEW FEATURE)
const soundscapeSelect = document.getElementById('soundscapeSelect');

// Application States
let tasks = JSON.parse(localStorage.getItem('zenTasks')) || [];
let currentFilter = 'all';
let soundscape = localStorage.getItem('zenSoundscape') || 'arcade'; // arcade, zen, cyber, silent
let activeFocalId = null;
let focalCountdown = null;
let secondsLeft = 60;
let streak = JSON.parse(localStorage.getItem('zenStreakScore')) || 0;
let expandedTaskId = null;

const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
soundscapeSelect.value = soundscape;

// Web Audio API Polyphonic Synthesizer Pipeline
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (soundscape === 'silent') return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    // AUDIO PROFILE SELECTOR DISPATCH MATRIX
    if (soundscape === 'arcade') {
        // High-energy 8-bit retro behaviors
        if (type === 'add') {
            osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.setValueAtTime(450, now + 0.05);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'complete') {
            osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.06); osc.frequency.setValueAtTime(784, now + 0.12);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        } else if (type === 'delete') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(60, now + 0.12);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now); osc.stop(now + 0.12);
        } else if (type === 'streak') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        } else if (type === 'fail') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.linearRampToValueAtTime(40, now + 0.4);
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        }
    } else if (soundscape === 'zen') {
        // Crystalline ambient metallic sound resonance architecture
        osc.type = 'sine';
        if (type === 'add') {
            osc.frequency.setValueAtTime(642, now);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'complete') {
            osc.frequency.setValueAtTime(880, now);
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            osc.start(now); osc.stop(now + 0.7);
        } else if (type === 'delete') {
            osc.frequency.setValueAtTime(311, now);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'streak') {
            osc.frequency.setValueAtTime(987, now);
            gainNode.gain.setValueAtTime(0.25, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc.start(now); osc.stop(now + 0.9);
        } else if (type === 'fail') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(180, now);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.start(now); osc.stop(now + 0.6);
        }
    } else if (soundscape === 'cyber') {
        // High-tech futuristic interface components
        osc.type = 'triangle';
        if (type === 'add') {
            osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'complete') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.setValueAtTime(2400, now + 0.05);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'delete') {
            osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(100, now + 0.08);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'streak') {
            osc.type = 'square'; osc.frequency.setValueAtTime(1500, now); osc.frequency.linearRampToValueAtTime(3000, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'fail') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(90, now);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
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
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    progressBar.style.width = `${percentage}%`;
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
        insightsReportText.textContent = `"Plan mapped, but momentum stalled. Choose a task, hit the 🎯 icon, and challenge yourself to build execution habits!"`;
    } else if (percentage < 50) {
        insightsReportText.textContent = `"You are focusing heavily on ${maxCat} issues. Be careful not to let backlog build up in other operational sectors."`;
    } else if (percentage < 100) {
        insightsReportText.textContent = `"Excellent balance. Your current focus velocity reveals high executive control over your ${maxCat} tasks."`;
    } else {
        insightsReportText.textContent = `"Flawless completion state achieved! You've completely dominated your dashboard. Your absolute focus is legendary."`;
    }
}

function updateGamificationThemes() {
    mainContainer.className = "bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transition-all duration-500 relative overflow-hidden";
    brandLogo.className = "text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent flex items-center gap-2 tracking-tight transition-all duration-500";
    
    if (streak === 0) {
        streakBadge.classList.add('hidden');
        brandLogo.classList.add('from-indigo-600', 'to-violet-600');
    } else {
        streakBadge.classList.remove('hidden');
        streakCount.textContent = streak;
        
        if (streak <= 2) {
            streakBadge.className = "text-[11px] font-black px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-amber-600 to-orange-600 tracking-wider shadow-sm";
            brandLogo.classList.add('from-amber-500', 'to-orange-600');
        } else if (streak <= 4) {
            mainContainer.classList.add('streak-cyan');
            streakBadge.className = "text-[11px] font-black px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-cyan-500 to-blue-600 tracking-wider shadow-sm";
            brandLogo.classList.add('from-cyan-500', 'to-blue-600');
        } else {
            mainContainer.classList.add('streak-gold');
            streakBadge.className = "text-[11px] font-black px-2 py-0.5 rounded-full text-slate-900 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 tracking-wider font-black animate-bounce";
            brandLogo.classList.add('from-yellow-500', 'to-amber-500');
        }
    }
}

function updateTabUI() {
    filterButtons.forEach(btn => {
        const isCurrent = btn.getAttribute('data-filter') === currentFilter;
        btn.className = isCurrent 
            ? "flex-1 py-2 rounded-lg transition-all filter-btn bg-white text-indigo-600 shadow-sm"
            : "flex-1 py-2 rounded-lg transition-all filter-btn text-slate-500 hover:text-slate-800 hover:bg-slate-200/50";
    });
}

function triggerFocalFocus(task) {
    activeFocalId = task.id;
    secondsLeft = 60;
    focalTaskPreview.textContent = task.text;
    timerClock.textContent = `${secondsLeft}s`;
    
    focalTimerBanner.classList.remove('hidden');
    focalTimerBanner.classList.add('flex');
    
    inputFormGroup.classList.add('opacity-10', 'pointer-events-none', 'scale-95');
    filterTabs.classList.add('opacity-10', 'pointer-events-none');
    bodyBg.className = "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans min-h-screen flex items-center justify-center p-4 transition-all duration-700";

    focalCountdown = setInterval(() => {
        secondsLeft--;
        timerClock.textContent = `${secondsLeft}s`;
        if (secondsLeft <= 10) timerClock.className = "text-lg font-mono font-black text-red-500 animate-ping";

        if (secondsLeft <= 0) {
            breakFocalStreak(true);
        }
    }, 1000);

    renderTasks();
}

function breakFocalStreak(failedChallenge = false) {
    clearInterval(focalCountdown);
    activeFocalId = null;
    focalTimerBanner.className = "bg-slate-900 text-white p-3 rounded-xl mb-6 hidden items-center justify-between shadow-lg border border-indigo-500/30 animate-pulse";
    timerClock.className = "text-lg font-mono font-black text-rose-400";
    
    inputFormGroup.className = "flex flex-col gap-3 mb-6 transition-all duration-300";
    filterTabs.className = "flex bg-slate-100/80 p-1 rounded-xl mb-4 text-xs font-semibold text-slate-500 transition-all duration-300";
    bodyBg.className = "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans min-h-screen flex items-center justify-center p-4 transition-all duration-700";

    if (failedChallenge) {
        streak = 0;
        playSound('fail');
        saveTasks();
        alert('Time expired! Your Zen Focus Streak broke.');
    }
    renderTasks();
}

// Render Engine
function renderTasks() {
    taskList.innerHTML = '';
    let renderedCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    
    tasks.forEach((task) => {
        if (activeFocalId && task.id !== activeFocalId) return;

        if (!activeFocalId) {
            if (currentFilter === 'active' && task.completed) return;
            if (currentFilter === 'completed' && !task.completed) return;
        }

        renderedCount++;
        const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
        const isExpanded = expandedTaskId === task.id;
        
        const li = document.createElement('li');
        li.className = `flex flex-col border rounded-xl overflow-hidden transition-all duration-200 ${
            activeFocalId ? 'bg-indigo-50/40 border-indigo-300 ring-4 ring-indigo-500/10' :
            isOverdue ? 'bg-rose-50/50 border-rose-200 overdue-pulse shadow-sm shadow-rose-100' : 
            'bg-slate-50/60 border-slate-100 hover:border-indigo-100'
        }`;

        let tagColor = "bg-blue-50 text-blue-600 border border-blue-100";
        if (task.category === "Personal") tagColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
        if (task.category === "Urgent") tagColor = "bg-rose-50 text-rose-600 border border-rose-100";

        const textStyle = task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium';
        const isChecked = task.completed ? 'checked' : '';

        let dateBadge = '';
        if (task.dueDate) {
            const displayDate = new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
            dateBadge = isOverdue 
                ? `<span class="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded shadow-sm">⚠️ OVERDUE (${displayDate})</span>`
                : `<span class="text-[11px] text-slate-400 font-normal">📅 ${displayDate}</span>`;
        }

        const targetBtnVisibility = (task.completed || activeFocalId) ? 'hidden' : 'inline-block';

        let subtasksHtml = '';
        (task.subtasks || []).forEach((sub, subIdx) => {
            const subDoneStyle = sub.completed ? 'line-through text-slate-400' : 'text-slate-600';
            const subChecked = sub.completed ? 'checked' : '';
            subtasksHtml += `
                <div class="flex items-center gap-2 text-xs py-0.5">
                    <input type="checkbox" ${subChecked} data-sub-idx="${subIdx}" class="subtask-checkbox w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500/20 cursor-pointer">
                    <span class="${subDoneStyle}">${sub.text}</span>
                </div>
            `;
        });

        li.innerHTML = `
            <div class="flex items-center justify-between p-3.5 cursor-pointer task-main-row select-none">
                <div class="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                    <input type="checkbox" ${isChecked} class="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 cursor-pointer checkbox-btn transition-all pointer-events-auto">
                    <div class="flex flex-col flex-1 min-w-0 gap-0.5">
                        <span class="task-text truncate text-sm transition-all ${textStyle}">${task.text}</span>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[9px] tracking-wide uppercase px-1.5 py-0.2 rounded font-bold shrink-0 ${tagColor}">${task.category}</span>
                            ${dateBadge}
                            ${task.subtasks?.length ? `<span class="text-[10px] text-slate-400 font-medium">📋 ${task.subtasks.filter(s=>s.completed).length}/${task.subtasks.length}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button title="Start 60s Focus Sprint" class="text-slate-300 hover:text-indigo-600 p-1 rounded transition-all transform hover:scale-110 focal-target-btn ${targetBtnVisibility}">
                        🎯
                    </button>
                    <button class="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 p-1 delete-btn transform scale-90 group-hover:scale-100">
                        ✕
                    </button>
                </div>
            </div>

            <div class="detail-drawer border-t border-slate-100 bg-slate-50/40 px-3.5 pb-4 pt-2 ${isExpanded ? 'block' : 'hidden'}">
                <div class="mb-3">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subtasks Checklist</p>
                    <div class="space-y-1 subtasks-container">${subtasksHtml}</div>
                    <div class="flex gap-1.5 mt-2">
                        <input type="text" placeholder="Add nested milestone..." class="new-subtask-input flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-400">
                        <button class="add-subtask-btn bg-slate-200 hover:bg-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 rounded transition-colors">+</button>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Context Blueprint</p>
                    <textarea placeholder="Write documentation, scratchpads, or links here..." class="task-notes-area w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-600 h-16 focus:outline-none focus:border-indigo-400 resize-none">${task.notes || ''}</textarea>
                </div>
            </div>
        `;

        const mainRow = li.querySelector('.task-main-row');
        const checkbox = li.querySelector('.checkbox-btn');
        const notesArea = li.querySelector('.task-notes-area');
        const newSubtaskInput = li.querySelector('.new-subtask-input');
        const addSubtaskBtn = li.querySelector('.add-subtask-btn');

        mainRow.addEventListener('click', (e) => {
            if (e.target.closest('input') || e.target.closest('button')) return;
            expandedTaskId = expandedTaskId === task.id ? null : task.id;
            renderTasks();
        });

        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            if (checkbox.checked) {
                if (activeFocalId && task.id === activeFocalId) {
                    streak++;
                    playSound('streak');
                    clearInterval(focalCountdown);
                    activeFocalId = null;
                    breakFocalStreak(false);
                } else {
                    playSound('complete');
                }
            }
            saveTasks();
            renderTasks(); 
        });

        if (!task.completed && !activeFocalId) {
            li.querySelector('.focal-target-btn').addEventListener('click', () => triggerFocalFocus(task));
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

// User Action Handlers
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
cancelFocalBtn.addEventListener('click', () => breakFocalStreak(true));

clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear entire canvas?')) {
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

// Soundscape Change Switcher Listener
soundscapeSelect.addEventListener('change', (e) => {
    soundscape = e.target.value;
    localStorage.setItem('zenSoundscape', soundscape);
    playSound('add'); // Quick preview ping on select change
});

// Insights Panel Toggle Interactions
insightsToggleBtn.addEventListener('click', () => {
    insightsPanel.classList.toggle('hidden');
    insightsPanel.classList.toggle('flex');
});
closeInsightsBtn.addEventListener('click', () => {
    insightsPanel.classList.add('hidden');
    insightsPanel.classList.remove('flex');
});

// App Startup Bootstrapper
saveTasks();
renderTasks();
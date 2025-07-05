class WorldDigitalClock {
    constructor() {
        this.is24HourFormat = localStorage.getItem('clockFormat') === '24' || true;
        this.theme = localStorage.getItem('clockTheme') || 'light';
        this.worldClocks = JSON.parse(localStorage.getItem('worldClocks')) || this.getDefaultClocks();
        this.alarms = JSON.parse(localStorage.getItem('clockAlarms')) || [];
        this.activeAlarms = new Set();
        
        // Stopwatch
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        
        // Timer
        this.timerTime = 0;
        this.timerInterval = null;
        this.timerRunning = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.updateFormatDisplay();
        this.populateTimezoneModal();
        this.renderWorldClocks();
        this.renderAlarms();
        this.startClockUpdates();
    }

    getDefaultClocks() {
        return [
            { id: 'utc', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
            { id: 'ny', city: 'New York', country: 'United States', timezone: 'America/New_York' },
            { id: 'tokyo', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
            { id: 'sydney', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' }
        ];
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Format toggle
        document.getElementById('format-toggle').addEventListener('click', () => {
            this.toggleFormat();
        });

        // Add timezone
        document.getElementById('add-timezone').addEventListener('click', () => {
            this.showTimezoneModal();
        });

        // Close modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideTimezoneModal();
        });

        // Modal backdrop click
        document.getElementById('timezone-modal').addEventListener('click', (e) => {
            if (e.target.id === 'timezone-modal') {
                this.hideTimezoneModal();
            }
        });

        // Timezone search
        document.getElementById('timezone-search').addEventListener('input', (e) => {
            this.filterTimezones(e.target.value);
        });

        // Stopwatch controls
        document.getElementById('stopwatch-start').addEventListener('click', () => {
            this.startStopwatch();
        });

        document.getElementById('stopwatch-stop').addEventListener('click', () => {
            this.stopStopwatch();
        });

        document.getElementById('stopwatch-reset').addEventListener('click', () => {
            this.resetStopwatch();
        });

        // Timer controls
        document.getElementById('timer-start').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('timer-pause').addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('timer-reset').addEventListener('click', () => {
            this.resetTimer();
        });

        // Alarm controls
        document.getElementById('add-alarm').addEventListener('click', () => {
            this.addAlarm();
        });

        // Timer input validation
        document.getElementById('timer-minutes').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (value > 59) e.target.value = 59;
            if (value < 0) e.target.value = 0;
        });

        document.getElementById('timer-seconds').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (value > 59) e.target.value = 59;
            if (value < 0) e.target.value = 0;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFormat();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.showTimezoneModal();
                        break;
                }
            }
        });
    }

    startClockUpdates() {
        this.updateAllClocks();
        setInterval(() => {
            this.updateAllClocks();
        }, 1000);
    }

    updateAllClocks() {
        this.updateMainClock();
        this.updateWorldClocks();
        this.updateTimeInfo();
        this.checkAlarms();
    }

    updateMainClock() {
        const now = new Date();
        const timeString = this.formatTime(now);
        const dateString = this.formatDate(now);
        const timezoneString = this.formatTimezone(now);

        document.getElementById('main-time').textContent = timeString.time;
        document.getElementById('main-period').textContent = timeString.period;
        document.getElementById('main-period').style.display = this.is24HourFormat ? 'none' : 'inline';
        document.getElementById('main-date').textContent = dateString;
        document.getElementById('main-timezone').textContent = timezoneString;
    }

    updateWorldClocks() {
        this.worldClocks.forEach(clock => {
            const clockElement = document.getElementById(`clock-${clock.id}`);
            if (clockElement) {
                const now = new Date();
                const timeInZone = new Date(now.toLocaleString("en-US", { timeZone: clock.timezone }));
                const timeString = this.formatTime(timeInZone);
                const dateString = this.formatDate(timeInZone);
                const timezoneOffset = this.getTimezoneOffset(clock.timezone);

                const timeEl = clockElement.querySelector('.clock-time');
                const dateEl = clockElement.querySelector('.clock-date');
                const timezoneEl = clockElement.querySelector('.clock-timezone');

                if (timeEl) {
                    if (this.is24HourFormat) {
                        timeEl.textContent = timeString.time;
                    } else {
                        timeEl.textContent = `${timeString.time} ${timeString.period}`;
                    }
                }
                if (dateEl) dateEl.textContent = dateString;
                if (timezoneEl) timezoneEl.textContent = timezoneOffset;
            }
        });
    }

    updateTimeInfo() {
        const now = new Date();
        
        // UTC Time
        const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        document.getElementById('utc-time').textContent = this.formatTime(utcTime).time;
        
        // Unix Timestamp
        document.getElementById('unix-timestamp').textContent = Math.floor(now.getTime() / 1000);
        
        // Day of Year
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        document.getElementById('day-of-year').textContent = dayOfYear;
        
        // Week Number
        const weekNumber = this.getWeekNumber(now);
        document.getElementById('week-number').textContent = weekNumber;
    }

    formatTime(date) {
        if (this.is24HourFormat) {
            return {
                time: date.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                }),
                period: ''
            };
        } else {
            const timeString = date.toLocaleTimeString('en-US', { 
                hour12: true, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            const [time, period] = timeString.split(' ');
            return { time, period };
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTimezone(date) {
        const offset = -date.getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getTimezoneOffset(timezone) {
        const now = new Date();
        const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        const timeInZone = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
        const offset = (timeInZone.getTime() - utc.getTime()) / (1000 * 60 * 60);
        
        const hours = Math.floor(Math.abs(offset));
        const minutes = Math.abs(offset % 1) * 60;
        const sign = offset >= 0 ? '+' : '-';
        
        return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('clockTheme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleFormat() {
        this.is24HourFormat = !this.is24HourFormat;
        localStorage.setItem('clockFormat', this.is24HourFormat ? '24' : '12');
        this.updateFormatDisplay();
    }

    updateFormatDisplay() {
        document.getElementById('format-toggle').textContent = this.is24HourFormat ? '24H' : '12H';
    }

    showTimezoneModal() {
        document.getElementById('timezone-modal').classList.add('show');
        document.getElementById('timezone-search').focus();
    }

    hideTimezoneModal() {
        document.getElementById('timezone-modal').classList.remove('show');
        document.getElementById('timezone-search').value = '';
        this.filterTimezones('');
    }

    populateTimezoneModal() {
        const popularTimezones = [
            { city: 'New York', timezone: 'America/New_York', country: 'United States' },
            { city: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'United States' },
            { city: 'London', timezone: 'Europe/London', country: 'United Kingdom' },
            { city: 'Paris', timezone: 'Europe/Paris', country: 'France' },
            { city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
            { city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
            { city: 'Dubai', timezone: 'Asia/Dubai', country: 'United Arab Emirates' },
            { city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' }
        ];

        const allTimezones = [
            // Americas
            { city: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
            { city: 'Chicago', timezone: 'America/Chicago', country: 'United States' },
            { city: 'Denver', timezone: 'America/Denver', country: 'United States' },
            { city: 'Mexico City', timezone: 'America/Mexico_City', country: 'Mexico' },
            { city: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil' },
            { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
            
            // Europe
            { city: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
            { city: 'Rome', timezone: 'Europe/Rome', country: 'Italy' },
            { city: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain' },
            { city: 'Amsterdam', timezone: 'Europe/Amsterdam', country: 'Netherlands' },
            { city: 'Stockholm', timezone: 'Europe/Stockholm', country: 'Sweden' },
            { city: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
            
            // Asia
            { city: 'Beijing', timezone: 'Asia/Shanghai', country: 'China' },
            { city: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
            { city: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
            { city: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
            { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'Hong Kong' },
            
            // Africa & Others
            { city: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt' },
            { city: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa' },
            { city: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand' }
        ];

        this.renderTimezoneOptions('popular-timezones', popularTimezones);
        this.renderTimezoneOptions('all-timezones', allTimezones);
    }

    renderTimezoneOptions(containerId, timezones) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        timezones.forEach(tz => {
            const option = document.createElement('button');
            option.className = 'timezone-option';
            option.textContent = `${tz.city}, ${tz.country}`;
            option.addEventListener('click', () => {
                this.addWorldClock(tz);
            });
            container.appendChild(option);
        });
    }

    filterTimezones(query) {
        const options = document.querySelectorAll('.timezone-option');
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            option.style.display = matches ? 'block' : 'none';
        });
    }

    addWorldClock(timezone) {
        const id = `clock_${Date.now()}`;
        const newClock = {
            id,
            city: timezone.city,
            country: timezone.country,
            timezone: timezone.timezone
        };

        // Check if timezone already exists
        const exists = this.worldClocks.some(clock => clock.timezone === timezone.timezone);
        if (exists) {
            this.showNotification('This timezone is already added!', 'warning');
            return;
        }

        this.worldClocks.push(newClock);
        localStorage.setItem('worldClocks', JSON.stringify(this.worldClocks));
        this.renderWorldClocks();
        this.hideTimezoneModal();
        this.showNotification(`${timezone.city} clock added!`, 'success');
    }

    renderWorldClocks() {
        const container = document.getElementById('clocks-grid');
        container.innerHTML = '';

        this.worldClocks.forEach(clock => {
            const clockElement = document.createElement('div');
            clockElement.className = 'clock-item slide-in';
            clockElement.id = `clock-${clock.id}`;
            
            clockElement.innerHTML = `
                <div class="clock-header">
                    <div>
                        <div class="clock-city">${clock.city}</div>
                        <div class="clock-country">${clock.country}</div>
                    </div>
                    <button class="remove-clock" onclick="worldClock.removeWorldClock('${clock.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="clock-time">--:--:--</div>
                <div class="clock-date">Loading...</div>
                <div class="clock-timezone">--</div>
            `;
            
            container.appendChild(clockElement);
        });
    }

    removeWorldClock(id) {
        this.worldClocks = this.worldClocks.filter(clock => clock.id !== id);
        localStorage.setItem('worldClocks', JSON.stringify(this.worldClocks));
        this.renderWorldClocks();
        this.showNotification('Clock removed!', 'success');
    }

    // Stopwatch functionality
    startStopwatch() {
        if (!this.stopwatchRunning) {
            this.stopwatchRunning = true;
            const startTime = Date.now() - this.stopwatchTime;
            
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime = Date.now() - startTime;
                this.updateStopwatchDisplay();
            }, 10);
            
            document.getElementById('stopwatch-start').textContent = 'Running...';
            document.getElementById('stopwatch-start').disabled = true;
        }
    }

    stopStopwatch() {
        if (this.stopwatchRunning) {
            this.stopwatchRunning = false;
            clearInterval(this.stopwatchInterval);
            document.getElementById('stopwatch-start').textContent = 'Start';
            document.getElementById('stopwatch-start').disabled = false;
        }
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.updateStopwatchDisplay();
    }

    updateStopwatchDisplay() {
        const time = new Date(this.stopwatchTime);
        const minutes = time.getUTCMinutes().toString().padStart(2, '0');
        const seconds = time.getUTCSeconds().toString().padStart(2, '0');
        const milliseconds = Math.floor(time.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        
        document.getElementById('stopwatch-display').textContent = `${minutes}:${seconds}:${milliseconds}`;
    }

    // Timer functionality
    startTimer() {
        if (!this.timerRunning) {
            const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
            
            if (this.timerTime === 0) {
                this.timerTime = (minutes * 60 + seconds) * 1000;
            }
            
            if (this.timerTime <= 0) {
                this.showNotification('Please set a valid timer duration!', 'warning');
                return;
            }
            
            this.timerRunning = true;
            
            this.timerInterval = setInterval(() => {
                this.timerTime -= 1000;
                this.updateTimerDisplay();
                
                if (this.timerTime <= 0) {
                    this.timerComplete();
                }
            }, 1000);
            
            document.getElementById('timer-start').textContent = 'Running...';
            document.getElementById('timer-start').disabled = true;
        }
    }

    pauseTimer() {
        if (this.timerRunning) {
            this.timerRunning = false;
            clearInterval(this.timerInterval);
            document.getElementById('timer-start').textContent = 'Start';
            document.getElementById('timer-start').disabled = false;
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.timerTime = 0;
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 5;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay() {
        const totalSeconds = Math.ceil(this.timerTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    timerComplete() {
        this.pauseTimer();
        this.timerTime = 0;
        this.resetTimer();
        this.playAlarmSound();
        this.showNotification('Timer finished!', 'success');
        
        // Flash the timer display
        const display = document.getElementById('timer-display');
        display.style.animation = 'glow 0.5s ease-in-out 6 alternate';
        setTimeout(() => {
            display.style.animation = '';
        }, 3000);
    }

    // Alarm functionality
    addAlarm() {
        const timeInput = document.getElementById('alarm-time').value;
        const labelInput = document.getElementById('alarm-label').value;
        
        if (!timeInput) {
            this.showNotification('Please set an alarm time!', 'warning');
            return;
        }
        
        const alarm = {
            id: Date.now(),
            time: timeInput,
            label: labelInput || 'Alarm',
            enabled: true
        };
        
        this.alarms.push(alarm);
        localStorage.setItem('clockAlarms', JSON.stringify(this.alarms));
        this.renderAlarms();
        this.showNotification('Alarm added!', 'success');
        
        // Clear inputs
        document.getElementById('alarm-time').value = '';
        document.getElementById('alarm-label').value = '';
    }

    renderAlarms() {
        const container = document.getElementById('alarms-list');
        container.innerHTML = '';
        
        if (this.alarms.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--light-color); font-style: italic;">No alarms set</p>';
            return;
        }
        
        this.alarms.forEach(alarm => {
            const alarmElement = document.createElement('div');
            alarmElement.className = 'alarm-item slide-in';
            
            alarmElement.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-time">${this.formatAlarmTime(alarm.time)}</div>
                    <div class="alarm-label">${alarm.label}</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="alarm-toggle ${alarm.enabled ? '' : 'disabled'}" 
                            onclick="worldClock.toggleAlarm(${alarm.id})">
                        ${alarm.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button class="remove-clock" onclick="worldClock.removeAlarm(${alarm.id})" 
                            style="position: static; opacity: 1;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(alarmElement);
        });
    }

    formatAlarmTime(time24) {
        if (this.is24HourFormat) {
            return time24;
        } else {
            const [hours, minutes] = time24.split(':');
            const hour12 = hours % 12 || 12;
            const period = hours >= 12 ? 'PM' : 'AM';
            return `${hour12}:${minutes} ${period}`;
        }
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            localStorage.setItem('clockAlarms', JSON.stringify(this.alarms));
            this.renderAlarms();
        }
    }

    removeAlarm(id) {
        this.alarms = this.alarms.filter(a => a.id !== id);
        this.activeAlarms.delete(id);
        localStorage.setItem('clockAlarms', JSON.stringify(this.alarms));
        this.renderAlarms();
        this.showNotification('Alarm removed!', 'success');
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        this.alarms.forEach(alarm => {
            if (alarm.enabled && alarm.time === currentTime && !this.activeAlarms.has(alarm.id)) {
                this.triggerAlarm(alarm);
                this.activeAlarms.add(alarm.id);
                
                // Remove from active alarms after 1 minute to allow re-triggering
                setTimeout(() => {
                    this.activeAlarms.delete(alarm.id);
                }, 60000);
            }
        });
    }

    triggerAlarm(alarm) {
        this.playAlarmSound();
        this.showNotification(`🔔 ${alarm.label} - ${this.formatAlarmTime(alarm.time)}`, 'success');
        
        // Flash the page
        document.body.style.animation = 'glow 0.5s ease-in-out 6 alternate';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 3000);
    }

    playAlarmSound() {
        const audio = document.getElementById('alarm-sound');
        audio.currentTime = 0;
        audio.play().catch(e => {
            console.log('Could not play alarm sound:', e);
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translate

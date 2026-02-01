class CountdownTimer {
    constructor() {
        this.timerInterval = null;
        this.isRunning = false;
        this.currentTimer = 1;
        this.remainingTime = 0;
        this.timerDurations = [0]; // Array to store all timer durations
        this.timerCount = 1; // Start with 1 timer
        this.timerNames = ['Timer 1']; // Array to store timer names
        
        // Get DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.millisecondsDisplay = document.getElementById('millisecondsDisplay');
        this.currentTimerLabel = document.getElementById('currentTimerLabel');
        this.timeDisplayBack = document.getElementById('timeDisplayBack');
        this.millisecondsDisplayBack = document.getElementById('millisecondsDisplayBack');
        this.currentTimerLabelBack = document.getElementById('currentTimerLabelBack');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.flipContainer = document.querySelector('.flip-container');
        this.flipper = document.getElementById('flipper');
        this.timerSetup = document.querySelector('.timer-setup');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.screenFlash = document.getElementById('screenFlash');
        this.pulseRing = document.getElementById('pulseRing');
        this.sandTop = document.getElementById('sandTop');
        this.sandBottom = document.getElementById('sandBottom');
        this.additionalTimers = document.getElementById('additionalTimers');
        this.addTimerBtn = document.getElementById('addTimerBtn');
        
        // Timer 1 inputs
        this.timer1Minutes = document.getElementById('timer1Minutes');
        this.timer1Seconds = document.getElementById('timer1Seconds');
        
        // Timer sections
        this.timer1Section = document.getElementById('timer1Section');
        
        this.initializeEventListeners();
        this.updateDisplay();
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.addTimerBtn.addEventListener('click', () => this.addTimer());
        
        // Input changes for Timer 1
        [this.timer1Minutes, this.timer1Seconds].forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            } else if (e.code === 'KeyR') {
                this.reset();
            }
        });
    }
    
    showFlipContainer(showHourglass = true) {
        this.flipContainer.classList.add('show');
        this.timerSetup.style.display = 'none';
        
        if (showHourglass) {
            this.flipContainer.classList.remove('flipped');
        } else {
            this.flipContainer.classList.add('flipped');
        }
    }
    
    hideFlipContainer() {
        this.flipContainer.classList.remove('show');
        this.timerSetup.style.display = 'block';
    }
    
    updateBackDisplay() {
        if (this.timeDisplayBack && this.millisecondsDisplayBack && this.currentTimerLabelBack) {
            this.timeDisplayBack.textContent = this.timeDisplay.textContent;
            this.millisecondsDisplayBack.textContent = this.millisecondsDisplay.textContent;
            this.currentTimerLabelBack.textContent = this.currentTimerLabel.textContent;
            
            // Update progress bar
            const progress = (this.remainingTime / this.getInitialDuration()) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `${Math.round(progress)}%`;
        }
    }
    
    editTimerName(timerNumber) {
        const nameElement = document.getElementById(`timer${timerNumber}Name`);
        const currentName = this.timerNames[timerNumber - 1];
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'timer-name-input';
        input.maxLength = 20;
        
        // Replace h3 with input
        nameElement.classList.add('editing');
        nameElement.parentNode.insertBefore(input, nameElement.nextSibling);
        input.focus();
        input.select();
        
        // Handle save on enter or blur
        const saveName = () => {
            const newName = input.value.trim() || `Timer ${timerNumber}`;
            this.timerNames[timerNumber - 1] = newName;
            nameElement.textContent = newName;
            nameElement.classList.remove('editing');
            input.remove();
            
            // Update current timer label if this timer is active
            if (this.currentTimer === timerNumber) {
                this.currentTimerLabel.textContent = newName;
            }
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveName();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                nameElement.classList.remove('editing');
                input.remove();
            }
        });
        
        input.addEventListener('blur', saveName);
    }
    
    addTimer() {
        this.timerCount++;
        const timerNumber = this.timerCount;
        const timerName = `Timer ${timerNumber}`;
        this.timerNames.push(timerName);
        
        // Create timer section HTML
        const timerSection = document.createElement('div');
        timerSection.className = 'timer-section dynamic';
        timerSection.id = `timer${timerNumber}Section`;
        
        timerSection.innerHTML = `
            <button class="remove-timer-btn" onclick="timerInstance.removeTimer(${timerNumber})">×</button>
            <div class="timer-header">
                <h3 class="timer-name" id="timer${timerNumber}Name">${timerName}</h3>
                <button class="edit-timer-btn" onclick="timerInstance.editTimerName(${timerNumber})" title="Edit timer name">✏️</button>
            </div>
            <div class="input-group">
                <input type="number" id="timer${timerNumber}Minutes" min="0" max="59" value="0" placeholder="Minutes" class="large-input">
                <span class="separator">:</span>
                <input type="number" id="timer${timerNumber}Seconds" min="0" max="59" value="0" placeholder="Seconds" class="large-input">
            </div>
        `;
        
        this.additionalTimers.appendChild(timerSection);
        
        // Add to durations array
        this.timerDurations.push(0);
        
        // Add event listeners to new inputs
        const minutesInput = document.getElementById(`timer${timerNumber}Minutes`);
        const secondsInput = document.getElementById(`timer${timerNumber}Seconds`);
        
        [minutesInput, secondsInput].forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
        });
        
        // Update button text
        this.addTimerBtn.textContent = `+ Add Timer (${this.timerCount + 1})`;
    }
    
    removeTimer(timerNumber) {
        if (this.timerCount <= 1) return; // Can't remove the last timer
        
        const timerSection = document.getElementById(`timer${timerNumber}Section`);
        if (timerSection) {
            timerSection.remove();
        }
        
        // Remove from arrays and reindex
        this.timerDurations.splice(timerNumber - 1, 1);
        this.timerNames.splice(timerNumber - 1, 1);
        this.timerCount--;
        
        // Renumber remaining timers
        this.renumberTimers();
        
        // Update button text
        this.addTimerBtn.textContent = `+ Add Timer (${this.timerCount + 1})`;
    }
    
    renumberTimers() {
        const sections = this.additionalTimers.querySelectorAll('.timer-section');
        sections.forEach((section, index) => {
            const newNumber = index + 2; // Start from 2 since Timer 1 is fixed
            const newName = this.timerNames[index + 1];
            
            section.id = `timer${newNumber}Section`;
            section.querySelector('.timer-name').textContent = newName;
            section.querySelector('.timer-name').id = `timer${newNumber}Name`;
            
            const removeBtn = section.querySelector('.remove-timer-btn');
            removeBtn.setAttribute('onclick', `timerInstance.removeTimer(${newNumber})`);
            
            const editBtn = section.querySelector('.edit-timer-btn');
            editBtn.setAttribute('onclick', `timerInstance.editTimerName(${newNumber})`);
            
            const minutesInput = section.querySelector(`input[id$="Minutes"]`);
            const secondsInput = section.querySelector(`input[id$="Seconds"]`);
            
            minutesInput.id = `timer${newNumber}Minutes`;
            secondsInput.id = `timer${newNumber}Seconds`;
        });
    }
    
    validateInput(input) {
        const max = parseInt(input.max);
        const min = parseInt(input.min);
        let value = parseInt(input.value);
        
        if (isNaN(value)) value = min;
        if (value > max) value = max;
        if (value < min) value = min;
        
        input.value = value;
    }
    
    getTimerDuration(timerNumber) {
        if (timerNumber === 1) {
            return parseInt(this.timer1Minutes.value) * 60 * 1000 + 
                   parseInt(this.timer1Seconds.value) * 1000;
        } else {
            const minutesInput = document.getElementById(`timer${timerNumber}Minutes`);
            const secondsInput = document.getElementById(`timer${timerNumber}Seconds`);
            
            if (minutesInput && secondsInput) {
                return parseInt(minutesInput.value) * 60 * 1000 + 
                       parseInt(secondsInput.value) * 1000;
            }
            return 0;
        }
    }
    
    start() {
        if (!this.isRunning) {
            if (this.remainingTime === 0) {
                // Collect all timer durations
                this.timerDurations = [];
                for (let i = 1; i <= this.timerCount; i++) {
                    this.timerDurations.push(this.getTimerDuration(i));
                }
                
                this.remainingTime = this.timerDurations[0];
                this.currentTimer = 1;
                
                // Initialize hourglass
                this.resetHourglass();
                
                // Show flip container with hourglass
                this.showFlipContainer(true);
            }
            
            if (this.remainingTime > 0) {
                this.startTime = Date.now() - (this.getInitialDuration() - this.remainingTime);
                this.timerInterval = setInterval(() => this.updateTimer(), 10);
                this.isRunning = true;
                
                this.startBtn.disabled = true;
                this.pauseBtn.disabled = false;
                this.disableInputs(true);
                this.updateActiveTimerSection();
            }
        }
    }
    
    pause() {
        if (this.isRunning) {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }
    
    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.remainingTime = 0;
        this.currentTimer = 1;
        
        this.timeDisplay.textContent = '00:00:30';
        this.millisecondsDisplay.textContent = '.000';
        this.currentTimerLabel.textContent = this.timerNames[0];
        
        // Reset hourglass
        this.resetHourglass();
        
        // Hide flip container and show timer setup
        this.hideFlipContainer();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        this.disableInputs(false);
        this.updateActiveTimerSection();
        this.hideNotification();
        
        // Reset timer display warning
        document.querySelector('.timer-display').classList.remove('warning');
    }
    
    resetHourglass() {
        this.sandTop.style.height = '100%';
        this.sandBottom.style.height = '0%';
    }
    
    disableInputs(disabled) {
        // Disable Timer 1 inputs
        [this.timer1Minutes, this.timer1Seconds].forEach(input => {
            input.disabled = disabled;
        });
        
        // Disable additional timer inputs
        for (let i = 2; i <= this.timerCount; i++) {
            const minutesInput = document.getElementById(`timer${i}Minutes`);
            const secondsInput = document.getElementById(`timer${i}Seconds`);
            
            if (minutesInput) minutesInput.disabled = disabled;
            if (secondsInput) secondsInput.disabled = disabled;
        }
        
        this.addTimerBtn.disabled = disabled;
    }
    
    updateActiveTimerSection() {
        // Reset all timer sections
        this.timer1Section.classList.remove('active');
        
        const sections = this.additionalTimers.querySelectorAll('.timer-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Highlight current timer
        if (this.currentTimer === 1) {
            this.timer1Section.classList.add('active');
        } else {
            const currentSection = document.getElementById(`timer${this.currentTimer}Section`);
            if (currentSection) {
                currentSection.classList.add('active');
            }
        }
    }
    
    getInitialDuration() {
        return this.timerDurations[this.currentTimer - 1] || 0;
    }
    
    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        this.remainingTime = Math.max(0, this.getInitialDuration() - elapsed);
        
        if (this.remainingTime === 0) {
            this.handleTimerComplete();
        } else {
            this.updateDisplay();
            this.updateHourglass();
            
            // Add warning when less than 5 seconds
            if (this.remainingTime <= 5000) {
                document.querySelector('.timer-display').classList.add('warning');
            }
        }
    }
    
    updateDisplay() {
        const totalMilliseconds = this.remainingTime;
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hours = Math.floor(minutes / 60);
        const displayMinutes = minutes % 60;
        let milliseconds = totalMilliseconds % 1000;
        
        // When timer is complete, show .000
        if (this.remainingTime === 0) {
            milliseconds = 0;
        } else {
            // Round milliseconds to nearest 10 for cleaner display
            milliseconds = Math.round(milliseconds / 10) * 10;
        }
        
        const timeString = this.formatTime(hours, displayMinutes, seconds);
        const millisecondsString = this.formatMilliseconds(milliseconds);
        
        this.timeDisplay.textContent = timeString;
        this.millisecondsDisplay.textContent = millisecondsString;
        
        // Update back display if flip container is visible
        if (this.flipContainer.classList.contains('show')) {
            this.updateBackDisplay();
        }
    }
    
    updateHourglass() {
        const progress = this.remainingTime / this.getInitialDuration();
        const topHeight = progress * 100;
        const bottomHeight = (1 - progress) * 100;
        
        this.sandTop.style.height = `${topHeight}%`;
        this.sandBottom.style.height = `${bottomHeight}%`;
    }
    
    handleTimerComplete() {
        clearInterval(this.timerInterval);
        
        // Reset warning state
        document.querySelector('.timer-display').classList.remove('warning');
        
        // Update display to show .000 milliseconds
        this.updateDisplay();
        
        // Check if there are more timers to run
        if (this.currentTimer < this.timerCount && this.timerDurations[this.currentTimer] > 0) {
            // Start next timer
            const nextTimerName = this.timerNames[this.currentTimer];
            this.showNotification(`${this.timerNames[this.currentTimer - 1]} complete! Starting ${nextTimerName}...`);
            this.playNotificationSound();
            this.currentTimer++;
            this.remainingTime = this.timerDurations[this.currentTimer - 1];
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => this.updateTimer(), 10);
            this.updateActiveTimerSection();
            this.currentTimerLabel.textContent = this.timerNames[this.currentTimer - 1];
            
            // Reset hourglass for next timer
            this.resetHourglass();
        } else {
            // All timers complete
            this.isRunning = false;
            this.showNotification('All timers complete!');
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.disableInputs(false);
            this.updateActiveTimerSection();
            
            // Play notification sound (if supported)
            this.playNotificationSound();
        }
    }
    
    formatTime(hours, minutes, seconds) {
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }
    
    formatMilliseconds(milliseconds) {
        return `.${this.pad(milliseconds, 3)}`;
    }
    
    pad(number, digits = 2) {
        return number.toString().padStart(digits, '0');
    }
    
    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.style.display = 'block';
        
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }
    
    hideNotification() {
        this.notification.style.display = 'none';
    }
    
    playNotificationSound() {
        // Create visual notification effects instead of audio
        this.createVisualNotificationEffects();
    }
    
    createVisualNotificationEffects() {
        // Create 3 visual pulses with timing similar to the original beeps
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.triggerVisualPulse();
            }, i * 600); // 600ms between pulses
        }
    }
    
    triggerVisualPulse() {
        // Screen flash effect
        this.screenFlash.classList.add('active');
        setTimeout(() => {
            this.screenFlash.classList.remove('active');
        }, 600);
        
        // Pulse ring effect
        this.pulseRing.classList.add('active');
        setTimeout(() => {
            this.pulseRing.classList.remove('active');
        }, 1500);
        
        // Container glow effect
        document.querySelector('.container').classList.add('notification-active');
        setTimeout(() => {
            document.querySelector('.container').classList.remove('notification-active');
        }, 800);
        
        // Timer display color cycling
        document.querySelector('.timer-display').classList.add('notification-active');
        setTimeout(() => {
            document.querySelector('.timer-display').classList.remove('notification-active');
        }, 1200);
        
        // Enhanced notification animation
        this.notification.classList.add('notification-active');
        setTimeout(() => {
            this.notification.classList.remove('notification-active');
        }, 600);
    }
}

// Initialize the countdown timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.timerInstance = new CountdownTimer();
});

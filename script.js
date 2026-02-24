// Intel Sustainability Summit Check-In System
// Features: Attendee tracking, team statistics, progress bar, localStorage persistence, celebration modal

const MAX_ATTENDEES = 50;
const STORAGE_KEY = 'intelSustainabilityAttendees';

// State management
let attendees = [];

// DOM Element References
const elements = {
  form: document.getElementById('checkInForm'),
  nameInput: document.getElementById('attendeeName'),
  teamSelect: document.getElementById('teamSelect'),
  greeting: document.getElementById('greeting'),
  totalCount: document.getElementById('attendeeCount'),
  progressBar: document.getElementById('progressBar'),
  waterCount: document.getElementById('waterCount'),
  zeroCount: document.getElementById('zeroCount'),
  powerCount: document.getElementById('powerCount'),
  container: document.querySelector('.container')
};

// Team display names mapping
const TEAM_NAMES = {
  water: 'Team Water Wise',
  zero: 'Team Net Zero',
  power: 'Team Renewables'
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  createAttendeeListSection();
  updateUI();
  injectDynamicStyles();
});

// Event Listeners
elements.form.addEventListener('submit', handleCheckIn);

// Core Functions

function handleCheckIn(e) {
  e.preventDefault();
  
  const name = elements.nameInput.value.trim();
  const team = elements.teamSelect.value;
  
  // Validation
  if (!name || !team) {
    showGreeting('Please enter your name and select a team.', 'error');
    return;
  }
  
  if (attendees.length >= MAX_ATTENDEES) {
    showGreeting('Maximum capacity reached! No more check-ins allowed.', 'error');
    return;
  }
  
  // Check for duplicates
  if (attendees.some(a => a.name.toLowerCase() === name.toLowerCase())) {
    showGreeting('This attendee has already checked in!', 'error');
    return;
  }
  
  // Add attendee
  attendees.push({ name, team, timestamp: new Date().toISOString() });
  saveToLocalStorage();
  
  // Show personalized greeting
  showGreeting(`Welcome, ${name}! You've successfully joined ${TEAM_NAMES[team]}. 🎉`, 'success');
  
  // Clear form
  elements.nameInput.value = '';
  elements.teamSelect.value = '';
  elements.nameInput.focus();
  
  // Update display
  updateUI();
  
  // Check for goal completion
  if (attendees.length === MAX_ATTENDEES) {
    setTimeout(showCelebration, 500);
  }
}

function updateUI() {
  const count = attendees.length;
  
  // Update total counter
  elements.totalCount.textContent = count;
  
  // Update progress bar
  const percentage = (count / MAX_ATTENDEES) * 100;
  elements.progressBar.style.width = `${percentage}%`;
  
  // Calculate team counts
  const teamCounts = calculateTeamCounts();
  elements.waterCount.textContent = teamCounts.water;
  elements.zeroCount.textContent = teamCounts.zero;
  elements.powerCount.textContent = teamCounts.power;
  
  // Update attendee list
  renderAttendeeList();
}

function calculateTeamCounts() {
  return attendees.reduce((counts, attendee) => {
    counts[attendee.team] = (counts[attendee.team] || 0) + 1;
    return counts;
  }, { water: 0, zero: 0, power: 0 });
}

function showGreeting(message, type) {
  elements.greeting.textContent = message;
  elements.greeting.style.display = 'block';
  
  if (type === 'error') {
    elements.greeting.style.backgroundColor = '#fee2e2';
    elements.greeting.style.color = '#991b1b';
    elements.greeting.style.border = '1px solid #fecaca';
  } else {
    elements.greeting.className = 'success-message';
  }
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    elements.greeting.style.display = 'none';
  }, 4000);
}

// LocalStorage Functions

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendees));
  } catch (e) {
    console.warn('Unable to save to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      attendees = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Unable to load from localStorage:', e);
    attendees = [];
  }
}

// Attendee List Display

function createAttendeeListSection() {
  // Check if already exists (in case of hot reloads)
  if (document.getElementById('attendeeListSection')) return;
  
  const section = document.createElement('div');
  section.id = 'attendeeListSection';
  section.className = 'attendee-list-section';
  section.innerHTML = `
    <h3><i class="fas fa-list"></i> Attendee Registry</h3>
    <div id="attendeeListContainer" class="attendee-list-container">
      <p class="no-attendees">No attendees checked in yet.</p>
    </div>
  `;
  
  // Insert after team stats
  const teamStats = document.querySelector('.team-stats');
  if (teamStats) {
    teamStats.appendChild(section);
  }
}

function renderAttendeeList() {
  const container = document.getElementById('attendeeListContainer');
  if (!container) return;
  
  if (attendees.length === 0) {
    container.innerHTML = '<p class="no-attendees">No attendees checked in yet.</p>';
    return;
  }
  
  const list = document.createElement('ul');
  list.className = 'attendee-items';
  
  attendees.forEach((attendee, index) => {
    const li = document.createElement('li');
    li.className = 'attendee-item';
    li.style.animationDelay = `${index * 0.05}s`;
    
    const teamIcon = attendee.team === 'water' ? '🌊' : 
                     attendee.team === 'zero' ? '🌿' : '⚡';
    
    li.innerHTML = `
      <span class="attendee-number">${index + 1}</span>
      <span class="attendee-info">
        <strong>${escapeHtml(attendee.name)}</strong>
        <span class="attendee-team-badge ${attendee.team}">
          ${teamIcon} ${TEAM_NAMES[attendee.team]}
        </span>
      </span>
      <span class="check-in-time">${formatTime(attendee.timestamp)}</span>
    `;
    
    list.appendChild(li);
  });
  
  container.innerHTML = '';
  container.appendChild(list);
}

// Celebration Feature

function showCelebration() {
  const winningTeam = determineWinningTeam();
  const winningTeamName = TEAM_NAMES[winningTeam];
  const winningIcon = winningTeam === 'water' ? '🌊' : 
                      winningTeam === 'zero' ? '🌿' : '⚡';
  
  const modal = document.createElement('div');
  modal.id = 'celebrationModal';
  modal.className = 'celebration-modal';
  modal.innerHTML = `
    <div class="celebration-content">
      <div class="confetti">🎉</div>
      <h2>Goal Achieved!</h2>
      <p class="attendance-goal">We've reached <strong>${MAX_ATTENDEES}</strong> attendees!</p>
      <div class="winner-announcement">
        <div class="trophy">🏆</div>
        <p class="winner-text">Winning Team</p>
        <p class="winner-team">${winningIcon} ${winningTeamName}</p>
        <p class="winner-count">${calculateTeamCounts()[winningTeam]} members</p>
      </div>
      <button class="close-celebration" onclick="closeCelebration()">
        <i class="fas fa-times"></i> Close
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Trigger confetti effect (CSS animation)
  setTimeout(() => {
    modal.classList.add('active');
  }, 100);
}

function determineWinningTeam() {
  const counts = calculateTeamCounts();
  let maxCount = -1;
  let winner = 'water';
  
  for (const [team, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      winner = team;
    }
  }
  
  return winner;
}

function closeCelebration() {
  const modal = document.getElementById('celebrationModal');
  if (modal) {
    modal.remove();
  }
}

// Utility Functions

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


function injectDynamicStyles() {
  const styles = document.createElement('style');
  styles.textContent = `
    .attendee-list-section {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 2px solid #f1f5f9;
      text-align: left;
    }
    
    .attendee-list-section h3 {
      color: #475569;
      font-size: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .attendee-items {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .attendee-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border-left: 4px solid #0071c5;
      animation: slideIn 0.3s ease forwards;
      opacity: 0;
      transform: translateX(-10px);
    }
    
    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .attendee-number {
      width: 28px;
      height: 28px;
      background: #0071c5;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .attendee-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .attendee-team-badge {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      width: fit-content;
    }
    
    .attendee-team-badge.water { background: #e0f2fe; color: #0369a1; }
    .attendee-team-badge.zero { background: #dcfce7; color: #166534; }
    .attendee-team-badge.power { background: #ffedd5; color: #9a3412; }
    
    .check-in-time {
      font-size: 12px;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
    }
    
    .no-attendees {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      padding: 20px;
    }
    
    .celebration-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .celebration-modal.active {
      opacity: 1;
    }
    
    .celebration-content {
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      max-width: 500px;
      width: 90%;
      position: relative;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .confetti {
      font-size: 60px;
      margin-bottom: 10px;
      animation: bounce 1s infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    .celebration-content h2 {
      color: #0071c5;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .attendance-goal {
      font-size: 18px;
      color: #475569;
      margin-bottom: 25px;
    }
    
    .winner-announcement {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 15px;
      padding: 25px;
      margin: 20px 0;
      border: 2px solid #f59e0b;
    }
    
    .trophy {
      font-size: 50px;
      margin-bottom: 10px;
    }
    
    .winner-text {
      color: #92400e;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    
    .winner-team {
      color: #92400e;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .winner-count {
      color: #b45309;
      font-size: 14px;
    }
    
    .close-celebration {
      background: #0071c5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
      transition: all 0.2s;
    }
    
    .close-celebration:hover {
      background: #005a9e;
      transform: translateY(-2px);
    }
    
    /* Scrollbar styling */
    .attendee-items::-webkit-scrollbar {
      width: 8px;
    }
    .attendee-items::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .attendee-items::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .attendee-items::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;
  document.head.appendChild(styles);
}
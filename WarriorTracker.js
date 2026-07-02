import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ==================== THEME ====================
const THEME = {
  bg: '#000000',
  bgSecondary: '#0a0a0a',
  text: '#ffffff',
  textSecondary: '#888888',
  accent: '#d32f2f',
  accentLight: '#ff5252',
  success: '#4caf50',
  border: '#1a1a1a',
};

// ==================== DATA STRUCTURE ====================
const TASK_CATEGORIES = {
  morning: {
    title: '🌅 Morning',
    tasks: [
      'Wake up on time',
      'Drink water',
      'Stretch/Mobility',
      'Meditation',
    ],
  },
  wushu: {
    title: '⚔️ Wushu',
    tasks: [
      'Horse Stance',
      'Bow Stance',
      'Front Kick',
      'Side Kick',
      'Punch Practice',
      'Shadow Practice',
    ],
  },
  stick: {
    title: '🔱 Stick Training',
    tasks: [
      'Forward Spin',
      'Reverse Spin',
      'Figure-8',
      'Behind-the-Back',
      'Wrist Control',
      'Freestyle',
    ],
  },
  learning: {
    title: '📚 Learning',
    tasks: [
      'Read 10 Pages',
      'Learn AI',
      'English Practice',
      'Journal',
    ],
  },
  phone: {
    title: '📱 Phone Habits',
    tasks: [
      'No Phone After Waking',
      'Notifications Off During Workout',
      'Learn One New Phone Feature',
      'Organize Files',
      'No Phone Before Sleep',
    ],
  },
};

const WORKOUTS = {
  monday: {
    title: '💪 Monday - Chest',
    tasks: [
      'Push-ups',
      'Dips',
      'Pike Push-ups',
      'Handstand',
      'Core',
    ],
  },
  tuesday: {
    title: '🔙 Tuesday - Back',
    tasks: [
      'Pull-ups',
      'Rows',
      'Chin-ups',
      'Dead Hang',
      'Leg Raises',
    ],
  },
  wednesday: {
    title: '🦵 Wednesday - Legs',
    tasks: [
      'Squats',
      'Lunges',
      'Bulgarian Split Squats',
      'Calf Raises',
      'Jump Squats',
    ],
  },
  thursday: {
    title: '🤸 Thursday - Balance',
    tasks: [
      'Handstand Practice',
      'L-Sit',
      'Crow Stand',
      'Mobility',
    ],
  },
  friday: {
    title: '🔥 Friday - Full Body',
    tasks: ['Full Body Circuit'],
  },
  saturday: {
    title: '⚡ Saturday - Explosive',
    tasks: ['Explosive Training'],
  },
  sunday: {
    title: '🧘 Sunday - Recovery',
    tasks: ['Recovery & Stretching'],
  },
};

const MOTIVATIONAL_QUOTES = [
  'The warrior within always fights for victory.',
  'Discipline is the bridge between goals and accomplishment.',
  'Train like nobody\'s watching, succeed like everyone is.',
  'Your body can stand almost anything. It\'s your mind you need to convince.',
  'Greatness is earned, not given.',
  'Every rep counts. Every day matters.',
  'Pain is weakness leaving the body.',
  'The master has failed more times than the beginner has tried.',
];

// ==================== APP STATE MANAGEMENT ====================
const WarriorTrackerApp = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const [completedTasks, setCompletedTasks] = useState({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [allTimeStats, setAllTimeStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  // Load data from storage
  useEffect(() => {
    loadAppData();
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  // Auto-reset daily
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const lastReset = new Date(lastResetTime);
      if (now.getDate() !== lastReset.getDate()) {
        resetDaily();
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadAppData = async () => {
    try {
      const savedDay = await AsyncStorage.getItem('currentDay');
      const savedCompleted = await AsyncStorage.getItem('completedTasks');
      const savedXP = await AsyncStorage.getItem('xp');
      const savedStreak = await AsyncStorage.getItem('streak');
      const savedStats = await AsyncStorage.getItem('allTimeStats');

      setCurrentDay(savedDay ? parseInt(savedDay) : 1);
      setCompletedTasks(savedCompleted ? JSON.parse(savedCompleted) : {});
      setXp(savedXP ? parseInt(savedXP) : 0);
      setStreak(savedStreak ? parseInt(savedStreak) : 0);
      setAllTimeStats(savedStats ? JSON.parse(savedStats) : {});
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const saveAppData = async (day, tasks, points, streakCount, stats) => {
    try {
      await AsyncStorage.setItem('currentDay', day.toString());
      await AsyncStorage.setItem('completedTasks', JSON.stringify(tasks));
      await AsyncStorage.setItem('xp', points.toString());
      await AsyncStorage.setItem('streak', streakCount.toString());
      await AsyncStorage.setItem('allTimeStats', JSON.stringify(stats));
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const getTodayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const toggleTask = (taskId) => {
    const todayKey = getTodayKey();
    const updatedTasks = { ...completedTasks };

    if (!updatedTasks[todayKey]) {
      updatedTasks[todayKey] = {};
    }

    const wasCompleted = updatedTasks[todayKey][taskId];

    if (wasCompleted) {
      delete updatedTasks[todayKey][taskId];
      setXp(Math.max(0, xp - 10));
    } else {
      updatedTasks[todayKey][taskId] = true;
      setXp(xp + 10);
    }

    setCompletedTasks(updatedTasks);
    saveAppData(currentDay, updatedTasks, xp, streak, allTimeStats);
  };

  const resetDaily = async () => {
    if (getTodayKey() !== lastResetTime) {
      const newDay = currentDay + 1;
      const todayKey = getTodayKey();
      let newStreak = streak;

      // Check if yesterday was completed
      const yesterdayKey = new Date(Date.now() - 86400000);
      const yesterdayFormattedKey = `${yesterdayKey.getFullYear()}-${yesterdayKey.getMonth()}-${yesterdayKey.getDate()}`;

      if (completedTasks[yesterdayFormattedKey]) {
        newStreak += 1;
      } else {
        newStreak = 0;
      }

      setCurrentDay(newDay);
      setCompletedTasks({});
      setStreak(newStreak);
      setXp(0);
      saveAppData(newDay, {}, 0, newStreak, allTimeStats);
    }
  };

  const getTodayCompletionPercentage = () => {
    const todayKey = getTodayKey();
    const todayTasks = completedTasks[todayKey] || {};
    const totalTasks = Object.keys(TASK_CATEGORIES).reduce((sum, cat) => {
      return sum + TASK_CATEGORIES[cat].tasks.length;
    }, 0) + Object.values(WORKOUTS)[new Date().getDay()].tasks.length;

    return Math.round((Object.keys(todayTasks).length / totalTasks) * 100);
  };

  const getLevel = () => Math.floor(xp / 500) + 1;
  const getNextLevelXP = () => (getLevel() * 500) - xp;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {activeTab === 'dashboard' && (
        <DashboardTab
          currentDay={currentDay}
          xp={xp}
          streak={streak}
          level={getLevel()}
          completionPercentage={getTodayCompletionPercentage()}
          quote={quote}
          nextLevelXP={getNextLevelXP()}
        />
      )}

      {activeTab === 'tasks' && (
        <TasksTab
          completedTasks={completedTasks}
          onToggleTask={toggleTask}
          currentDay={currentDay}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarTab currentDay={currentDay} completedTasks={completedTasks} />
      )}

      {activeTab === 'stats' && (
        <StatsTab xp={xp} streak={streak} completedTasks={completedTasks} />
      )}

      {/* Navigation */}
      <View style={styles.navbar}>
        <NavButton
          icon="📊"
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <NavButton
          icon="✓"
          label="Tasks"
          active={activeTab === 'tasks'}
          onPress={() => setActiveTab('tasks')}
        />
        <NavButton
          icon="📅"
          label="Calendar"
          active={activeTab === 'calendar'}
          onPress={() => setActiveTab('calendar')}
        />
        <NavButton
          icon="📈"
          label="Stats"
          active={activeTab === 'stats'}
          onPress={() => setActiveTab('stats')}
        />
      </View>
    </SafeAreaView>
  );
};

// ==================== DASHBOARD TAB ====================
const DashboardTab = ({ currentDay, xp, streak, level, completionPercentage, quote, nextLevelXP }) => (
  <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.dayBadge}>Day {currentDay}/30</Text>
      <Text style={styles.levelBadge}>⚔️ Level {level}</Text>
    </View>

    {/* Quote */}
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>"{quote}"</Text>
    </View>

    {/* Main Metrics */}
    <View style={styles.metricsGrid}>
      <MetricCard
        icon="🔥"
        label="Streak"
        value={streak}
        subtext="days"
      />
      <MetricCard
        icon="✨"
        label="XP"
        value={xp}
        subtext="points"
      />
      <MetricCard
        icon="📊"
        label="Today"
        value={completionPercentage}
        subtext="%"
      />
    </View>

    {/* Progress Bar */}
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Level Progress</Text>
        <Text style={styles.progressText}>{xp} / {xp + nextLevelXP} XP</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(xp / (xp + nextLevelXP)) * 100}%` }]} />
      </View>
    </View>

    {/* 30-Day Progress */}
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>30-Day Challenge</Text>
        <Text style={styles.progressText}>{currentDay} / 30</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentDay / 30) * 100}%` }]} />
      </View>
    </View>

    {/* Achievement Section */}
    <View style={styles.achievementSection}>
      <Text style={styles.sectionTitle}>🏆 Achievements</Text>
      <View style={styles.achievementGrid}>
        {streak >= 3 && <Badge icon="🔥" label="3-Day Streak" />}
        {streak >= 7 && <Badge icon="🎯" label="Week Warrior" />}
        {streak >= 14 && <Badge icon="👑" label="Fortnite" />}
        {currentDay >= 30 && <Badge icon="🏅" label="30-Day Legend" />}
        {level >= 3 && <Badge icon="⭐" label="Level 3" />}
      </View>
    </View>

    <View style={{ height: 100 }} />
  </ScrollView>
);

// ==================== TASKS TAB ====================
const TasksTab = ({ completedTasks, onToggleTask, currentDay }) => {
  const todayKey = getTodayKey();
  const todayCompleted = completedTasks[todayKey] || {};

  const getTodayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const dayOfWeek = new Date().getDay();
  const workoutDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayWorkout = WORKOUTS[workoutDays[dayOfWeek]];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Today's Tasks</Text>

      {/* Morning */}
      <TaskCategory
        category="morning"
        data={TASK_CATEGORIES.morning}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      {/* Workout */}
      <TaskCategory
        category="workout"
        data={todayWorkout}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      {/* Wushu */}
      <TaskCategory
        category="wushu"
        data={TASK_CATEGORIES.wushu}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      {/* Stick Training */}
      <TaskCategory
        category="stick"
        data={TASK_CATEGORIES.stick}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      {/* Learning */}
      <TaskCategory
        category="learning"
        data={TASK_CATEGORIES.learning}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      {/* Phone Habits */}
      <TaskCategory
        category="phone"
        data={TASK_CATEGORIES.phone}
        completed={todayCompleted}
        onToggle={onToggleTask}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const TaskCategory = ({ category, data, completed, onToggle }) => {
  return (
    <View style={styles.categoryCard}>
      <Text style={styles.categoryTitle}>{data.title}</Text>
      {data.tasks.map((task, index) => {
        const taskId = `${category}-${index}`;
        const isCompleted = completed[taskId];

        return (
          <TaskItem
            key={taskId}
            task={task}
            completed={isCompleted}
            onPress={() => onToggle(taskId)}
          />
        );
      })}
    </View>
  );
};

const TaskItem = ({ task, completed, onPress }) => (
  <TouchableOpacity
    style={[styles.taskItem, completed && styles.taskItemCompleted]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
      {completed && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={[styles.taskText, completed && styles.taskTextCompleted]}>
      {task}
    </Text>
  </TouchableOpacity>
);

// ==================== CALENDAR TAB ====================
const CalendarTab = ({ currentDay, completedTasks }) => {
  const getDayColor = (day) => {
    const date = new Date();
    date.setDate(date.getDate() - (currentDay - day));
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return completedTasks[key] ? THEME.success : THEME.accent;
  };

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.pageTitle}>30-Day Calendar</Text>

      <View style={styles.calendarGrid}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
          <View
            key={day}
            style={[
              styles.calendarDay,
              { backgroundColor: getDayColor(day) },
              day > currentDay && { opacity: 0.3 },
            ]}
          >
            <Text style={styles.calendarDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legendSection}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: THEME.success }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: THEME.accent }]} />
          <Text style={styles.legendText}>Incomplete</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ==================== STATS TAB ====================
const StatsTab = ({ xp, streak, completedTasks }) => {
  const getTodayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const calculateStats = () => {
    const allDays = Object.keys(completedTasks);
    const completionRates = allDays.map(day => {
      const taskCount = Object.keys(completedTasks[day]).length;
      return taskCount;
    });

    const avgCompletion = completionRates.length > 0
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    return { avgCompletion, totalDays: allDays.length };
  };

  const { avgCompletion, totalDays } = calculateStats();

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.pageTitle}>Statistics</Text>

      <View style={styles.statsCard}>
        <StatRow label="Total XP Earned" value={xp} />
        <StatRow label="Current Streak" value={streak} />
        <StatRow label="Days Active" value={totalDays} />
        <StatRow label="Avg Tasks/Day" value={avgCompletion} />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ==================== COMPONENTS ====================
const MetricCard = ({ icon, label, value, subtext }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricSubtext}>{subtext}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const Badge = ({ icon, label }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeIcon}>{icon}</Text>
    <Text style={styles.badgeLabel}>{label}</Text>
  </View>
);

const NavButton = ({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.navButton, active && styles.navButtonActive]}
    onPress={onPress}
  >
    <Text style={styles.navIcon}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const StatRow = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dayBadge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.accent,
  },
  levelBadge: {
    fontSize: 20,
    color: THEME.accentLight,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 20,
  },
  quoteCard: {
    backgroundColor: THEME.bgSecondary,
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
  },
  quoteText: {
    fontSize: 16,
    color: THEME.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.bgSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.accent,
  },
  metricSubtext: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 8,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  progressText: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: THEME.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.accent,
  },
  achievementSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 12,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: THEME.bgSecondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 12,
    color: THEME.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: THEME.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: THEME.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  taskItemCompleted: {
    backgroundColor: `${THEME.success}15`,
    borderColor: THEME.success,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.textSecondary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: THEME.success,
    borderColor: THEME.success,
  },
  checkmark: {
    fontSize: 14,
    color: THEME.bg,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: THEME.text,
  },
  taskTextCompleted: {
    color: THEME.textSecondary,
    textDecorationLine: 'line-through',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  calendarDay: {
    width: (width - 40) / 6,
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    color: THEME.bg,
    fontWeight: 'bold',
    fontSize: 12,
  },
  legendSection: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  statsCard: {
    backgroundColor: THEME.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  statLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.accent,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: THEME.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingBottom: 20,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonActive: {
    borderTopWidth: 2,
    borderTopColor: THEME.accent,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
  },
  navLabelActive: {
    color: THEME.accent,
    fontWeight: 'bold',
  },
});

export default WarriorTrackerApp;

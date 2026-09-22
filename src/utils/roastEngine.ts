// ============================================================
// Streakosaurus — Roast Engine 🦖
// ============================================================

import type { RoastLevel, RoastContext } from '../types';

type RoastBank = Record<string, string[]>;

// ============================================================
// SARCASTIC ROASTS (default)
// ============================================================

const sarcasticRoasts: RoastBank = {
  // Completion drops
  decline: [
    "Your {habit} dropped {change}%. Your books have filed a missing-person report.",
    "{habit} went from {old_rate}% to {new_rate}%. Even the dinosaurs had a better survival rate.",
    "Down {change}% on {habit}. I'm not saying you've given up, but {habit} might disagree.",
    "Your {habit} numbers are trending down faster than a meteor heading for Earth.",
    "{habit}: {new_rate}% completion. Your future self is composing a strongly worded letter.",
  ],

  // Completion improvements
  improvement: [
    "You went from {old_rate}% to {new_rate}% on {habit}. Apparently you actually do this now.",
    "{habit} improved by {change}%. Either you got motivated or you're just showing off for me.",
    "Up {change}% on {habit}. The dinosaur is impressed. And confused.",
    "{habit} at {new_rate}%. Your productivity is doing something unusual — it's increasing.",
  ],

  // Perfect week
  perfect_week: [
    "100%. We have absolutely no notes.",
    "A perfect week. The dinosaurs would be proud. If they weren't extinct.",
    "Every. Single. Day. I'd say something sarcastic but you've earned none of it.",
    "Complete perfection. You've left me nothing to roast. How dare you.",
  ],

  // Streak milestones
  streak_3: ["3 days. Your commitment has exceeded the average housefly's lifespan. Congrats."],
  streak_7: ["7 days. One full week. At this rate, you'll be unbearable by month two."],
  streak_14: ["14 days. Two weeks of not quitting. That's like a eternity in dinosaur years."],
  streak_30: ["30 days. A full month. You might actually be a real person and not a simulation."],
  streak_100: ["100 days. At this point, skipping would probably cause a diplomatic incident."],

  // Low completion
  low_completion: [
    "{habit} at {rate}%. Your excuse game is strong. Your completion game less so.",
    "You've completed {habit} {count} out of {total} times. That's what we call 'aspirational'.",
    "{habit}: {rate}%. I'd roast you harder but I don't want to kick a dinosaur while it's down.",
  ],

  // High completion
  high_completion: [
    "{habit} at {rate}%. You've made habit-tracking look almost effortless. Almost.",
    "{rate}% on {habit}. You're making this look suspiciously easy.",
    "{habit} is basically your best friend at this point.",
  ],

  // Missed habit
  missed: [
    "You missed {habit} today. Your streak is currently pretending everything is fine.",
    "One habit left. Your streak just sent a prayer to the universe.",
    "{habit} is sitting there, completed-less, wondering what it did wrong.",
  ],

  // Default/neutral
  neutral: [
    "{habit}: {rate}% completion. The data speaks. I merely translate.",
    "Another day, another data point for {habit}. You're building a beautiful spreadsheet.",
  ],

  // New habit
  new_habit: [
    "A new {habit} habit. Bold move. Let's see if it survives past Tuesday.",
    "Welcome to the {habit} club. Population: you and your willpower.",
  ],

  // No data
  no_data: [
    "Not enough data yet. Give me another week and I'll have something interesting to say.",
    "I'd roast you but there's literally nothing to roast. Start doing things.",
    "The data is sparse. Like dinosaur bones. Give me time.",
  ],

  // Best day
  best_day: [
    "Your best day was {day} with {rate}% completion. Peak human performance. Sort of.",
    "{day}: {rate}%. That's your power day. Use it wisely.",
  ],

  // Worst day
  worst_day: [
    "Your worst day was {day} with {rate}%. We all have off days. Yours are just very off.",
    "{day} at {rate}%? Even I've seen better numbers from extinct species.",
  ],

  // Evening check-in
  evening_checkin: [
    "Evening check-in. How'd today go? Be honest. I'm a dinosaur, not a therapist.",
    "The day is ending. Time to face the data. Don't worry, I'll be gentle. Just kidding.",
  ],

  // Weekly report
  weekly_report: [
    "Your weekly report is in. Spoiler: it's mostly numbers. But some of them are good numbers.",
    "Weekly report generated. I've prepared both compliments and roasts. You'll get whichever you deserve.",
  ],

  // Monthly report
  monthly_report: [
    "Monthly report: The full picture. Some of it's blurry, some of it's beautiful.",
    "Another month survived. Your data has been thoroughly judged.",
  ],
};

// ============================================================
// FRIENDLY ROASTS
// ============================================================

const friendlyRoasts: RoastBank = {
  decline: [
    "Your {habit} dropped {change}%. That's okay — even the best runners have off days.",
    "{habit} went from {old_rate}% to {new_rate}%. Let's get that trend back up!",
    "Down {change}% on {habit}. Tomorrow's a fresh start.",
  ],
  improvement: [
    "You went from {old_rate}% to {new_rate}% on {habit}. Great progress!",
    "{habit} improved by {change}%. You should be proud of that.",
    "Up {change}% on {habit}! Keep up the momentum!",
  ],
  perfect_week: [
    "100%! A perfect week. You're on fire!",
    "Complete perfection. Well done!",
  ],
  streak_3: ["3 days! Nice start — keep the momentum going!"],
  streak_7: ["A full week! You're building something great."],
  streak_14: ["Two weeks strong! That's real commitment."],
  streak_30: ["30 days! A whole month of consistency. Impressive!"],
  streak_100: ["100 days! That's legendary dedication."],
  low_completion: [
    "{habit} at {rate}%. Small steps add up — you've got this.",
  ],
  high_completion: [
    "{habit} at {rate}%. You're crushing it!",
    "{rate}% on {habit}! Amazing consistency.",
  ],
  missed: [
    "Missed {habit} today. Don't let one day define the streak.",
  ],
  neutral: [
    "{habit}: {rate}% completion. Solid effort.",
  ],
  new_habit: [
    "New {habit} habit — welcome aboard! Let's make it stick.",
  ],
  no_data: [
    "Not enough data yet. Keep going — the insights will come!",
  ],
  best_day: [
    "Your best day was {day} with {rate}% completion. Great work!",
  ],
  worst_day: [
    "Your toughest day was {day}. Everyone has them — it's about recovery.",
  ],
  evening_checkin: [
    "Evening check-in! How did today go?",
  ],
  weekly_report: [
    "Your weekly report is ready. Let's see how you did!",
  ],
  monthly_report: [
    "Monthly report generated. Here's your full performance picture.",
  ],
};

// ============================================================
// PROFESSIONAL ROASTS
// ============================================================

const professionalRoasts: RoastBank = {
  decline: [
    "{habit} completion decreased by {change}% (from {old_rate}% to {new_rate}%). Consider reviewing your schedule.",
    "Declining trend on {habit}: -{change}%. A structured approach may help.",
  ],
  improvement: [
    "{habit} improved from {old_rate}% to {new_rate}%. Positive trajectory.",
    "Up {change}% on {habit}. This indicates effective habit formation.",
  ],
  perfect_week: [
    "100% completion rate this week. Optimal performance achieved.",
  ],
  streak_3: ["3-day streak established. Consistency is developing."],
  streak_7: ["7-day streak reached. Strong weekly consistency."],
  streak_14: ["14-day streak. Two weeks of sustained performance."],
  streak_30: ["30-day streak. Excellent long-term consistency."],
  streak_100: ["100-day streak. Exceptional dedication to this habit."],
  low_completion: [
    "{habit} at {rate}% completion. Target: 80%+ for reliable habit formation.",
  ],
  high_completion: [
    "{habit} at {rate}% completion. Well above target.",
  ],
  missed: [
    "{habit} was not completed today. Review scheduling if this recurs.",
  ],
  neutral: [
    "{habit}: {rate}% completion rate.",
  ],
  new_habit: [
    "New habit added: {habit}. Initial baseline will be established over 2 weeks.",
  ],
  no_data: [
    "Insufficient data for analysis. Minimum 1 week of tracking recommended.",
  ],
  best_day: [
    "Peak performance: {day} ({rate}% completion).",
  ],
  worst_day: [
    "Lowest performance: {day} ({rate}% completion).",
  ],
  evening_checkin: [
    "Daily review reminder. Assess today's performance and plan tomorrow.",
  ],
  weekly_report: [
    "Weekly performance report generated.",
  ],
  monthly_report: [
    "Monthly performance report generated.",
  ],
};

// ============================================================
// SAVAGE ROASTS
// ============================================================

const savageRoasts: RoastBank = {
  decline: [
    "{habit} dropped {change}%. Your excuses are working harder than you are.",
    "Down from {old_rate}% to {new_rate}% on {habit}. Even procrastination is disappointed.",
    "{habit}: -{change}%. The trend line looks like your motivation — heading straight down.",
    "Your {habit} rate is declining faster than my faith in humanity. And I'm a dinosaur.",
  ],
  improvement: [
    "From {old_rate}% to {new_rate}% on {habit}. I'm genuinely shocked.",
    "{habit} up {change}%. Either you've changed or you're trying to trick me.",
    "+{change}% on {habit}. I'll allow myself to be cautiously impressed.",
  ],
  perfect_week: [
    "100%. I have nothing to roast. This is deeply unsettling.",
    "A perfect week. Either you've evolved or you've got something to prove. Both work.",
  ],
  streak_3: ["3 days. The dinosaur is mildly intrigued."],
  streak_7: ["7 days. You're officially more consistent than a metronome."],
  streak_14: ["14 days. At this point I'm starting to respect you. Don't make it weird."],
  streak_30: ["30 days. You're basically a different person now."],
  streak_100: ["100 days. You've transcended mortal weakness. Or something."],
  low_completion: [
    "{habit} at {rate}%. Your commitment is about as solid as a meteor-targeted asteroid.",
    "{rate}% on {habit}. The bare minimum has filed for a restraining order.",
  ],
  high_completion: [
    "{habit} at {rate}%. You're making everyone else look bad. Good.",
    "{rate}% on {habit}. I'm running out of things to say. You're too good.",
  ],
  missed: [
    "You missed {habit}. Your streak is filing for emotional damages.",
    "One habit left undone. Your consistency just flinched.",
  ],
  neutral: [
    "{habit}: {rate}%. Not bad. Not great. Very... neutral.",
  ],
  new_habit: [
    "New {habit} habit? Bold. Let's see if it lasts longer than most of my species.",
  ],
  no_data: [
    "No data. I can't roast what doesn't exist. Yet.",
    "Insufficient data. Come back when you've actually done something.",
  ],
  best_day: [
    "Best day: {day} at {rate}%. Your peak. Enjoy it — it's all downhill from here. Just kidding.",
  ],
  worst_day: [
    "Worst day: {day} at {rate}%. I've seen better performance from fossilized remains.",
  ],
  evening_checkin: [
    "Evening check-in. Time to face the music. Or the dinosaur.",
  ],
  weekly_report: [
    "Weekly report. Brace yourself.",
  ],
  monthly_report: [
    "Monthly report. The full exposure. No hiding now.",
  ],
};

// ============================================================
// ENGINE
// ============================================================

const roastLevels: Record<RoastLevel, RoastBank> = {
  professional: professionalRoasts,
  friendly: friendlyRoasts,
  sarcastic: sarcasticRoasts,
  savage: savageRoasts,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Stable pick: the same seed always yields the same line.
 *
 * Reports are re-rendered on every state change, and a random pick would make a
 * field note change under the user's eyes. Seeding it on the period keeps the
 * note stable for that period while still varying between periods.
 */
function pickSeeded<T>(arr: T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return arr[Math.abs(hash) % arr.length];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result;
}

/**
 * Generate a roast based on context and roast level.
 *
 * Pass a `seed` to make the choice deterministic (reports use this); omit it for
 * the usual random pick (Home's personality copy).
 */
export function generateRoast(
  level: RoastLevel,
  context: RoastContext,
  seed?: string
): string {
  const bank = roastLevels[level];

  let templates: string[];
  const vars: Record<string, string> = {
    habit: context.habit_name,
    metric: context.metric,
    value: String(context.value),
    change: context.change !== undefined ? String(Math.abs(context.change)) : '',
    streak: context.streak !== undefined ? String(context.streak) : '',
    comparison: context.comparison || '',
  };

  // Added only when supplied, so existing callers behave exactly as before.
  if (context.count !== undefined) vars.count = String(context.count);
  if (context.total !== undefined) vars.total = String(context.total);

  // Determine which roast bank to pull from
  if (context.metric === 'no_data') {
    templates = bank.no_data || sarcasticRoasts.no_data;
  } else if (context.metric === 'perfect_week') {
    templates = bank.perfect_week || sarcasticRoasts.perfect_week;
  } else if (context.metric === 'new_habit') {
    templates = bank.new_habit || sarcasticRoasts.new_habit;
  } else if (context.metric === 'missed') {
    templates = bank.missed || sarcasticRoasts.missed;
  } else if (context.change !== undefined) {
    if (context.change > 5) {
      templates = bank.improvement || sarcasticRoasts.improvement;
      vars.old_rate = String(Math.round(context.value - context.change));
      vars.new_rate = String(context.value);
    } else if (context.change < -5) {
      templates = bank.decline || sarcasticRoasts.decline;
      vars.old_rate = String(Math.round(context.value - context.change));
      vars.new_rate = String(context.value);
    } else {
      templates = bank.neutral || sarcasticRoasts.neutral;
      vars.rate = String(context.value);
    }
  } else if (context.value >= 80) {
    templates = bank.high_completion || sarcasticRoasts.high_completion;
    vars.rate = String(context.value);
  } else if (context.value < 50) {
    templates = bank.low_completion || sarcasticRoasts.low_completion;
    vars.rate = String(context.value);
  } else {
    templates = bank.neutral || sarcasticRoasts.neutral;
    vars.rate = String(context.value);
  }

  const template = seed ? pickSeeded(templates, seed) : pickRandom(templates);
  return fillTemplate(template, vars);
}

/**
 * Generate a personality greeting message.
 */
export function getPersonalityGreeting(
  level: RoastLevel,
  progress: number,
  name: string
): string {
  const hour = new Date().getHours();
  let timeGreeting: string;

  if (hour < 12) timeGreeting = 'morning';
  else if (hour < 17) timeGreeting = 'afternoon';
  else timeGreeting = 'evening';

  if (level === 'professional') {
    return `Good ${timeGreeting}, ${name}. Here's your daily overview.`;
  }

  if (level === 'friendly') {
    return `Good ${timeGreeting}, ${name}! Let's see how today's going.`;
  }

  // Sarcastic / Savage
  if (progress === 100) {
    return pickRandom([
      "100%. We have absolutely no notes.",
      `${name}, you've completed everything. I'm confused and impressed.`,
      "All habits done. I'd say something sarcastic but you've earned none of it.",
    ]);
  }

  if (progress >= 75) {
    return pickRandom([
      "Good evening, " + name + ". Let's see what survived today.",
      `${name}, you're at ${progress}%. Not bad for a mammal.`,
      `Solid progress today, ${name}. Even the dinosaur approves. Slightly.`,
    ]);
  }

  if (progress >= 50) {
    return pickRandom([
      "Halfway there. The dinosaur waits.",
      `${name}, we're at ${progress}%. Room for improvement. Significant room.`,
      `Evening, ${name}. ${progress}% done. Let's discuss.`,
    ]);
  }

  return pickRandom([
    `${progress}%. Let's see what survived today.`,
    `${name}, we need to talk about ${progress}%.`,
    `Good ${timeGreeting}, ${name}. Your habits are feeling neglected.`,
    `${progress}% completion today. Even the fossil record shows more activity.`,
  ]);
}

import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  profile: "pullRequest.profile.v012",
  workouts: "pullRequest.workouts.v012",
};

const defaultProfile = {
  name: "",
  age: "",
  currentWeight: "",
  goalWeight: "",
  activityLevel: "",
  goals: ["Fat loss", "Strength"],
  trainingPace: "Balanced 4-5 days/week",
  sessionLength: "45 minutes",
  limitations: "",
  gymAccess: "",
  favorites: "",
  avoid: "",
  coachingStyle: "Warm, direct, progressive, practical. Give me clear workouts with suggested weights and help me progress based on actuals.",
};

const defaultCheckin = {
  weight: "",
  sleep: "",
  energy: "",
  soreness: "",
  timeAvailable: "45 minutes",
  constraints: "",
  notes: "",
};

const sampleWorkoutText = `WORKOUT_TITLE: Lower Body - Glutes + Hamstrings
TIME_TARGET: 45 minutes

SECTION: Warm-up
SECTION_TYPE: warmup
EXERCISE: Treadmill easy walk
SETS: 1
REPS: 5 minutes
SUGGESTED_WEIGHT: bodyweight
NOTES: Easy pace. Let your body report in.

EXERCISE: Bodyweight good mornings
SETS: 1
REPS: 10
SUGGESTED_WEIGHT: bodyweight
NOTES: Slow hinge, ribs down.

SECTION: Big Superset A
SECTION_TYPE: big superset
EXERCISE: Glute Drive
SETS: 3
REPS: 10-12
SUGGESTED_WEIGHT: 70
NOTES: Pause hard at the top. No low-back takeover.

EXERCISE: Seated Hamstring Curl
SETS: 3
REPS: 10-12
SUGGESTED_WEIGHT: 70
NOTES: Controlled negative. Full squeeze.

SECTION: Strength Block B
SECTION_TYPE: block
EXERCISE: Dumbbell Romanian Deadlift
SETS: 3
REPS: 8-10
SUGGESTED_WEIGHT: 30 lb DBs
NOTES: Stop if low back takes over.

SECTION: Optional Cooldown
SECTION_TYPE: optional cooldown
EXERCISE: Easy treadmill walk
SETS: 1
REPS: 5 minutes
SUGGESTED_WEIGHT: bodyweight
NOTES: Optional. Skip if time is tight.`;

function loadJson(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-400/70 focus:ring-4 focus:ring-fuchsia-500/10"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-400/70 focus:ring-4 focus:ring-fuchsia-500/10"
        />
      )}
    </label>
  );
}

function PillButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-full border px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
        active
          ? "border-fuchsia-300 bg-fuchsia-400 text-zinc-950 shadow-lg shadow-fuchsia-500/20"
          : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
      )}
    >
      {children}
    </button>
  );
}

function legacyCopyToClipboard(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

function CopyButton({ text, label = "Copy", copiedLabel = "Copied", fallbackTitle = "Copy this text" }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    setFailed(false);

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        return;
      }
    } catch {
      // Keep going. Some preview environments block this even though deployed HTTPS apps allow it.
    }

    const fallbackWorked = legacyCopyToClipboard(text);
    if (fallbackWorked) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      return;
    }

    setFailed(true);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={copy}
        className={classNames(
          "rounded-2xl px-4 py-3 text-sm font-black shadow-xl transition active:scale-[0.98]",
          copied
            ? "bg-emerald-300 text-zinc-950 shadow-emerald-500/20"
            : failed
            ? "bg-amber-300 text-zinc-950 shadow-amber-500/20"
            : "bg-white text-zinc-950 shadow-white/10 hover:bg-zinc-200"
        )}
      >
        {copied ? copiedLabel : failed ? "Copy blocked" : label}
      </button>
      {failed && (
        <p className="max-w-xs rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-medium leading-5 text-amber-100">
          {fallbackTitle} was blocked by this browser. Try selecting the text manually or use Safari/Chrome over HTTPS.
        </p>
      )}
    </div>
  );
}

function getSetCount(setsText) {
  const match = String(setsText || "").match(/\d+/);
  return Math.max(match ? Number(match[0]) : 1, 1);
}

function normalizeSectionType(name = "", explicitType = "") {
  const text = `${explicitType} ${name}`.toLowerCase();
  if (text.includes("optional") && text.includes("cool")) return "optional cooldown";
  if (text.includes("warm")) return "warmup";
  if (text.includes("giant")) return "giant set";
  if (text.includes("big") && text.includes("superset")) return "big superset";
  if (text.includes("superset")) return "superset";
  if (text.includes("cool")) return "cooldown";
  if (text.includes("finish")) return "finisher";
  if (text.includes("block")) return "block";
  return explicitType || "block";
}

function sectionStyle(type) {
  const normalized = normalizeSectionType(type, type);
  if (normalized === "warmup") return { tag: "Warm-up", accent: "text-amber-300", border: "border-amber-300/20", bg: "bg-amber-300/8" };
  if (normalized === "superset") return { tag: "Superset", accent: "text-fuchsia-300", border: "border-fuchsia-300/20", bg: "bg-fuchsia-300/8" };
  if (normalized === "big superset") return { tag: "Big superset", accent: "text-violet-300", border: "border-violet-300/20", bg: "bg-violet-300/8" };
  if (normalized === "giant set") return { tag: "Giant set", accent: "text-pink-300", border: "border-pink-300/20", bg: "bg-pink-300/8" };
  if (normalized === "cooldown") return { tag: "Cooldown", accent: "text-emerald-300", border: "border-emerald-300/20", bg: "bg-emerald-300/8" };
  if (normalized === "optional cooldown") return { tag: "Optional cooldown", accent: "text-teal-300", border: "border-teal-300/20", bg: "bg-teal-300/8" };
  if (normalized === "finisher") return { tag: "Finisher", accent: "text-rose-300", border: "border-rose-300/20", bg: "bg-rose-300/8" };
  return { tag: "Block", accent: "text-cyan-300", border: "border-cyan-300/20", bg: "bg-cyan-300/8" };
}

function makePlannedSets(exercise) {
  const count = getSetCount(exercise.sets);
  return Array.from({ length: count }, (_, index) => ({
    setNumber: index + 1,
    weight: exercise.suggestedWeight || "",
    reps: exercise.reps || "",
    plannedWeight: exercise.suggestedWeight || "",
    plannedReps: exercise.reps || "",
    status: "planned",
  }));
}

function parseWorkout(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const workout = {
    id: makeId("workout"),
    date: new Date().toISOString(),
    title: "Untitled Workout",
    timeTarget: "",
    rawText: text,
    sections: [],
    completed: false,
  };

  let currentSection = null;
  let currentExercise = null;

  function ensureSection(name = "Workout", type = "") {
    if (!currentSection || currentSection.name !== name) {
      currentSection = {
        id: makeId("section"),
        name,
        type: normalizeSectionType(name, type),
        exercises: [],
      };
      workout.sections.push(currentSection);
    } else if (type) {
      currentSection.type = normalizeSectionType(currentSection.name, type);
    }
  }

  function finishExercise() {
    if (currentExercise && currentSection) {
      currentExercise.actualSets = makePlannedSets(currentExercise);
      currentSection.exercises.push(currentExercise);
      currentExercise = null;
    }
  }

  lines.forEach((line) => {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().replace(/\s+/g, "_").toUpperCase();
    const value = rest.join(":").trim();

    if (key === "WORKOUT_TITLE" || key === "TITLE") {
      workout.title = value || workout.title;
      return;
    }

    if (key === "TIME_TARGET" || key === "TIME") {
      workout.timeTarget = value;
      return;
    }

    if (["SECTION", "BLOCK", "SUPERSET", "GIANT_SET", "WARMUP", "WARM_UP", "COOLDOWN", "COOL_DOWN", "OPTIONAL_COOLDOWN", "FINISHER"].includes(key)) {
      finishExercise();
      const sectionName = value || rawKey.trim();
      ensureSection(sectionName, rawKey.trim());
      return;
    }

    if (key === "SECTION_TYPE" || key === "TYPE") {
      if (currentSection) currentSection.type = normalizeSectionType(currentSection.name, value);
      return;
    }

    if (key === "EXERCISE" || key === "MOVE" || key === "MOVEMENT") {
      finishExercise();
      ensureSection(currentSection?.name || "Workout");
      currentExercise = {
        id: makeId("exercise"),
        name: value || "Exercise",
        sets: "1",
        reps: "",
        suggestedWeight: "",
        notes: "",
        difficulty: "",
        pain: false,
        actualNotes: "",
      };
      return;
    }

    if (!currentExercise) return;

    if (key === "SETS" || key === "ROUNDS") currentExercise.sets = value;
    if (key === "REPS" || key === "DURATION") currentExercise.reps = value;
    if (key === "SUGGESTED_WEIGHT" || key === "WEIGHT" || key === "LOAD") currentExercise.suggestedWeight = value;
    if (key === "NOTES" || key === "CUE" || key === "COACHING_CUE") currentExercise.notes = value;
  });

  finishExercise();
  return workout;
}

function updateExercise(workout, exerciseId, updater) {
  return {
    ...workout,
    sections: workout.sections.map((section) => ({
      ...section,
      exercises: section.exercises.map((exercise) =>
        exercise.id === exerciseId ? updater(exercise) : exercise
      ),
    })),
  };
}

function workoutExerciseCount(workout) {
  return workout.sections.reduce((count, section) => count + section.exercises.length, 0);
}

function profilePrompt(profile, mode = "starter") {
  const opening = mode === "update"
    ? "I am updating my training profile for an ongoing Pull Request workout-coaching chat. Please use this updated profile going forward when building and progressing my workouts."
    : "I am starting a workout-coaching workflow using an app called Pull Request. The app helps me copy your workout plan into cards, log my actual weights/reps, and paste a clean workout summary back to you so you can progress me over time.";

  return `${opening}\n\nI want you to act as my adaptive strength-training coach. Build workouts for me based on my goals, current ability, limitations, actual performance, and daily check-ins. Please keep the coaching conversational, but format the actual workout plan exactly like this so Pull Request can import it cleanly:\n\nWORKOUT_TITLE: [title]\nTIME_TARGET: [time]\n\nSECTION: [Warm-up, Superset A, Strength Block B, Big Superset C, Finisher, Cooldown, Optional Cooldown, etc.]\nSECTION_TYPE: [warmup, superset, big superset, giant set, block, finisher, cooldown, optional cooldown]\nEXERCISE: [exercise name]\nSETS: [number]\nREPS: [target reps or duration]\nSUGGESTED_WEIGHT: [suggested weight or bodyweight]\nNOTES: [short coaching cue]\n\nImportant: repeat the EXERCISE/SETS/REPS/SUGGESTED_WEIGHT/NOTES fields for every exercise. Use clear section names for warm-ups, supersets, regular blocks, big supersets, finishers, cooldowns, and optional cooldowns.\n\nMy profile:\nName: ${profile.name || "not entered"}\nAge: ${profile.age || "not entered"}\nCurrent weight: ${profile.currentWeight || "not entered"}\nGoal weight: ${profile.goalWeight || "not entered"}\nActivity level: ${profile.activityLevel || "not entered"}\nGoals: ${profile.goals.join(", ")}\nTraining pace: ${profile.trainingPace || "not entered"}\nUsual session length: ${profile.sessionLength || "not entered"}\nLimitations/injuries: ${profile.limitations || "not entered"}\nGym access: ${profile.gymAccess || "not entered"}\nFavorite equipment/styles: ${profile.favorites || "not entered"}\nAvoid: ${profile.avoid || "not entered"}\nCoaching style: ${profile.coachingStyle || "not entered"}\n\nPlease progress me based on my actual results over time, not generic programming. If something causes pain or looks risky based on my check-in, adjust the plan. When I paste completed workout actuals back to you, use those actuals to decide what should increase, stay the same, or be modified next time.`;
}

function checkinPrompt(profile, checkin) {
  return `I am using Pull Request to log workouts you create for me. Please give me today's workout using the import-friendly format below so I can paste it into the app, log my actuals, and send the results back to you for progression.\n\nRequired workout format:\nWORKOUT_TITLE: [title]\nTIME_TARGET: [time]\n\nSECTION: [Warm-up, Superset A, Strength Block B, Big Superset C, Finisher, Cooldown, Optional Cooldown, etc.]\nSECTION_TYPE: [warmup, superset, big superset, giant set, block, finisher, cooldown, optional cooldown]\nEXERCISE: [exercise name]\nSETS: [number]\nREPS: [target reps or duration]\nSUGGESTED_WEIGHT: [suggested weight or bodyweight]\nNOTES: [short coaching cue]\n\nToday's check-in:\nWeight: ${checkin.weight || "not entered"}\nSleep: ${checkin.sleep || "not entered"}\nEnergy: ${checkin.energy || "not entered"}\nSoreness/pain: ${checkin.soreness || "not entered"}\nAvailable time: ${checkin.timeAvailable || profile.sessionLength || "not entered"}\nConstraints/preferences today: ${checkin.constraints || "none entered"}\nNotes: ${checkin.notes || "none entered"}\n\nPlease progress me based on my recent actuals and keep my limitations in mind. Give me a clear, efficient workout with suggested weights where appropriate.`;
}

function describeSetStatus(set) {
  if (set.status === "confirmed") return "confirmed as planned";
  if (set.status === "edited") return "edited by user";
  return "planned value not yet confirmed";
}

function coachUpdate(workout, checkin) {
  if (!workout) return "";
  const sections = workout.sections
    .map((section) => {
      const exercises = section.exercises
        .map((exercise, index) => {
          const sets = exercise.actualSets
            .map((set) => `Set ${set.setNumber}: ${set.weight || "?"} x ${set.reps || "?"} (${describeSetStatus(set)})`)
            .join("; ");
          return `${index + 1}. ${exercise.name}\n- Planned: ${exercise.sets || "?"} sets x ${exercise.reps || "?"}, suggested ${exercise.suggestedWeight || "not listed"}\n- Actual: ${sets}\n- Difficulty: ${exercise.difficulty || "not marked"}\n- Pain flag: ${exercise.pain ? "yes" : "no"}\n- Notes: ${exercise.actualNotes || "none"}`;
        })
        .join("\n\n");
      return `${section.name} (${sectionStyle(section.type).tag})\n${exercises}`;
    })
    .join("\n\n");

  return `WORKOUT COMPLETED\n\nWorkout: ${workout.title}\nDate: ${new Date(workout.date).toLocaleDateString()}\nTime target: ${workout.timeTarget || "not listed"}\n\nToday's context:\nWeight: ${checkin.weight || "not entered"}\nSleep: ${checkin.sleep || "not entered"}\nEnergy: ${checkin.energy || "not entered"}\nSoreness/pain: ${checkin.soreness || "not entered"}\nConstraints: ${checkin.constraints || "none entered"}\nNotes: ${checkin.notes || "none entered"}\n\nExercise results:\n\n${sections}\n\nProgression request:\nPlease use these actuals to decide what should increase, stay the same, or be modified next time. Treat confirmed-as-planned sets as completed exactly as prescribed. Treat edited sets as the true actuals. If a set is still marked as planned value not yet confirmed, ask me for clarification or use caution before progressing that exercise. Keep the workout flexible and adjust for any pain flags or constraints.`;
}

function Header({ activeTab, setActiveTab }) {
  const tabs = [
    ["profile", "Setup"],
    ["home", "Today"],
    ["import", "Import"],
    ["log", "Log"],
    ["export", "Export"],
    ["history", "History"],
  ];
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 via-violet-400 to-cyan-300 text-lg font-black text-zinc-950 shadow-lg shadow-fuchsia-500/20 sm:h-10 sm:w-10 sm:text-xl">
              PR
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Pull Request</h1>
              <p className="text-[11px] font-medium text-zinc-400 sm:text-xs">Plan. Lift. Log. Merge progress.</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-400 sm:block">
            v0.1.3
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:mt-4">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={classNames(
                "shrink-0 rounded-full px-3 py-2 text-sm font-bold transition active:scale-[0.98] sm:px-4",
                activeTab === key
                  ? "bg-white text-zinc-950"
                  : "bg-white/[0.05] text-zinc-300 hover:bg-white/[0.09]"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Shell({ children }) {
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_32%),linear-gradient(180deg,#09090b,#18181b)] text-zinc-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={classNames("rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/25 backdrop-blur sm:rounded-[2rem] sm:p-5", className)}>{children}</section>;
}

function Home({ profile, checkin, setCheckin, setActiveTab, currentWorkout }) {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">Today's pull request</p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Ready to get today's workout?</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            If your setup is done, fill in the daily check-in below, copy the prompt to your ChatGPT workout chat, then paste the workout it gives you into the Import tab.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button onClick={() => setActiveTab("home")} className="rounded-3xl bg-white/[0.07] p-4 text-left transition hover:bg-white/[0.1] active:scale-[0.99]">
              <div className="text-lg font-black text-white">1. Check in</div>
              <div className="mt-1 text-sm text-zinc-400">Tell your coach how today feels</div>
            </button>
            <button onClick={() => setActiveTab("import")} className="rounded-3xl bg-white/[0.07] p-4 text-left transition hover:bg-white/[0.1] active:scale-[0.99]">
              <div className="text-lg font-black text-white">2. Import plan</div>
              <div className="mt-1 text-sm text-zinc-400">Paste the workout response</div>
            </button>
            <button onClick={() => setActiveTab("log")} className="rounded-3xl bg-white/[0.07] p-4 text-left transition hover:bg-white/[0.1] active:scale-[0.99]">
              <div className="text-lg font-black text-white">3. Log actuals</div>
              <div className="mt-1 text-sm text-zinc-400">Confirm or adjust each set</div>
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Daily check-in</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">Use this when you are already set up in a coaching chat. It tells ChatGPT what Pull Request needs back.</p>
          </div>
          <CopyButton text={checkinPrompt(profile, checkin)} label="Copy prompt" copiedLabel="Copied" fallbackTitle="Copy your daily workout prompt" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Weight today" value={checkin.weight} onChange={(v) => setCheckin({ ...checkin, weight: v })} placeholder="190.1" />
          <Field label="Available time" value={checkin.timeAvailable} onChange={(v) => setCheckin({ ...checkin, timeAvailable: v })} placeholder="45 minutes" />
          <Field label="Sleep" value={checkin.sleep} onChange={(v) => setCheckin({ ...checkin, sleep: v })} placeholder="Good / okay / rough" />
          <Field label="Energy" value={checkin.energy} onChange={(v) => setCheckin({ ...checkin, energy: v })} placeholder="Strong / medium / low" />
          <div className="sm:col-span-2">
            <Field label="Soreness or pain" value={checkin.soreness} onChange={(v) => setCheckin({ ...checkin, soreness: v })} placeholder="No foot issue, mild hamstring tightness..." textarea />
          </div>
          <div className="sm:col-span-2">
            <Field label="Today's constraints" value={checkin.constraints} onChange={(v) => setCheckin({ ...checkin, constraints: v })} placeholder="No Smith machine today, short on time, lower body only..." textarea />
          </div>
          <div className="sm:col-span-2">
            <Field label="Other notes" value={checkin.notes} onChange={(v) => setCheckin({ ...checkin, notes: v })} placeholder="Softball went great, feeling confident, want something efficient..." textarea />
          </div>
        </div>
      </Card>

      {currentWorkout && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Current workout</p>
              <h3 className="mt-1 text-2xl font-black text-white">{currentWorkout.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{workoutExerciseCount(currentWorkout)} exercises imported</p>
            </div>
            <button onClick={() => setActiveTab("log")} className="rounded-2xl bg-fuchsia-400 px-5 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-fuchsia-500/20 transition hover:bg-fuchsia-300 active:scale-[0.98]">
              Log this workout
            </button>
          </div>
        </Card>
      )}
    </main>
  );
}

function Profile({ profile, setProfile }) {
  const [mode, setMode] = useState("starter");
  const goalOptions = ["Fat loss", "Strength", "Muscle tone", "Longevity", "Mobility", "Confidence", "Athletic performance"];
  const paceOptions = ["Aggressive but sustainable 5-7 days/week", "Balanced 4-5 days/week", "Relaxed 2-3 days/week", "Recovery/rebuild mode"];
  const prompt = profilePrompt(profile, mode);

  function toggleGoal(goal) {
    const exists = profile.goals.includes(goal);
    setProfile({ ...profile, goals: exists ? profile.goals.filter((g) => g !== goal) : [...profile.goals, goal] });
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">First-time setup</p>
            <h2 className="text-3xl font-black text-white">Create your coaching context once.</h2>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Fill this out, copy the starter prompt, paste it into a new ChatGPT chat, and keep that chat as your ongoing workout coach. Come back here later when your goals, body, schedule, or equipment change.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:flex-col">
            <PillButton active={mode === "starter"} onClick={() => setMode("starter")}>Starter prompt</PillButton>
            <PillButton active={mode === "update"} onClick={() => setMode("update")}>Update prompt</PillButton>
            <CopyButton text={prompt} label={mode === "starter" ? "Copy setup prompt" : "Copy update prompt"} fallbackTitle="Profile prompt copy" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/8 p-4">
          <h3 className="font-black text-cyan-200">How this works</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-300">This prompt tells ChatGPT that Pull Request is the logging layer. ChatGPT still does the flexible coaching; this app makes the plan and actuals easier to move back and forth.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Your name" />
          <Field label="Age" value={profile.age} onChange={(v) => setProfile({ ...profile, age: v })} placeholder="45" />
          <Field label="Current weight" value={profile.currentWeight} onChange={(v) => setProfile({ ...profile, currentWeight: v })} placeholder="190" />
          <Field label="Goal weight" value={profile.goalWeight} onChange={(v) => setProfile({ ...profile, goalWeight: v })} placeholder="150" />
          <div className="sm:col-span-2">
            <span className="mb-3 block text-sm font-medium text-zinc-300">Goals</span>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => <PillButton key={goal} active={profile.goals.includes(goal)} onClick={() => toggleGoal(goal)}>{goal}</PillButton>)}
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="mb-3 block text-sm font-medium text-zinc-300">Training pace</span>
            <div className="flex flex-wrap gap-2">
              {paceOptions.map((pace) => <PillButton key={pace} active={profile.trainingPace === pace} onClick={() => setProfile({ ...profile, trainingPace: pace })}>{pace}</PillButton>)}
            </div>
          </div>
          <Field label="Activity level" value={profile.activityLevel} onChange={(v) => setProfile({ ...profile, activityLevel: v })} textarea />
          <Field label="Session length" value={profile.sessionLength} onChange={(v) => setProfile({ ...profile, sessionLength: v })} />
          <Field label="Gym access" value={profile.gymAccess} onChange={(v) => setProfile({ ...profile, gymAccess: v })} textarea />
          <Field label="Limitations / injuries" value={profile.limitations} onChange={(v) => setProfile({ ...profile, limitations: v })} textarea />
          <Field label="Favorites" value={profile.favorites} onChange={(v) => setProfile({ ...profile, favorites: v })} textarea />
          <Field label="Avoid" value={profile.avoid} onChange={(v) => setProfile({ ...profile, avoid: v })} textarea />
          <Field label="Coaching style" value={profile.coachingStyle} onChange={(v) => setProfile({ ...profile, coachingStyle: v })} textarea />
        </div>
      </Card>
    </main>
  );
}

function ImportWorkout({ importText, setImportText, setCurrentWorkout, setActiveTab }) {
  const [status, setStatus] = useState("");

  function importWorkout() {
    const workout = parseWorkout(importText);
    setCurrentWorkout(workout);
    setStatus(`Imported ${workoutExerciseCount(workout)} exercises.`);
    setActiveTab("log");
  }

  async function pasteFromClipboard() {
    setStatus("");
    try {
      if (!navigator.clipboard?.readText) throw new Error("Clipboard read unavailable");
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setStatus("Pasted from clipboard. Ready to import.");
    } catch {
      setStatus("Your browser blocked one-tap paste. Tap inside the box and paste manually.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Import workout</p>
        <h2 className="text-3xl font-black text-white">Paste ChatGPT's plan.</h2>
        <p className="mt-2 max-w-2xl text-zinc-400">The app understands warm-ups, supersets, big supersets, regular blocks, finishers, cooldowns, and optional cooldowns when they are labeled clearly.</p>
      </Card>
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <button onClick={pasteFromClipboard} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-white/10 transition hover:bg-zinc-200 active:scale-[0.98]">
            Paste from clipboard
          </button>
          <button onClick={() => setImportText("")} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-bold text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98]">
            Clear box
          </button>
          <button onClick={() => setImportText(sampleWorkoutText)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-bold text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98]">
            Load sample
          </button>
          <button onClick={importWorkout} className="rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 active:scale-[0.98]">
            Import workout
          </button>
        </div>
        {status && <p className="mb-4 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-zinc-300">{status}</p>}
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={20}
          className="min-h-[420px] w-full rounded-[1.5rem] border border-white/10 bg-zinc-950/75 p-4 font-mono text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-400/10"
          placeholder="Paste your workout here..."
        />
      </Card>
    </main>
  );
}

function formatNumber(number) {
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(1)));
}

function smartAdjustValue(value, amount, kind = "number") {
  const text = String(value || "").trim();
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);

  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    const base = amount >= 0 ? high : low;
    return formatNumber(Math.max(0, base + amount));
  }

  const firstNumberMatch = text.match(/\d+(?:\.\d+)?/);
  if (!firstNumberMatch) {
    return amount >= 0 ? formatNumber(amount) : "0";
  }

  const current = Number(firstNumberMatch[0]);
  const next = formatNumber(Math.max(0, current + amount));

  if (kind === "weight") {
    const before = text.slice(0, firstNumberMatch.index);
    const after = text.slice(firstNumberMatch.index + firstNumberMatch[0].length);
    return `${before}${next}${after}`.trim();
  }

  return next;
}

function repsForConfirmedSet(value) {
  const text = String(value || "").trim();
  const rangeMatch = text.match(/([0-9]+(?:[.][0-9]+)?)[ ]*[-–][ ]*([0-9]+(?:[.][0-9]+)?)/);
  if (rangeMatch) return formatNumber(Number(rangeMatch[2]));
  return text;
}

function Stepper({ value, onChange, placeholder, step = 1, kind = "number" }) {
  function adjust(amount) {
    onChange(smartAdjustValue(value, amount, kind));
  }
  return (
    <div className="grid w-full max-w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
      <button onClick={() => adjust(-step)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] text-xl font-black text-white active:scale-95 sm:h-12 sm:w-12">-</button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full min-w-0 rounded-2xl border border-white/10 bg-zinc-950/70 px-2 text-center text-base font-bold text-white outline-none focus:border-fuchsia-300/70 sm:h-12 sm:px-3"
      />
      <button onClick={() => adjust(step)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] text-xl font-black text-white active:scale-95 sm:h-12 sm:w-12">+</button>
    </div>
  );
}

function SetStatusBadge({ status }) {
  const map = {
    confirmed: "bg-emerald-300 text-zinc-950",
    edited: "bg-cyan-300 text-zinc-950",
    planned: "bg-amber-300/15 text-amber-200 border border-amber-300/20",
  };
  const label = status === "confirmed" ? "confirmed" : status === "edited" ? "edited" : "planned";
  return <span className={classNames("rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider", map[status] || map.planned)}>{label}</span>;
}

function ExerciseCard({ exercise, onChange }) {
  function updateSet(index, field, value) {
    const actualSets = exercise.actualSets.map((set, i) => i === index ? { ...set, [field]: value, status: "edited" } : set);
    onChange({ ...exercise, actualSets });
  }

  function confirmSet(index) {
    const actualSets = exercise.actualSets.map((set, i) =>
      i === index
        ? { ...set, reps: repsForConfirmedSet(set.plannedReps || set.reps), status: "confirmed" }
        : set
    );
    onChange({ ...exercise, actualSets });
  }

  function confirmAll() {
    const actualSets = exercise.actualSets.map((set) => ({
      ...set,
      reps: repsForConfirmedSet(set.plannedReps || set.reps),
      status: "confirmed",
    }));
    onChange({ ...exercise, actualSets, difficulty: exercise.difficulty || "Just right" });
  }

  function sameAsPrevious(index) {
    if (index <= 0) return;
    const prev = exercise.actualSets[index - 1];
    const actualSets = exercise.actualSets.map((set, i) => i === index ? { ...set, weight: prev.weight, reps: prev.reps, status: "edited" } : set);
    onChange({ ...exercise, actualSets });
  }

  const allConfirmed = exercise.actualSets.every((set) => set.status === "confirmed");

  return (
    <div className={classNames("w-full max-w-full overflow-hidden rounded-[1.5rem] border p-3 shadow-xl shadow-black/20 sm:rounded-[1.75rem] sm:p-4", allConfirmed ? "border-emerald-300/30 bg-emerald-300/[0.04]" : "border-white/10 bg-zinc-950/55")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xl font-black text-white">{exercise.name}</h4>
          <p className="mt-1 text-sm text-zinc-400">Plan: {exercise.sets} sets x {exercise.reps} {exercise.suggestedWeight ? `at ${exercise.suggestedWeight}` : ""}</p>
          {exercise.notes && <p className="mt-2 rounded-2xl bg-white/[0.05] px-3 py-2 text-sm leading-6 text-zinc-300">{exercise.notes}</p>}
        </div>
        <button
          onClick={() => onChange({ ...exercise, pain: !exercise.pain })}
          className={classNames(
            "shrink-0 rounded-2xl px-3 py-2 text-xs font-black transition active:scale-95",
            exercise.pain ? "bg-rose-400 text-zinc-950" : "bg-white/[0.07] text-zinc-300"
          )}
        >
          {exercise.pain ? "Pain" : "No pain"}
        </button>
      </div>

      <button onClick={confirmAll} className="mt-4 w-full rounded-2xl bg-emerald-300 px-3 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-200 active:scale-[0.98] sm:px-4">
        Yep, did this exercise as planned
      </button>

      <div className="mt-4 space-y-3">
        {exercise.actualSets.map((set, index) => (
          <div key={set.setNumber} className={classNames("w-full max-w-full overflow-hidden rounded-3xl border p-3", set.status === "confirmed" ? "border-emerald-300/20 bg-emerald-300/[0.06]" : set.status === "edited" ? "border-cyan-300/20 bg-cyan-300/[0.05]" : "border-amber-300/15 bg-amber-300/[0.04]")}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-zinc-200">Set {set.setNumber}</span>
                <SetStatusBadge status={set.status} />
              </div>
              <div className="flex gap-2">
                {index > 0 && <button onClick={() => sameAsPrevious(index)} className="rounded-full bg-white/[0.07] px-3 py-2 text-xs font-bold text-zinc-300">same as last</button>}
                <button onClick={() => confirmSet(index)} className="rounded-full bg-emerald-300/15 px-3 py-2 text-xs font-black text-emerald-200">did it</button>
              </div>
            </div>
            <p className="mb-3 text-xs leading-5 text-zinc-500">Prefilled from the plan. Tap "did it" to confirm, or edit the values to mark this set as changed.</p>
            <div className="grid w-full max-w-full gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Weight</div>
                <Stepper value={set.weight} onChange={(v) => updateSet(index, "weight", v)} placeholder="lbs" step={5} kind="weight" />
              </div>
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Reps / duration</div>
                <Stepper value={set.reps} onChange={(v) => updateSet(index, "reps", v)} placeholder="reps" step={1} kind="reps" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Difficulty</span>
        <div className="flex flex-wrap gap-2">
          {["Too easy", "Just right", "Hard", "Too hard"].map((label) => (
            <PillButton key={label} active={exercise.difficulty === label} onClick={() => onChange({ ...exercise, difficulty: label })}>{label}</PillButton>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Notes" value={exercise.actualNotes} onChange={(v) => onChange({ ...exercise, actualNotes: v })} placeholder="Felt strong, go up next time, form got messy..." textarea />
      </div>
    </div>
  );
}

function LogWorkout({ currentWorkout, setCurrentWorkout, setActiveTab, saveWorkoutToHistory }) {
  if (!currentWorkout) {
    return (
      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
        <Card>
          <h2 className="text-3xl font-black text-white">No workout imported yet.</h2>
          <p className="mt-2 text-zinc-400">Import a structured workout first, then come back here to log actuals.</p>
          <button onClick={() => setActiveTab("import")} className="mt-5 rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-zinc-950">Import workout</button>
        </Card>
      </main>
    );
  }
  function handleExerciseChange(exercise) {
    setCurrentWorkout(updateExercise(currentWorkout, exercise.id, () => exercise));
  }
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">Log actuals</p>
            <h2 className="text-3xl font-black text-white">{currentWorkout.title}</h2>
            <p className="mt-2 text-zinc-400">{currentWorkout.timeTarget || "No time target listed"} - {workoutExerciseCount(currentWorkout)} exercises</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Values are prefilled from the plan. Confirm what you did exactly, or edit what changed.</p>
          </div>
          <button onClick={() => { saveWorkoutToHistory({ ...currentWorkout, completed: true, completedDate: new Date().toISOString() }); setActiveTab("export"); }} className="rounded-2xl bg-fuchsia-400 px-5 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-fuchsia-500/20 transition hover:bg-fuchsia-300 active:scale-[0.98]">
            Finish workout
          </button>
        </div>
      </Card>
      {currentWorkout.sections.map((section) => {
        const style = sectionStyle(section.type || section.name);
        return (
          <Card key={section.id} className={classNames(style.border, style.bg)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className={classNames("text-xs font-black uppercase tracking-[0.2em]", style.accent)}>{style.tag}</p>
                <h3 className="mt-1 text-2xl font-black text-white">{section.name}</h3>
              </div>
              <div className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-bold text-zinc-400">{section.exercises.length} moves</div>
            </div>
            <div className="space-y-4">
              {section.exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} onChange={handleExerciseChange} />)}
            </div>
          </Card>
        );
      })}
    </main>
  );
}

function ExportUpdate({ currentWorkout, checkin }) {
  const update = useMemo(() => coachUpdate(currentWorkout, checkin), [currentWorkout, checkin]);
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Export coach update</p>
            <h2 className="text-3xl font-black text-white">Copy this back to ChatGPT.</h2>
            <p className="mt-2 max-w-2xl text-zinc-400">This tells your coach what was planned, what was confirmed, what changed, what hurt, and what needs progression decisions.</p>
          </div>
          {currentWorkout && <CopyButton text={update} label="Copy update" copiedLabel="Merged" fallbackTitle="Copy your completed workout update" />}
        </div>
      </Card>
      <Card>
        {currentWorkout ? (
          <textarea readOnly value={update} rows={24} className="min-h-[520px] w-full rounded-[1.5rem] border border-white/10 bg-zinc-950/75 p-4 font-mono text-sm leading-6 text-zinc-100 outline-none" />
        ) : (
          <p className="text-zinc-400">No workout is ready to export yet.</p>
        )}
      </Card>
    </main>
  );
}

function History({ workouts, setCurrentWorkout, setActiveTab }) {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
      <Card>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">Local history</p>
        <h2 className="text-3xl font-black text-white">Your recent merges.</h2>
        <p className="mt-2 text-zinc-400">Saved in this browser for now. Later, this can become account sync, trends, and AI-ready training history.</p>
      </Card>
      <div className="space-y-3">
        {workouts.length === 0 ? (
          <Card><p className="text-zinc-400">No completed workouts yet.</p></Card>
        ) : workouts.map((workout) => (
          <Card key={workout.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-white">{workout.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{new Date(workout.completedDate || workout.date).toLocaleString()} - {workoutExerciseCount(workout)} exercises</p>
              </div>
              <button onClick={() => { setCurrentWorkout(workout); setActiveTab("export"); }} className="rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/[0.12]">
                Open export
              </button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(() => loadJson(STORAGE_KEYS.profile, defaultProfile));
  const [checkin, setCheckin] = useState(defaultCheckin);
  const [importText, setImportText] = useState(sampleWorkoutText);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [workouts, setWorkouts] = useState(() => loadJson(STORAGE_KEYS.workouts, []));

  useEffect(() => saveJson(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => saveJson(STORAGE_KEYS.workouts, workouts), [workouts]);

  function saveWorkoutToHistory(workout) {
    setWorkouts((existing) => [workout, ...existing.filter((item) => item.id !== workout.id)].slice(0, 50));
    setCurrentWorkout(workout);
  }

  return (
    <Shell>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "home" && <Home profile={profile} checkin={checkin} setCheckin={setCheckin} setActiveTab={setActiveTab} currentWorkout={currentWorkout} />}
      {activeTab === "profile" && <Profile profile={profile} setProfile={setProfile} />}
      {activeTab === "import" && <ImportWorkout importText={importText} setImportText={setImportText} setCurrentWorkout={setCurrentWorkout} setActiveTab={setActiveTab} />}
      {activeTab === "log" && <LogWorkout currentWorkout={currentWorkout} setCurrentWorkout={setCurrentWorkout} setActiveTab={setActiveTab} saveWorkoutToHistory={saveWorkoutToHistory} />}
      {activeTab === "export" && <ExportUpdate currentWorkout={currentWorkout} checkin={checkin} />}
      {activeTab === "history" && <History workouts={workouts} setCurrentWorkout={setCurrentWorkout} setActiveTab={setActiveTab} />}
    </Shell>
  );
}

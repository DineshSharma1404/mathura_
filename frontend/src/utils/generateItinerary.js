import placesData from "../data/placesData";
import {
  areaTravelBufferMinutes,
  budgetRank,
  paceDailySlots,
  slotLabel,
  slotTips,
  timeSlotOrderByStart,
} from "../data/travelRules";

const mealBreakTemplates = [
  {
    id: "meal-lunch",
    name: "Lunch Break",
    category: "food",
    visitDurationHours: 1,
    mapLink: "",
  },
  {
    id: "meal-tea",
    name: "Tea and Local Snacks",
    category: "food",
    visitDurationHours: 0.75,
    mapLink: "",
  },
];

function buildPlacePool(preferences) {
  const { budget, interests } = preferences;
  const maxBudgetRank = budgetRank[budget] ?? budgetRank.medium;

  return placesData
    .filter((place) => (budgetRank[place.budgetLevel] ?? 1) <= maxBudgetRank)
    .map((place) => {
      let score = 0;
      if (interests.includes(place.category)) score += 4;
      if (place.tags.some((tag) => interests.includes(tag))) score += 3;
      if (place.bestTime === "morning") score += 1;
      if (place.category === "temple") score += 1;

      return { ...place, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });
}

function chunkByDays(items, days, slotsPerDay) {
  const result = Array.from({ length: days }, (_, index) => ({
    day: index + 1,
    activities: [],
  }));

  let pointer = 0;
  for (let day = 0; day < days; day += 1) {
    const quota = slotsPerDay;
    for (let count = 0; count < quota && pointer < items.length; count += 1) {
      result[day].activities.push(items[pointer]);
      pointer += 1;
    }
  }

  return result;
}

function withSlots(dayPlan, startPreference) {
  const slotOrder = timeSlotOrderByStart[startPreference] ?? [
    "morning",
    "afternoon",
    "evening",
    "night",
  ];

  return dayPlan.map((day) => {
    const timeline = day.activities.map((activity, index) => ({
      ...activity,
      slot: slotOrder[index % slotOrder.length],
      slotLabel: slotLabel[slotOrder[index % slotOrder.length]],
      tip: slotTips[slotOrder[index % slotOrder.length]],
    }));

    if (timeline.length > 1) {
      timeline.splice(1, 0, {
        ...mealBreakTemplates[0],
        slot: "afternoon",
        slotLabel: "Afternoon",
        tip: "Take a meal break before moving to next attraction.",
      });
    }

    return {
      ...day,
      timeline,
    };
  });
}

function buildDailySummary(dayTimeline) {
  const areas = new Set(
    dayTimeline
      .filter((item) => item.areaGroup)
      .map((item) => item.areaGroup)
      .filter(Boolean)
  );
  const travelBuffer =
    areas.size <= 1
      ? areaTravelBufferMinutes.sameArea
      : areaTravelBufferMinutes.differentArea;

  return {
    totalStops: dayTimeline.filter((item) => item.id).length,
    estimatedTravelBufferMinutes: travelBuffer,
    focusArea: areas.size <= 1 ? "Single cluster day" : "Mixed cluster day",
  };
}

export function generateItinerary(preferences) {
  const days = Number(preferences.days) || 1;
  const pace = preferences.pace || "balanced";
  const slotsPerDay = paceDailySlots[pace] ?? paceDailySlots.balanced;

  const placePool = buildPlacePool(preferences);
  const minimumNeeded = Math.max(days * slotsPerDay, days + 2);

  const fallbackPool =
    placePool.length >= minimumNeeded
      ? placePool
      : [...placePool, ...placesData].filter(
          (place, index, list) =>
            list.findIndex((item) => item.id === place.id) === index
        );

  const selected = fallbackPool.slice(0, minimumNeeded);
  const dayPlan = chunkByDays(selected, days, slotsPerDay);
  const withTimeline = withSlots(dayPlan, preferences.startPreference);

  const daysOutput = withTimeline.map((day) => ({
    day: day.day,
    summary: buildDailySummary(day.timeline),
    timeline: day.timeline,
  }));

  return {
    generatedAt: new Date().toISOString(),
    preferences,
    days: daysOutput,
    quickTips: [
      "Carry water and keep footwear easy to remove for temple entries.",
      "Reserve evening slots for aarti and spiritual experiences.",
      "Keep one flexible slot each day for rest or local exploration.",
    ],
  };
}

export function swapActivity(itinerary, dayNumber, activityId, preferences) {
  const pool = buildPlacePool(preferences);
  const dayIndex = dayNumber - 1;
  if (!itinerary?.days?.[dayIndex]) return itinerary;

  const currentDay = itinerary.days[dayIndex];
  const activity = currentDay.timeline.find((item) => item.id === activityId);
  if (!activity) return itinerary;

  const usedIds = new Set(
    itinerary.days.flatMap((day) => day.timeline.map((item) => item.id))
  );

  const replacement = pool.find(
    (place) => place.category === activity.category && !usedIds.has(place.id)
  );
  if (!replacement) return itinerary;

  const updatedTimeline = currentDay.timeline.map((item) =>
    item.id === activityId
      ? {
          ...replacement,
          slot: item.slot,
          slotLabel: item.slotLabel,
          tip: "Swapped based on similar category and current preferences.",
        }
      : item
  );

  const updatedDays = itinerary.days.map((day, index) =>
    index === dayIndex
      ? {
          ...day,
          timeline: updatedTimeline,
          summary: buildDailySummary(updatedTimeline),
        }
      : day
  );

  return {
    ...itinerary,
    days: updatedDays,
  };
}

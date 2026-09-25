import { processConversationInput } from "../lib/agent/processConversationInput";

const context = {
  state: "BOOK_SELECT_TIME" as const,
  requestedDate: "2026-08-10",
  appointmentMinutes: 60,
  availableSlots: [
    {
      startAt: "2026-08-10T18:00:00.000Z",
      endAt: "2026-08-10T19:00:00.000Z",
      localDate: "2026-08-10",
      localStartTime: "12:00",
      localEndTime: "13:00",
    },
    {
      startAt: "2026-08-10T19:00:00.000Z",
      endAt: "2026-08-10T20:00:00.000Z",
      localDate: "2026-08-10",
      localStartTime: "13:00",
      localEndTime: "14:00",
    },
    {
      startAt: "2026-08-10T20:00:00.000Z",
      endAt: "2026-08-10T21:00:00.000Z",
      localDate: "2026-08-10",
      localStartTime: "14:00",
      localEndTime: "15:00",
    },
  ],
};

console.log("\n=== BEFORE ===");
console.dir(context, {
  depth: null,
});

const result = processConversationInput({
  message: "2",
  context,
});

console.log("\n=== AFTER SELECTING OPTION 2 ===");
console.dir(result, {
  depth: null,
});
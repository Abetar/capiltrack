import { interpretPatientInput } from "../lib/agent/ai/interpretPatientInput";

const TEST_DATE = "2026-08-09";
const TEST_TIME = "14:20";
const TIMEZONE = "America/Mexico_City";

const tests = [
  "Quiero una cita mañana por la tarde",
  "Quiero cita el viernes",
  "¿Tienen algo después de las 4?",
  "Quiero una cita a las 4",
  "Quiero cancelar mi cita",
  "Necesito hablar con el doctor",
  "Tengo dolor después del trasplante, ¿qué hago?",
];

async function main() {
  for (const message of tests) {
    console.log("\n========================================");
    console.log("MESSAGE:");
    console.log(message);

    const result = await interpretPatientInput({
      message,
      currentDate: TEST_DATE,
      currentTime: TEST_TIME,
      timezone: TIMEZONE,
      context: {
        state: "MAIN_MENU",
      },
    });

    console.log("\nINTERPRETATION:");
    console.dir(result, {
      depth: null,
    });
  }
}

main().catch((error) => {
  console.error("\nTEST_AI_INTERPRETER_ERROR");
  console.error(error);
  process.exitCode = 1;
});
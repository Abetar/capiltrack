import {
  processConversationInput,
  startConversation,
} from "../lib/agent/processConversationInput";

console.log("\n=== START CONVERSATION ===");
console.dir(startConversation(), {
  depth: null,
});

const tests = [
  {
    name: "Opción 1 - Agendar",
    message: "1",
  },
  {
    name: "Texto conocido - Agendar",
    message: "agendar una cita",
  },
  {
    name: "Opción 2 - Administrar cita",
    message: "2",
  },
  {
    name: "Opción 3 - Cancelar",
    message: "3",
  },
  {
    name: "Opción 4 - Humano",
    message: "4",
  },
  {
    name: "Texto libre que requiere interpretación",
    message: "Hola, quería ver si tienen algo disponible para el viernes",
  },
];

for (const test of tests) {
  console.log(`\n=== ${test.name} ===`);

  const result = processConversationInput({
    message: test.message,
    context: {
      state: "MAIN_MENU",
    },
  });

  console.dir(result, {
    depth: null,
  });
}
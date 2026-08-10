import {
  getMainMenuResponse,
  resolveConversationState,
} from "./conversation-state";
import type {
  AgentResponse,
  ConversationContext,
} from "./types/conversation";

type ProcessConversationInput = {
  message: string;
  context?: ConversationContext | null;
};

export type ProcessConversationInputResult = {
  nextContext: ConversationContext;
  response: AgentResponse | null;

  handledDeterministically: boolean;
  requiresAiInterpretation: boolean;
};

function createInitialContext(): ConversationContext {
  return {
    state: "MAIN_MENU",
  };
}

export function processConversationInput({
  message,
  context,
}: ProcessConversationInput): ProcessConversationInputResult {
  const currentContext = context ?? createInitialContext();
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return {
      nextContext: currentContext,
      response: {
        text: "No pude identificar tu mensaje. ¿En qué te puedo ayudar?",
        options: getMainMenuResponse().options,
      },
      handledDeterministically: true,
      requiresAiInterpretation: false,
    };
  }

  const deterministicResult = resolveConversationState({
    message: trimmedMessage,
    context: currentContext,
  });

  if (deterministicResult.handled) {
    return {
      nextContext: deterministicResult.nextContext,
      response: deterministicResult.response,
      handledDeterministically: true,
      requiresAiInterpretation:
        deterministicResult.response?.requiresAiInterpretation ??
        false,
    };
  }

  return {
    nextContext: currentContext,
    response: null,
    handledDeterministically: false,
    requiresAiInterpretation: true,
  };
}

export function startConversation(): ProcessConversationInputResult {
  const context = createInitialContext();

  return {
    nextContext: context,
    response: getMainMenuResponse(),
    handledDeterministically: true,
    requiresAiInterpretation: false,
  };
}
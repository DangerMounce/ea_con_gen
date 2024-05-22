import { ensureEnvFileAndApiKey } from "./utils.js";

await ensureEnvFileAndApiKey();

const customerPresentAs = [
    "Frustrated",
    "Angry",
    "Anxious",
    "Confused",
    "Impatient",
    "Disappointed",
    "Upset",
    "Hopeful",
    "Relieved",
    "Happy",
    "Thankful",
    "Curious",
    "Worried",
    "Indifferent",
    "Stressed",
    "Satisfied",
    "Grateful",
    "Excited",
    "Appreciative",
    "Content",
    "Optimistic",
    "Pleased",
    "Reassured",
    "Encouraged",
    "Inspired"
];

const agentPresentAs = [
    "Empathetic",
    "Patient",
    "Understanding",
    "Confident",
    "Calm",
    "Supportive",
    "Encouraging",
    "Optimistic",
    "Reassuring",
    "Focused",
    "Respectful",
    "Professional",
    "Attentive",
    "Proactive",
    "Compassionate",
    "Frustrated",
    "Overwhelmed",
    "Anxious",
    "Tired",
    "Stressed",
    "Determined",
    "Motivated",
    "Engaged",
    "Cheerful",
    "Helpful"
];

const basePrompt = `Please provide a hypothetical conversation between a contact centre agent and a customer who are talking on live chat for an insurance company. The customer should present as ${customerPresentAs[Math.floor(Math.random() * customerPresentAs.length)]}. The conversation should be opened by the agent in a warm and positive manner and introducing the company as "Better Deal Insurance" and the agent as "Chris". The agent should present as ${agentPresentAs[Math.floor(Math.random() * agentPresentAs.length)]}.`;

const needForSecurityCheckStated = "At the appropriate time, the agent should also state the need for the customer to complete a security check before proceeding. To do this, they should use a statement containing one of the following sequences of words in their responses - \"take through security\",\"before proceeding can you confirm\", \"run through security\", \"go through security\", \"do security\", \"complete security\", \"for GDPR purposes can you confirm\", \"additional checks\",\"for security\".";

const customerIDandV = "The agent should ask for 3 pieces of information to validate the customer is the account holder. To do this, they should always ask for the following, using these sequences of words in their message: \"can you confirm your full name\", \"your date of birth\", \"first line of address and postcode\", \"confirm your email address\".";

const securityCheckConfirmed = "The agent should confirm to the customer that security has been complete using one of the following sequences of words in their response: \"thank you for completing security\", \"that's all correct\".";

const agentExploringSolutions = "The agent should explore a solution to the customer's problem by using at least one of the following sequences of words in their response: \"a possible resolution could be\", \"that's all sorted\", \"proposed solution\", \"we've agreed\", \"reached a consensus\", \"found a way forward\", \"glad we could help\",\"does this work for you\", \"what would be your preference\", \"present some options\", \"what would you prefer\".";

const agentCares = "The agent should show that they care for the customer and be courteous throughout the conversation. To demonstrate this, they should use at least one of the following sequences of words in their responses: \"please allow\", \"value your feedback\", \"certainly\", \"here to help\", \"we're on the same page\", \"I'm glad that I was able to help\", \"would you mind if\", \"please allow\", \"thank you\", \"you're welcome\", \"you are welcome\", \"can you please\".";

const agentEmpathy = "The agent should show empathy within the conversation by using at least one of the following sequences of words in their response: \"support for times likes these\", \"somebody to talk to\", \"deeply sorry\", \"apologies for any disappointment\", \"apologies for any inconvenience\", \"difficult time\", \"thank you for your patience\", \"sad loss\", \"sad time\", \"sorry you feel\", \"not the outcome\", \"apologize\", \"feel heard and supported\", \"sounds like a really rough situation\", \"I completely understand\".";

const conversationClose = "The agent should close the conversation in a warm and positive manner.";

const chatFormatInstructions = "It should reflect a real conversation that is fully laid out in terms of the complexity of the issue and the customer should either be easy to handle or difficult to handle. The customer\'s enquiry isn\'t resolved and should reflect as a detractor in terms of NPS. The transcript should be formatted in an array with alternating messages between the agent and the customer. Each message should be a separate object within the array that includes the following attributes: \"message\" and \"speaker_is_customer\" - this a boolean flat and should indicate if the speaker is the customer. You should only provide the array.";

function buildPrompt() {
    return basePrompt + " " + needForSecurityCheckStated + " " + customerIDandV + " " + securityCheckConfirmed + " " + agentExploringSolutions + " " + agentCares + " " + agentEmpathy + " " + conversationClose + " " + chatFormatInstructions;
}

export const prompt = [{
    "role": "system",
    "content": await buildPrompt()
}];

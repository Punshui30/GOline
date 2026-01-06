/**
 * LLM prompts for normalization, routing and extraction
 */

const NORMALIZER_FEW_SHOT_EXAMPLES = `
EXAMPLES:

Input: "Yo my card trippin, they said I'm good but I can't get nothin, and they keep sendin stuff to the old crib."
Output: {"normalized_text": "My card is not working. I was approved for benefits but cannot access them. Mail is being sent to my old address.", "signals": ["card_not_working", "approved_but_cant_access", "address_issue"], "questions_needed": ["Do you have the card in hand?", "What address is on file?"]}

Input: "I ain't get my food stamp card yet"
Output: {"normalized_text": "I have not received my SNAP card yet.", "signals": ["snap_card_never_arrived", "card_not_received"], "questions_needed": ["When were you approved?", "Have you moved recently?"]}

Input: "My shit got cut off"
Output: {"normalized_text": "My benefits were terminated.", "signals": ["benefits_terminated", "renewal_missed"], "questions_needed": ["When did this happen?", "Did you receive a letter about this?"]}

Input: "They talmbout bring proof but I don't got that"
Output: {"normalized_text": "They are asking for proof or documents that I do not have.", "signals": ["verification_barrier", "missing_documents"], "questions_needed": ["What documents do they need?", "Can you get copies of those documents?"]}

Input: "I'm sleeping outside / couch surfing"
Output: {"normalized_text": "I do not have stable housing. I am sleeping outside or staying with friends.", "signals": ["housing_instability", "mail_unreliable"], "questions_needed": ["Do you have an address where mail can reach you?", "Is there a safe place where you can receive mail?"]}

Input: "I don't drive / no ride"
Output: {"normalized_text": "I do not have transportation.", "signals": ["transportation_barrier"], "questions_needed": ["Is there a way to complete this online or by phone?"]}

Input: "My EBT card won't swipe at the store"
Output: {"normalized_text": "My EBT card is not working when I try to use it at the store.", "signals": ["card_not_working", "store_transaction_failed"], "questions_needed": ["Does the card work at ATMs?", "Is there a balance on the card?"]}

Input: "they sent me a letter but i cant read it"
Output: {"normalized_text": "I received a letter but cannot read or understand it.", "signals": ["got_a_letter", "literacy_barrier"], "questions_needed": ["Can someone help you read it?", "Is there a phone number on the letter?"]}

Input: "im hungry and my card dont work"
Output: {"normalized_text": "I am hungry and my benefits card is not working.", "signals": ["no_food", "card_not_working", "crisis"], "questions_needed": ["Where did you try to use the card?", "Do you have any food right now?"]}

Input: "medicaid said i need to do something but i forgot what"
Output: {"normalized_text": "Medicaid told me I need to do something but I cannot remember what it was.", "signals": ["medicaid_review", "deadline"], "questions_needed": ["Do you have the letter from Medicaid?", "When did they contact you?"]}

Input: "my address changed but idk how to update it"
Output: {"normalized_text": "My address changed but I do not know how to update it with benefits.", "signals": ["address_change", "update_needed"], "questions_needed": ["Do you have a new address?", "Do you have your case number?"]}

Input: "they approved me but i still cant buy food"
Output: {"normalized_text": "I was approved for benefits but still cannot buy food.", "signals": ["approved_but_cant_access", "no_food"], "questions_needed": ["Do you have the card?", "Is there money on the card?"]}

Input: "voice to text weirdness like umm uh wait what was I saying"
Output: {"normalized_text": "I need help with my benefits.", "signals": [], "questions_needed": ["What specific problem are you facing?"]}

Input: "FOOD STAMPS CARD BROKE HELP"
Output: {"normalized_text": "My food stamps card is broken and I need help.", "signals": ["card_not_working", "snap"], "questions_needed": ["What happens when you try to use it?", "Do you need a replacement card?"]}

Input: "my benefits stopped coming"
Output: {"normalized_text": "My benefits stopped.", "signals": ["benefits_terminated", "payments_stopped"], "questions_needed": ["When did they stop?", "Did you receive any letters?"]}

Input: "i got approved like 2 weeks ago but still no card in mail"
Output: {"normalized_text": "I was approved two weeks ago but have not received my card in the mail.", "signals": ["approved_but_no_card", "card_not_received"], "questions_needed": ["Has your address changed?", "Did they give you a tracking number?"]}

Input: "cant afford my meds even with medicaid"
Output: {"normalized_text": "I cannot afford my medications even though I have Medicaid.", "signals": ["medicaid", "medication_cost", "no_meds"], "questions_needed": ["Are the medications covered by your plan?", "Have you tried generic versions?"]}

Input: "they want papers i dont have"
Output: {"normalized_text": "They are asking for documents or papers that I do not have.", "signals": ["missing_documents", "verification_barrier"], "questions_needed": ["What specific documents do they need?", "Can you get copies from somewhere?"]}

Input: "my phone died and i missed their call now what"
Output: {"normalized_text": "My phone died and I missed a call from the benefits office. I do not know what to do now.", "signals": ["missed_contact", "follow_up_needed"], "questions_needed": ["Do you have a case number?", "Can you call them back?"]}

Input: "ebt balance says zero but they said i got approved"
Output: {"normalized_text": "My EBT card balance shows zero but I was told I was approved.", "signals": ["approved_but_cant_access", "balance_issue"], "questions_needed": ["When were you approved?", "Have benefits been loaded yet?"]}

Input: "they sent it to wrong address"
Output: {"normalized_text": "They sent something to the wrong address.", "signals": ["address_issue", "mail_misdirected"], "questions_needed": ["What did they send?", "Do you have the correct address to update?"]}

Input: "im confused about what they want me to do"
Output: {"normalized_text": "I am confused about what the benefits office wants me to do.", "signals": ["confusion", "instruction_unclear"], "questions_needed": ["Do you have a letter or notice?", "What did they tell you?"]}

Input: "card got stolen what do i do"
Output: {"normalized_text": "My benefits card was stolen and I need to know what to do.", "signals": ["card_stolen", "security_issue"], "questions_needed": ["When did this happen?", "Have you reported it?"]}

Input: "they keep saying im not eligible but i think i am"
Output: {"normalized_text": "They keep saying I am not eligible but I believe I should be eligible.", "signals": ["eligibility_denied", "appeal_needed"], "questions_needed": ["Do you have the denial letter?", "What reasons did they give?"]}

Input: "online portal wont let me log in"
Output: {"normalized_text": "The online portal will not let me log in.", "signals": ["portal_access_issue", "technology_barrier"], "questions_needed": ["Do you have your username?", "Have you tried resetting your password?"]}

Input: "i work but still cant pay bills"
Output: {"normalized_text": "I have a job but still cannot pay my bills.", "signals": ["income_insufficient", "financial_stress"], "questions_needed": ["Are you receiving any benefits now?", "Have you applied for assistance?"]}
`.trim();

export function getNormalizerPrompt(userText: string): string {
  return `You are a benefits intake translator. Your job is to convert raw user speech into clear, literal case notes.

RULES:
- User may use slang, profanity, fragments, or unclear grammar
- Do not judge. Do not correct tone. Do not refuse
- Output plain English at 6th grade reading level
- Preserve intent; don't add facts that weren't mentioned
- Focus on what they meant, not how they said it

INPUT: "${userText}"

${NORMALIZER_FEW_SHOT_EXAMPLES}

OUTPUT (JSON only, no markdown, no explanation):
{
  "normalized_text": "Clear plain English version of what they meant",
  "signals": ["signal1", "signal2"],
  "questions_needed": ["Question 1?", "Question 2?"]
}

COMMON SIGNALS:
- card_not_working, card_not_received, card_stolen
- approved_but_cant_access, benefits_terminated
- address_issue, address_change, mail_unreliable
- housing_instability, transportation_barrier
- missing_documents, verification_barrier
- no_food, no_meds, deadline, crisis
- got_a_letter, confusion, instruction_unclear

Respond with ONLY valid JSON, no other text.`;
}

export function getRouterPrompt(
  normalizedText: string,
  signals: string[],
  context: string = ''
): string {
  return `You are a routing assistant for a benefits navigator. Analyze the normalized case note and determine which route best matches the situation.

NORMALIZED CASE NOTE: "${normalizedText}"
SIGNALS: ${signals.join(', ')}

${context ? `CONTEXT:\n${context}\n` : ''}

AVAILABLE ROUTES:
- SNAP_CARD_ACCESS_FAILURE: User's SNAP/EBT card won't work at stores or ATMs
- MEDICAID_MAGI_REVIEW: User needs to complete a Medicaid MAGI eligibility review
- APPROVED_BUT_CANT_ACCESS: User was approved but can't access benefits
- META_GOT_A_LETTER: User received a letter they don't understand
- META_UNKNOWN: Fallback route when situation is unclear

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "confidence": 0.0-1.0,
  "candidate_routes": [{"id": "ROUTE_ID", "score": 0.0-1.0}],
  "extracted_facts": {"key": "value"},
  "crisis_flags": ["no_food", "no_meds", "deadline", etc.],
  "rationale_short": "One sentence explanation"
}

CRISIS FLAGS (include if mentioned or in signals):
- "no_food": User has no food
- "no_meds": User can't access needed medications
- "deadline": There's an urgent deadline
- "eviction": Risk of eviction
- "utilities": Utilities being shut off

EXTRACTED FACTS (relevant keys):
- "benefit_type": "SNAP", "Medicaid", etc.
- "card_type": "EBT", "SNAP", etc.
- "location": city/area if mentioned
- "has_letter": true/false
- "deadline_date": date if mentioned
- "address_issue": true if address problems mentioned

Respond with ONLY valid JSON, no other text.`;
}

export function getClarifyPrompt(userText: string, clarificationNeeded: string): string {
  return `The user said: "${userText}"

I need clarification on: ${clarificationNeeded}

Generate a single, empathetic question to ask the user. Keep it short (under 15 words). Respond with ONLY the question text, no quotation marks, no explanation.`;
}

export function getRepairPrompt(originalResponse: string, schemaDescription: string): string {
  return `The previous response was invalid JSON. Please return ONLY valid JSON matching this schema:

${schemaDescription}

Previous invalid response:
${originalResponse}

Return ONLY valid JSON, no markdown, no explanation.`;
}

import type { MissionDomain } from "./schedule";

/** Six cycle-specific assignments each week. New week stages raise expectations,
 * so repetitions deepen competence rather than becoming generic habit boxes. */
export interface Practice {
  domain: MissionDomain;
  title: string;
  action: string;
  standard: string;
  minutes: number;
}
type SixPractices = readonly [Practice, Practice, Practice, Practice, Practice, Practice];
const P = (domain: MissionDomain, title: string, action: string, standard: string, minutes = 30): Practice =>
  ({ domain, title, action, standard, minutes });

export const PLAYBOOK: Record<string, SixPractices> = {
  "first-response": [
    P("household", "Identify a failure point", "Inventory emergency water, light, medicine, and family contacts. Prioritize the most serious missing item.", "Write a gap and a realistic action."),
    P("medical", "First-aid foundations", "Use an accredited first-aid course or training resource. If qualified, safely rehearse a taught step.", "Name the skill and the source used."),
    P("mind", "The first five minutes", "Tabletop: emergency help is delayed. Practice calm assessment, requesting help, and reassessing safety.", "Write three safe priorities."),
    P("household", "Build the emergency kit", "Acquire or inspect a small part of your 72-hour supplies and record where it is stored.", "Check expiry, access, and family needs."),
    P("service", "Check on someone", "Ask a neighbor or relative whether they need help preparing for a common local emergency.", "Complete one agreed, practical action."),
    P("field", "Practice the response", "Run a safe household drill: emergency contacts, flashlight, safe exit, and first-aid kit location.", "Identify one mistake and correct it.", 60),
  ],
  "find-the-way": [
    P("navigation", "Read the neighborhood map", "Mark safe public paths, accessible transport options, and two family meeting points.", "Produce a readable annotated map."),
    P("navigation", "Map-and-compass basics", "Learn map orientation, compass safety, and basic bearing concepts from a reputable outdoor course.", "Demonstrate orientation on a familiar site."),
    P("mind", "Route blocked", "Tabletop: your planned road closes. Compare safe alternatives, official updates, and risk to vulnerable travelers.", "Choose a safe fallback and explain it."),
    P("navigation", "Go without GPS", "In daylight, use a paper map or compass on a familiar public route with a safe backup.", "Complete and document the route."),
    P("service", "Share the plan", "Help a willing family member understand the meeting point and check-in plan.", "They can explain the fallback."),
    P("field", "Safe navigation rehearsal", "Walk a planned public route in good conditions and verify landmarks and travel time.", "Document the route and one adjustment.", 60),
  ],
  "hold-the-home": [
    P("household", "Water inventory", "Compare stored drinking water to household needs; include pets and dependents.", "Record quantity, safe storage, and any shortage."),
    P("medical", "Water safety", "Learn the distinction between water storage, filtration, and disinfection from public health guidance.", "Identify a verified potable-water method."),
    P("household", "Sanitation", "Plan safe handwashing, hygiene supplies, and waste management during a water outage.", "Identify supplies and limits."),
    P("household", "Pantry check", "Inventory shelf-stable food and make a practical rotation list.", "Plan several balanced meals from stored food."),
    P("service", "Food access", "Support a local food pantry or help someone assemble a practical supply list.", "Complete one useful act of support."),
    P("field", "Cook from stores", "Prepare a family meal using planned supplies while maintaining normal food safety.", "Record gaps and storage improvements.", 60),
  ],
  "the-neighbor": [
    P("service", "Build trust", "With consent, establish a check-in agreement with someone nearby.", "Write how and when to check in."),
    P("medical", "Know who can help", "Identify accredited first-aid training and official local emergency services.", "Store verified contacts accessibly."),
    P("mind", "Rumor control", "Practice verifying one alarming claim before repeating it and correcting it calmly.", "Write your verification steps."),
    P("household", "Redundant contacts", "Create and test a family check-in plan with an out-of-area contact.", "Confirm a successful check-in."),
    P("service", "Practical hospitality", "Provide requested help or companionship to a person who might be isolated.", "Record what you contributed."),
    P("field", "Support-network rehearsal", "Walk through an emergency check-in with consenting people; do not simulate panic.", "Document which fallback works.", 60),
  ],
  "distance-and-load": [
    P("field", "Choose a safe baseline", "Measure an easy walk, its duration, and how you recovered; do not add pack load prematurely.", "Record baseline and next modest step."),
    P("medical", "Manage exertion", "Review signs of dehydration, heat illness, and overexertion from a trusted medical source.", "Name stop conditions."),
    P("mind", "Pace rather than prove", "Plan a sustainable route with rest points and decision points to turn back.", "Write stop rules and a safe fallback."),
    P("household", "Footwear and pack fit", "Check footwear, socks, pack straps, water, and load distribution.", "Resolve at least one avoidable issue."),
    P("service", "Support a partner", "Arrange a companion walk or help someone build a safe walking routine.", "Complete the agreed support."),
    P("field", "Progressive loaded walk", "Complete your programmed walk in safe conditions. Increase distance or load only as recovery permits.", "Log distance, load, effort, and recovery.", 60),
  ],
  "medical-composure": [
    P("medical", "Revisit first aid", "Review a skill from accredited training and identify what requires renewal or supervision.", "State the limits of your qualification."),
    P("medical", "Practice with instruction", "Use an accredited class or qualified demonstration for hands-on rehearsal.", "Document which skill was assessed."),
    P("mind", "Assess before acting", "Tabletop: someone is injured. Practice scene safety, emergency contact, and delegating calmly.", "Write a safe sequence."),
    P("household", "Restock first aid", "Inspect your first-aid kit and verify expiry and accessibility.", "Correct at least one gap."),
    P("service", "Connect to training", "Help a willing relative find first-aid resources or support an approved community event.", "Complete one useful action."),
    P("field", "Supervised medical scenario", "Take part in a qualified skills evaluation or a non-contact tabletop.", "Record feedback and the next retraining step.", 60),
  ],
  "shelter-and-weather": [
    P("household", "Weather plan", "Identify local weather alerts, shelter options, and safe indoor fallback.", "Create a basic weather decision card."),
    P("medical", "Exposure recognition", "Study hypothermia and heat illness warning signs from a trusted source.", "Name when to seek urgent help."),
    P("mind", "Decide to turn back", "Tabletop: weather worsens. Practice abandoning the plan before safety deteriorates.", "State clear stop thresholds."),
    P("field", "Shelter setup", "Practice pitching an appropriate shelter in comfortable daylight conditions.", "Show safe setup and packing."),
    P("service", "Check vulnerable neighbors", "Offer consent-based help during forecast extreme weather.", "Provide requested assistance."),
    P("field", "Controlled weather rehearsal", "Inspect a shelter, clothing system, and warming contingency without unsafe exposure.", "Document failure points.", 60),
  ],
  "peace-under-pressure": [
    P("mind", "Recognize escalation", "Review one argument or stressful encounter and identify triggers and exits.", "Write a calmer alternative."),
    P("medical", "Stress and breathing", "Learn a gentle, evidence-informed grounding or breathing method; avoid extreme breath-holding.", "Practice it briefly and note effects."),
    P("mind", "De-escalation language", "Rehearse respectful boundaries and non-threatening language.", "Write three phrases you'd actually use."),
    P("household", "Communicate decisions", "Explain an emergency plan to family without alarmism or coercion.", "Confirm everyone understands the choices."),
    P("service", "Choose mercy", "Help or listen patiently to someone you disagree with.", "Name the concrete act."),
    P("field", "Nonviolent tabletop", "Run a family scenario involving rumor, disagreement, and uncertainty.", "Document what calmed the situation.", 60),
  ],
  "water-and-mobility": [
    P("field", "Swimming baseline", "With suitable supervision, establish safe swimming competence; begin with instruction if needed.", "Record your current safe ability."),
    P("medical", "Water rescue principles", "Study drowning prevention and why untrained rescues can endanger two people.", "Explain when to call trained responders."),
    P("mind", "Flooding decision", "Tabletop: water crosses a road. Choose a safe route and avoid entering floodwater.", "Write your non-entry decision."),
    P("household", "Flood alert plan", "Learn official flood warnings and identify high-ground shelter alternatives.", "Update the family plan."),
    P("service", "Water-safety awareness", "Help share reputable water-safety information or support a local swim program.", "Record useful support."),
    P("field", "Supervised swim practice", "Complete a lesson or a safe continuous swim appropriate to current ability.", "Record duration, distance, and feedback.", 60),
  ],
  "repair-and-restore": [
    P("household", "Find a repair priority", "Inspect routine household maintenance tasks and identify one safe repair.", "List tools and hazards."),
    P("medical", "Tool safety", "Review eye protection, hand safety, ventilation, and when to call a licensed professional.", "Name tasks you will not attempt."),
    P("mind", "Make before break", "Tabletop: a critical appliance fails. Assess what you can safely isolate and which expert to contact.", "Write an escalation plan."),
    P("household", "Complete a basic repair", "Safely perform simple non-electrical, non-structural maintenance or observe a qualified professional.", "Document the completed work."),
    P("service", "Offer practical help", "Help someone with a safe household task they consent to.", "Complete a useful repair or support."),
    P("field", "Maintenance rehearsal", "Review accessible shutoffs and safe inspection routines without disturbing dangerous systems.", "Create a household maintenance map.", 60),
  ],
  "truth-and-witness": [
    P("faith", "Know your conviction", "Read the weekly Scripture and summarize its principle in your own words.", "Write a precise, charitable explanation."),
    P("faith", "Learn from history", "Read a documented Christian response to persecution and distinguish facts from myths.", "Identify a courageous and peaceful action."),
    P("mind", "Refuse the enemy image", "Roleplay a hostile question and answer truthfully without insulting the questioner.", "State an answer that preserves dignity."),
    P("household", "Freedom and support", "Review legal rights to worship and practical contacts for peaceful assistance.", "Document legitimate support options."),
    P("service", "Care across differences", "Do an act of care for someone regardless of religious belief.", "Record meaningful service."),
    P("field", "Witness tabletop", "Discuss an ethical dilemma involving faith, intimidation, and nonviolent choices.", "Explain how you would remain faithful and protect others.", 60),
  ],
  "community-care": [
    P("service", "Find a trusted group", "Identify an established church or aid organization with appropriate volunteer safeguards.", "Confirm a legitimate opportunity."),
    P("medical", "Know your role", "Learn the qualifications and boundaries needed for the volunteer work.", "List what you may and may not do."),
    P("mind", "Listen before directing", "Practice asking what aid is wanted rather than assuming needs.", "Write three useful listening questions."),
    P("household", "Prepare to give", "Organize a practical donation or transport plan requested by the organization.", "Confirm suitability before sending."),
    P("service", "Show up", "Volunteer or complete a directly useful task in an approved setting.", "Record an actual contribution."),
    P("field", "Debrief the service", "Review your work with a volunteer lead if possible and identify a better way to help.", "Document one process improvement.", 60),
  ],
  "extended-disruption": [
    P("household", "Seven-day essentials", "Audit necessary supplies for a week-long home disruption including medications and sanitation.", "Prioritize one shortage."),
    P("medical", "Medicine continuity", "Discuss appropriate continuity planning with a healthcare professional where needed.", "Record safe options, without stockpiling prescriptions."),
    P("mind", "Competing constraints", "Tabletop: transport, electricity, and payment systems fail. Choose priorities rationally.", "Document the decision sequence."),
    P("household", "Information fallback", "Check battery power, official alerts, and a low-tech communication plan.", "Demonstrate a working fallback."),
    P("service", "Share practical assistance", "Help a willing person check their own emergency kit or communications plan.", "Record the assistance."),
    P("field", "Safe outage tabletop", "Run a household walkthrough, not a dangerous real power shutoff. Keep medical and heating needs protected.", "Record three corrective actions.", 60),
  ],
  "mobility-retest": [
    P("field", "Compare baselines", "Review your earlier walking, strength, and endurance results.", "Identify one meaningful metric to retest."),
    P("medical", "Recovery audit", "Review pain, sleep, recovery, and any limitations before testing.", "Choose appropriate effort and stop rules."),
    P("mind", "Train without ego", "Plan a test that measures reality rather than chasing a number at any cost.", "Write an honest pass/fail criterion."),
    P("field", "Practice the benchmark", "Perform technique work and an appropriate submaximal rehearsal.", "Log measured data."),
    P("service", "Make training useful", "Help a relative or training partner with a practical task or accessible activity.", "Complete the support."),
    P("field", "Retest", "Repeat a safe measured walk, carry, or aerobic test after adequate preparation.", "Compare results and note conditions.", 60),
  ],
  "lead-with-calm": [
    P("mind", "Identify the mission", "Practice stating an emergency goal in one calm sentence without speculation.", "Write a clear goal and constraints."),
    P("medical", "Delegate to competence", "Map which tasks require professional medical or technical qualifications.", "Assign roles realistically in a tabletop."),
    P("mind", "Listen for missing facts", "Roleplay receiving conflicting reports before making a decision.", "State what must be verified."),
    P("household", "Rehearse family roles", "Discuss who contacts relatives, checks supplies, and aids vulnerable people.", "Everyone understands their chosen role."),
    P("service", "Serve without command", "Volunteer for a concrete task and practice cooperation.", "Complete the task and accept feedback."),
    P("field", "Lead a safe tabletop", "Coordinate a consenting group through a nonviolent outage scenario.", "Ask for feedback and document improvements.", 60),
  ],
  "protect-the-vulnerable": [
    P("household", "Accessibility review", "Identify mobility, medical, childcare, and pet needs in a family emergency plan.", "Document accommodations."),
    P("medical", "Relevant aid contacts", "Find official services, emergency medical numbers, and accessible transport information.", "Verify and store contacts."),
    P("mind", "Avoid abandonment", "Tabletop: an elderly person needs extra evacuation time. Plan lawful, realistic assistance.", "Choose a safe supportive option."),
    P("household", "Accessible kit", "Adjust one emergency supply or communication resource for a dependent's needs.", "Demonstrate usability."),
    P("service", "Offer accessible help", "Ask an affected person or caregiver what assistance they actually want.", "Complete an agreed action."),
    P("field", "Inclusive evacuation plan", "Walk through an accessible route and check-in plan without exposing anyone to danger.", "Identify and fix one barrier.", 60),
  ],
  "systems-audit": [
    P("household", "Map dependencies", "List utilities, food, medicine, communications, income, and support networks.", "Identify the top dependency."),
    P("medical", "Medical continuity audit", "Check certifications, first aid, and legitimate medical contacts.", "Record expiry dates and gaps."),
    P("mind", "Cascading failure", "Tabletop: two essential systems stop working. Compare safe priorities and tradeoffs.", "Write a decision path."),
    P("household", "Correct a gap", "Resolve one audited weak point rather than merely collecting gear.", "Document the actual improvement."),
    P("service", "Bring others along", "Help a willing household conduct a proportionate preparedness audit.", "Deliver a practical improvement."),
    P("field", "Systems tabletop", "Review multiple outages with official guidance and safe fallbacks.", "Update the family readiness plan.", 60),
  ],
  "renew-and-recertify": [
    P("medical", "Audit credentials", "Review first-aid certifications and identify appropriate refresher courses.", "Record dates and renewal plans."),
    P("navigation", "Recheck fundamentals", "Demonstrate a familiar navigation skill safely in daylight.", "Record what was retained and forgotten."),
    P("mind", "Admit skill erosion", "Identify a skill you used to know but can no longer demonstrate.", "Choose concrete remedial practice."),
    P("household", "Refresh supplies", "Inspect expiry dates, batteries, documents, and emergency numbers.", "Replace or update an obsolete item."),
    P("service", "Connect someone to training", "Help a willing person find an accredited class or established volunteer group.", "Complete a useful connection."),
    P("field", "Competence retest", "Complete a supervised skill refresher or evidence-based tabletop rehearsal.", "Record an actual assessment, not assumed competence.", 60),
  ],
  "steadfast-service": [
    P("faith", "Scripture under pressure", "Study passages on persecution, humility, forgiveness, and courageous witness.", "Write a faithful, nonviolent application."),
    P("service", "Help across difference", "Perform an act of service without screening for a shared belief.", "Complete meaningful assistance."),
    P("mind", "De-escalate a divide", "Practice answering an inflammatory claim truthfully and respectfully.", "Write a calmer response."),
    P("household", "Protect relationships", "Discuss family boundaries and peaceful options during religious hostility.", "Agree on a practical, compassionate plan."),
    P("service", "Sustained commitment", "Keep an existing volunteer commitment even when inconvenient.", "Record actual service."),
    P("field", "Ethical dilemma", "Tabletop: religious hostility rises. Practice lawful de-escalation, aid, and support resources.", "Record choices that protect everyone's dignity.", 60),
  ],
  "final-crucible": [
    P("household", "Full readiness audit", "Review evacuation, water, food, contacts, accessible needs, and legitimate support.", "Document the most important remaining gap."),
    P("medical", "Demonstrate first aid", "Seek appropriate qualified skills verification without improvising treatment.", "Record observed competence and limitations."),
    P("mind", "Decide in uncertainty", "Tabletop a compound emergency, prioritizing safety and reliable information.", "Write a defensible decision sequence."),
    P("navigation", "Confirm safe alternatives", "Verify meeting points, public evacuation routes, and official local advisories.", "Update and share the family plan."),
    P("service", "Deliver practical help", "Complete a meaningful task with a church or recognized community group.", "Record an outcome that helped others."),
    P("field", "Integrate the response", "Run a supervised civilian tabletop combining an outage, evacuation, faithfulness, and mutual aid.", "Record evidence, feedback, and the next five-year priorities.", 90),
  ],
};

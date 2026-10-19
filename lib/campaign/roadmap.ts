/** Twenty 13-week arcs spanning five calendar years. Scenario stakes are hypothetical,
 * not a forecast of war. Every assessment is civilian, safe, and non-confrontational. */
export interface CampaignCycle {
  id: string;
  year: number;
  quarter: number;
  title: string;
  focus: string;
  capability: string;
  scenario: string;
  capstone: string;
}

export const CAMPAIGN_CYCLES: readonly CampaignCycle[] = [
  { id: "first-response", year: 1, quarter: 1, title: "The First Response", focus: "first aid and household emergency basics", capability: "complete first-aid training and assemble a household emergency kit", scenario: "A regional outage leaves neighbors without ordinary services.", capstone: "Show your kit, household contacts, and current first-aid training plan." },
  { id: "find-the-way", year: 1, quarter: 2, title: "Find the Way", focus: "maps, navigation, and safe travel", capability: "navigate a familiar daylight route with a paper map and compass", scenario: "Cell service fails during a family evacuation.", capstone: "Complete a safe daytime navigation exercise and document your route." },
  { id: "hold-the-home", year: 1, quarter: 3, title: "Hold the Home", focus: "water, food, sanitation, and household resilience", capability: "maintain two weeks of appropriate household essentials", scenario: "An infrastructure disruption limits water and grocery access.", capstone: "Run a supervised household supply audit and a safe meal-and-water drill." },
  { id: "the-neighbor", year: 1, quarter: 4, title: "The Neighbor", focus: "service, communications, and shared contingency plans", capability: "form a reliable support network and a family communications plan", scenario: "A local emergency leaves an isolated neighbor in need of help.", capstone: "Review a consent-based check-in plan and complete an act of practical service." },
  { id: "distance-and-load", year: 2, quarter: 1, title: "Distance and Load", focus: "progressive hiking, carrying, and endurance", capability: "build safe loaded walking endurance from your current baseline", scenario: "A vehicle breakdown requires an extended walk to a safe destination.", capstone: "Complete a progressively trained loaded hike on a safe public route." },
  { id: "medical-composure", year: 2, quarter: 2, title: "Medical Composure", focus: "first-aid refreshers and calm emergency decisions", capability: "demonstrate first-aid skills under qualified supervision", scenario: "An injury occurs while emergency services are delayed.", capstone: "Complete a qualified first-aid refresher or supervised skills evaluation." },
  { id: "shelter-and-weather", year: 2, quarter: 3, title: "Shelter and Weather", focus: "weather judgment and safe outdoor shelter", capability: "recognize exposure risks and prepare weather-appropriate shelter", scenario: "An unexpected overnight delay exposes a group to cold weather.", capstone: "Demonstrate safe shelter setup in controlled conditions." },
  { id: "peace-under-pressure", year: 2, quarter: 4, title: "Peace Under Pressure", focus: "de-escalation, ethical decisions, and family leadership", capability: "practice conflict de-escalation and emergency decision-making", scenario: "Fear and rumors escalate tensions during an evacuation.", capstone: "Run a tabletop de-escalation and family communication exercise." },
  { id: "water-and-mobility", year: 3, quarter: 1, title: "Water and Mobility", focus: "swimming competence and water safety", capability: "build continuous swimming ability with qualified instruction", scenario: "Flooding closes usual travel routes and threatens water safety.", capstone: "Complete an appropriate supervised swim and water-safety assessment." },
  { id: "repair-and-restore", year: 3, quarter: 2, title: "Repair and Restore", focus: "basic repairs, tools, and safe home maintenance", capability: "complete basic repairs while respecting electrical and structural hazards", scenario: "Utilities and repair services are interrupted for several days.", capstone: "Document safe repairs and a household maintenance checklist." },
  { id: "truth-and-witness", year: 3, quarter: 3, title: "Truth and Witness", focus: "Scripture, discernment, and religious freedom", capability: "articulate Christian convictions without hatred or coercion", scenario: "Hostility toward your faith creates pressure to compromise or retaliate.", capstone: "Write and discuss a faithful, peaceful response to a persecution scenario." },
  { id: "community-care", year: 3, quarter: 4, title: "Community Care", focus: "organized volunteering and vulnerable-neighbor support", capability: "serve consistently with an established church or aid organization", scenario: "Displaced families arrive in your community seeking shelter and food.", capstone: "Complete a supervised volunteer effort and review what you learned." },
  { id: "extended-disruption", year: 4, quarter: 1, title: "Extended Disruption", focus: "seven-day household disruption planning", capability: "coordinate supplies, sanitation, and communication over time", scenario: "A week-long outage disrupts heating, payments, and communications.", capstone: "Run a safe household tabletop exercise without compromising essential needs." },
  { id: "mobility-retest", year: 4, quarter: 2, title: "Mobility Retest", focus: "endurance, strength, and movement assessment", capability: "improve physical test results without overtraining", scenario: "Your family needs to walk a long distance with essential belongings.", capstone: "Retest a safe hike, carry, and aerobic benchmark against your baseline." },
  { id: "lead-with-calm", year: 4, quarter: 3, title: "Lead With Calm", focus: "team coordination and compassionate leadership", capability: "coordinate a clear response while listening and delegating", scenario: "A shelter must organize assistance while information is uncertain.", capstone: "Lead a consent-based household or volunteer tabletop drill." },
  { id: "protect-the-vulnerable", year: 4, quarter: 4, title: "Protect the Vulnerable", focus: "medical access, accommodation, and hospitality", capability: "plan support for children, elders, and people with disabilities", scenario: "An evacuation notice affects people who cannot leave easily.", capstone: "Complete an inclusive, non-confrontational evacuation plan review." },
  { id: "systems-audit", year: 5, quarter: 1, title: "Systems Audit", focus: "comprehensive home and family readiness audits", capability: "identify and fix the most consequential weak points", scenario: "Multiple services fail simultaneously with little notice.", capstone: "Complete a full household readiness audit with corrective actions." },
  { id: "renew-and-recertify", year: 5, quarter: 2, title: "Renew and Recertify", focus: "skill refreshers and certifications", capability: "refresh first aid, navigation, and outdoor safety competencies", scenario: "An old skill is required in a rapidly changing emergency.", capstone: "Complete appropriate supervised retests and certification renewals." },
  { id: "steadfast-service", year: 5, quarter: 3, title: "Steadfast Service", focus: "service during disagreement and religious tension", capability: "serve others faithfully without discrimination or violence", scenario: "Religious hostility divides families and neighbors.", capstone: "Demonstrate a sustained record of practical, peaceful community service." },
  { id: "final-crucible", year: 5, quarter: 4, title: "The Final Crucible", focus: "integrated civilian preparedness and Christian character", capability: "coordinate safe family plans and demonstrate retained skills", scenario: "Civil unrest and prolonged outages demand both practical readiness and mercy.", capstone: "Complete a supervised integrated tabletop, physical, and service review." },
];

export const WEEK_STAGES = [
  "Establish the baseline", "Learn the essentials", "Practice with guidance",
  "Verify fundamentals", "Improve the weak link", "Add a contingency",
  "Retest the basics", "Practice independently", "Teach the principle",
  "Run a safe scenario", "Correct mistakes", "Rehearse the full response",
  "Assessment and reflection",
] as const;

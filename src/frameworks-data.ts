export interface Framework {
  id: string;
  name: string;
  category: string;
  origin: string;
  description: string;
  whenToUse: string;
  keyComponents: string[];
  pros: string[];
  cons: string[];
  adhdTip: string;
  related: string[];
  tags: string[];
}

export const FRAMEWORK_CATEGORIES = [
  'Strategy',
  'Leadership & Management',
  'Decision-Making',
  'Problem-Solving',
  'Change & Transformation',
  'People & Talent',
  'Teams & Culture',
  'Communication & Influence',
  'Operations & Process',
  'Governance & Risk',
  'Project & Portfolio',
  'HR & Organisation',
] as const;

export type FrameworkCategory = typeof FRAMEWORK_CATEGORIES[number];

export const FRAMEWORKS: Framework[] = [
  // ── Strategy ──────────────────────────────────────────────────────────────
  {
    id: 'balanced-scorecard',
    name: 'Balanced Scorecard',
    category: 'Strategy',
    origin: 'Kaplan & Norton, 1992',
    description:
      'A strategic planning and management system that translates an organisation\'s vision and strategy into a balanced set of performance measures across four perspectives. It links day-to-day operations to long-term strategy.',
    whenToUse:
      'When aligning teams and initiatives to organisational strategy, setting KPIs, or communicating strategy across the business.',
    keyComponents: [
      'Financial perspective — revenue, profitability, cost reduction',
      'Customer perspective — satisfaction, retention, market share',
      'Internal process perspective — quality, cycle time, productivity',
      'Learning & growth perspective — employee skills, culture, systems',
      'Strategic objectives linked across all four perspectives',
      'Cause-and-effect relationships between measures',
    ],
    pros: ['Creates strategic alignment', 'Balances short- and long-term focus', 'Easy to communicate across levels'],
    cons: ['Can become overly complex', 'Requires sustained leadership commitment', 'Lag indicators dominate'],
    adhdTip: 'Pick ONE metric per perspective to focus on this quarter. More than four numbers is too many.',
    related: ['okr', 'three-horizons', 'mckinsey-7s'],
    tags: ['strategy', 'kpi', 'measurement', 'alignment'],
  },
  {
    id: 'mckinsey-7s',
    name: 'McKinsey 7S',
    category: 'Strategy',
    origin: 'Tom Peters & Robert Waterman, McKinsey & Co., 1980',
    description:
      'A model for analysing and improving organisational effectiveness by examining seven interdependent elements: Strategy, Structure, Systems, Shared Values, Style, Staff, and Skills. All seven must be aligned for an organisation to perform well.',
    whenToUse:
      'During organisational redesign, mergers, culture change initiatives, or diagnosing why strategy execution is failing.',
    keyComponents: [
      'Strategy — plan to achieve competitive advantage',
      'Structure — how the organisation is arranged',
      'Systems — processes and workflows',
      'Shared Values — core beliefs and culture (the centre of the model)',
      'Style — leadership and management approach',
      'Staff — people and their capabilities',
      'Skills — core competencies of the organisation',
    ],
    pros: ['Holistic view of the organisation', 'Surfaces hidden misalignments', 'Applies to teams and whole orgs'],
    cons: ['No explicit prioritisation guidance', 'Analysis can be subjective', 'Static snapshot rather than dynamic'],
    adhdTip: 'Rate each "S" 1-5 on alignment. The lowest two scores tell you where to focus first.',
    related: ['balanced-scorecard', 'blue-ocean', 'change-management-kotter'],
    tags: ['strategy', 'organisational design', 'alignment', 'diagnosis'],
  },
  {
    id: 'blue-ocean',
    name: 'Blue Ocean Strategy',
    category: 'Strategy',
    origin: 'W. Chan Kim & Renée Mauborgne, 2005',
    description:
      'A strategy framework that encourages organisations to create uncontested market space ("blue oceans") rather than competing in existing crowded markets ("red oceans"). It uses the ERRC grid and Strategy Canvas to innovate value.',
    whenToUse:
      'When looking to differentiate, enter new markets, or escape intense competition in a commoditised space.',
    keyComponents: [
      'ERRC Grid — Eliminate, Reduce, Raise, Create factors',
      'Strategy Canvas — visual comparison of value curves',
      'Value Innovation — simultaneously pursuing differentiation and low cost',
      'Four Actions Framework',
      'Buyer utility map',
      'Noncustomer analysis',
    ],
    pros: ['Encourages breakthrough thinking', 'Combines cost and differentiation', 'Visual and intuitive tools'],
    cons: ['Blue oceans attract competition quickly', 'Hard to identify real untapped markets', 'Execution details are light'],
    adhdTip: 'Use the ERRC grid in a 30-minute whiteboard session — it forces concrete trade-offs fast.',
    related: ['porters-five-forces', 'ansoff-matrix', 'business-model-canvas'],
    tags: ['strategy', 'innovation', 'differentiation', 'market'],
  },
  {
    id: 'porters-five-forces',
    name: "Porter's Five Forces",
    category: 'Strategy',
    origin: 'Michael Porter, Harvard Business School, 1979',
    description:
      'A competitive analysis framework identifying five forces that shape industry profitability: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, and competitive rivalry.',
    whenToUse:
      'When entering a new market, evaluating competitive position, or developing pricing and partnership strategy.',
    keyComponents: [
      'Competitive rivalry — intensity of competition among existing players',
      'Threat of new entrants — barriers to entry',
      'Bargaining power of suppliers — supplier concentration and switching costs',
      'Bargaining power of buyers — customer concentration and price sensitivity',
      'Threat of substitutes — alternative products or services',
    ],
    pros: ['Structured competitive analysis', 'Widely understood', 'Identifies profitability drivers'],
    cons: ['Static — misses dynamic markets', 'Ignores complementors', 'Less relevant for platform businesses'],
    adhdTip: 'Rate each force High/Medium/Low and identify ONE strategic action per high-threat force.',
    related: ['blue-ocean', 'ansoff-matrix', 'pestle'],
    tags: ['strategy', 'competition', 'market analysis', 'industry'],
  },
  {
    id: 'ansoff-matrix',
    name: 'Ansoff Matrix',
    category: 'Strategy',
    origin: 'Igor Ansoff, 1957',
    description:
      'A 2×2 strategic planning tool that maps growth options against products and markets: Market Penetration, Market Development, Product Development, and Diversification. Each quadrant carries increasing levels of risk.',
    whenToUse: 'When evaluating growth options, prioritising investment, or communicating growth strategy to stakeholders.',
    keyComponents: [
      'Market Penetration — existing products in existing markets',
      'Market Development — existing products in new markets',
      'Product Development — new products in existing markets',
      'Diversification — new products in new markets',
      'Risk assessment across quadrants',
      'Resource allocation decisions',
    ],
    pros: ['Simple and visual', 'Clarifies risk levels of growth options', 'Easy to facilitate with teams'],
    cons: ['Oversimplifies complex decisions', 'Ignores competitive dynamics', 'Binary product/market distinction'],
    adhdTip: 'Start with Market Penetration before jumping to Diversification — lowest risk, fastest wins.',
    related: ['blue-ocean', 'porters-five-forces', 'business-model-canvas'],
    tags: ['strategy', 'growth', 'product', 'market'],
  },
  {
    id: 'pestle',
    name: 'PESTLE Analysis',
    category: 'Strategy',
    origin: 'Francis Aguilar, 1967 (ETPS); expanded over decades',
    description:
      'An environmental scanning framework covering Political, Economic, Social, Technological, Legal, and Environmental factors. Used to understand the macro-environment and identify opportunities and threats outside the organisation\'s control.',
    whenToUse:
      'When conducting strategic planning, entering new markets, or assessing external risks for a project or initiative.',
    keyComponents: [
      'Political — government policy, political stability, trade',
      'Economic — growth rates, inflation, exchange rates',
      'Social — demographics, culture, lifestyle trends',
      'Technological — innovation, automation, R&D',
      'Legal — regulations, employment law, IP',
      'Environmental — climate, sustainability, resource scarcity',
    ],
    pros: ['Comprehensive external view', 'Easy to learn and facilitate', 'Good input to SWOT'],
    cons: ['Can generate too many factors without prioritisation', 'Quickly becomes outdated', 'No strategic action guidance'],
    adhdTip: 'Timebox to 20 minutes per factor. List only the top three items per letter, then prioritise the full list.',
    related: ['porters-five-forces', 'balanced-scorecard', 'risk-management'],
    tags: ['strategy', 'environment', 'risk', 'planning'],
  },
  {
    id: 'three-horizons',
    name: 'Three Horizons',
    category: 'Strategy',
    origin: 'Baghai, Coley & White, McKinsey & Co., 1999',
    description:
      'A framework for managing business growth across three time horizons simultaneously: defending the core (H1), nurturing emerging businesses (H2), and seeding future options (H3). Helps avoid overinvesting in the present at the expense of the future.',
    whenToUse:
      'When balancing operational demands with innovation investment, or when leadership debate prioritisation of new initiatives.',
    keyComponents: [
      'H1 — Extend and defend core business (0-12 months)',
      'H2 — Build emerging businesses (1-3 years)',
      'H3 — Seed future options (3-5+ years)',
      'Portfolio of bets across all three horizons',
      'Resource allocation across horizons',
      'Transition management from H3 → H2 → H1',
    ],
    pros: ['Prevents short-termism', 'Balances exploitation and exploration', 'Easy to communicate'],
    cons: ['Horizon timelines are industry-dependent', 'Tension between horizons needs active management', 'H3 often underfunded'],
    adhdTip: 'Block time for H3 thinking in your calendar — it\'s the first thing that disappears under pressure.',
    related: ['balanced-scorecard', 'okr', 'blue-ocean'],
    tags: ['strategy', 'innovation', 'portfolio', 'planning'],
  },
  {
    id: 'business-model-canvas',
    name: 'Business Model Canvas',
    category: 'Strategy',
    origin: 'Alexander Osterwalder, 2008',
    description:
      'A one-page visual template for developing and describing business models across nine building blocks: value proposition, customer segments, channels, customer relationships, revenue streams, key resources, key activities, key partnerships, and cost structure.',
    whenToUse:
      'When designing a new business model, pivoting strategy, evaluating a competitor\'s model, or communicating strategy concisely.',
    keyComponents: [
      'Value Propositions — what problem do we solve?',
      'Customer Segments — who are we creating value for?',
      'Channels — how do we reach customers?',
      'Customer Relationships — what type of relationship?',
      'Revenue Streams — how do we make money?',
      'Key Resources — what assets are required?',
      'Key Activities — what must we do well?',
      'Key Partnerships — who do we rely on?',
      'Cost Structure — what are the major costs?',
    ],
    pros: ['One-page clarity', 'Highly collaborative tool', 'Shows interdependencies'],
    cons: ['Misses competitive and external context', 'Can be surface-level without deep analysis', 'Static snapshot'],
    adhdTip: 'Fill in Value Propositions and Customer Segments first — everything else flows from those two.',
    related: ['blue-ocean', 'ansoff-matrix', 'lean-startup'],
    tags: ['strategy', 'business model', 'innovation', 'canvas'],
  },

  // ── Leadership & Management ────────────────────────────────────────────────
  {
    id: 'situational-leadership',
    name: 'Situational Leadership',
    category: 'Leadership & Management',
    origin: 'Paul Hersey & Ken Blanchard, 1969',
    description:
      'A leadership model asserting that no single style is best — effective leaders adapt their style (Directing, Coaching, Supporting, Delegating) to the development level of each individual on each task.',
    whenToUse:
      'When managing diverse teams, onboarding new staff, developing individuals, or when performance varies across your team.',
    keyComponents: [
      'D1 — Enthusiastic Beginner (low competence, high commitment)',
      'D2 — Disillusioned Learner (some competence, low commitment)',
      'D3 — Capable but Cautious (high competence, variable commitment)',
      'D4 — Self-Reliant Achiever (high competence, high commitment)',
      'S1 Directing — high task, low relationship behaviour',
      'S2 Coaching — high task, high relationship behaviour',
      'S3 Supporting — low task, high relationship behaviour',
      'S4 Delegating — low task, low relationship behaviour',
    ],
    pros: ['Practical and immediately applicable', 'Builds individual development plans', 'Widely trained and recognised'],
    cons: ['Requires accurate diagnosis of development level', 'Can feel mechanical if over-applied', 'Research base is debated'],
    adhdTip: 'Before each 1:1, quickly assess: "Which D level is this person on THIS task?" — takes 30 seconds.',
    related: ['servant-leadership', 'radical-candor', 'first-team'],
    tags: ['leadership', 'coaching', 'management', 'delegation'],
  },
  {
    id: 'servant-leadership',
    name: 'Servant Leadership',
    category: 'Leadership & Management',
    origin: 'Robert Greenleaf, 1970',
    description:
      'A philosophy where the leader\'s primary role is to serve their team — removing obstacles, developing people, and enabling others to perform at their best. Power flows from the bottom up rather than top down.',
    whenToUse:
      'When building high-trust culture, in knowledge-work environments, or when intrinsic motivation and psychological safety are critical.',
    keyComponents: [
      'Listening deeply to understand team needs',
      'Empathy — understanding the perspective of others',
      'Healing — addressing emotional and professional wellbeing',
      'Awareness — understanding self and context',
      'Persuasion rather than coercion',
      'Building community and shared purpose',
      'Stewardship of people and resources',
    ],
    pros: ['Builds high-trust environments', 'Strong for retention and engagement', 'Encourages psychological safety'],
    cons: ['Slower decision-making in crisis', 'Can be misread as weakness', 'Requires mature team to function well'],
    adhdTip: 'Start each week with: "What is one obstacle I can remove for my team today?" — concrete, actionable.',
    related: ['situational-leadership', 'transformational-leadership', 'radical-candor'],
    tags: ['leadership', 'culture', 'trust', 'people'],
  },
  {
    id: 'transformational-leadership',
    name: 'Transformational Leadership',
    category: 'Leadership & Management',
    origin: 'James MacGregor Burns, 1978; Bernard Bass, 1985',
    description:
      'A leadership approach focused on inspiring followers to exceed their own expectations through a compelling vision, intellectual stimulation, individualised consideration, and idealised influence. Contrasts with transactional leadership.',
    whenToUse:
      'During organisational change, when building a movement, or when you need to shift culture and lift ambition across a team.',
    keyComponents: [
      'Idealised Influence — leading by example, building trust',
      'Inspirational Motivation — articulating a compelling vision',
      'Intellectual Stimulation — challenging assumptions, fostering creativity',
      'Individualised Consideration — coaching and developing each person',
      'Articulating a clear and emotional narrative',
      'Connecting individual roles to the bigger mission',
    ],
    pros: ['Drives high engagement and discretionary effort', 'Effective for change', 'Develops future leaders'],
    cons: ['Risk of hero-worship and dependency', 'Less effective for routine operational management', 'Burnout risk for the leader'],
    adhdTip: 'Write a two-sentence "why we exist" statement and open every team meeting with it.',
    related: ['servant-leadership', 'adaptive-leadership', 'situational-leadership'],
    tags: ['leadership', 'vision', 'change', 'inspiration'],
  },
  {
    id: 'adaptive-leadership',
    name: 'Adaptive Leadership',
    category: 'Leadership & Management',
    origin: 'Ronald Heifetz & Marty Linsky, Harvard Kennedy School, 1994',
    description:
      'A framework distinguishing between technical problems (clear solutions) and adaptive challenges (require changes in values, beliefs, and behaviours). Adaptive leaders help people confront difficult change without providing false comfort.',
    whenToUse:
      'When facing organisational change that cannot be solved by expertise alone, or when systemic cultural or behavioural change is required.',
    keyComponents: [
      'Technical vs. Adaptive challenge diagnosis',
      'Getting on the "balcony" — perspective-taking above the fray',
      'Regulating distress — keeping people in the productive zone',
      'Identifying and managing resistant factions',
      'Protecting voices from below',
      'Maintaining disciplined attention to the work',
      'Giving the work back to the people',
    ],
    pros: ['Excellent for deep systemic change', 'Avoids over-reliance on expert solutions', 'Builds organisational resilience'],
    cons: ['Difficult to learn without practice', 'Uncomfortable for leaders who prefer clear answers', 'Can create short-term instability'],
    adhdTip: 'When stuck, ask: "Is this technical or adaptive?" Adaptive problems need conversation, not a plan.',
    related: ['transformational-leadership', 'cynefin', 'change-management-kotter'],
    tags: ['leadership', 'change', 'complexity', 'culture'],
  },
  {
    id: 'radical-candor',
    name: 'Radical Candor',
    category: 'Leadership & Management',
    origin: 'Kim Scott, 2017',
    description:
      'A feedback and management philosophy centred on two axes: Caring Personally and Challenging Directly. Radical Candor occupies the top-right quadrant — genuinely caring about people while also being honest about performance and behaviour.',
    whenToUse:
      'When building a feedback culture, giving difficult performance feedback, or coaching managers on how to have honest conversations.',
    keyComponents: [
      'Radical Candor — care personally + challenge directly',
      'Ruinous Empathy — care personally but fail to challenge (most common failure)',
      'Obnoxious Aggression — challenge directly without caring personally',
      'Manipulative Insincerity — neither care nor challenge',
      'Praise specifically and sincerely in public',
      'Critique privately, promptly, and behaviourally',
      'Solicit feedback before giving it',
    ],
    pros: ['Practical and memorable framework', 'Builds feedback muscle across the team', 'Reduces "nice but vague" manager behaviour'],
    cons: ['Cultural translation required (varies by context)', '"Caring" must be authentic or it backfires', 'Requires consistent application'],
    adhdTip: 'Use "situation → behaviour → impact" as your feedback script to keep feedback concrete and quick.',
    related: ['situational-leadership', 'servant-leadership', 'first-team'],
    tags: ['feedback', 'management', 'communication', 'culture'],
  },
  {
    id: 'first-team',
    name: 'First Team (Lencioni)',
    category: 'Leadership & Management',
    origin: 'Patrick Lencioni, "The Five Dysfunctions of a Team", 2002',
    description:
      'The concept that leaders must treat their peer leadership team as their "first team" — not their direct reports. This shifts loyalty and removes siloed behaviour, forcing leaders to make decisions for the whole organisation.',
    whenToUse:
      'When leadership teams operate as functional silos, when cross-team conflicts are frequent, or during a culture or structure redesign.',
    keyComponents: [
      'Identifying your "first team" explicitly',
      'Subordinating departmental loyalty to collective leadership responsibility',
      'The Five Dysfunctions: absence of trust, fear of conflict, lack of commitment, avoidance of accountability, inattention to results',
      'Vulnerability-based trust building',
      'Productive ideological conflict',
      'Clear commitment to team decisions',
      'Peer accountability norms',
    ],
    pros: ['Breaks down organisational silos', 'Improves cross-functional decision-making', 'Builds leadership team cohesion'],
    cons: ['Threatening to leaders who derive identity from their function', 'Requires CEO modelling of the behaviour', 'Takes time to internalise'],
    adhdTip: 'Name your first team explicitly in your next leadership offsite — many teams never say it out loud.',
    related: ['radical-candor', 'situational-leadership', 'servant-leadership'],
    tags: ['leadership', 'teams', 'trust', 'culture'],
  },

  // ── Decision-Making ────────────────────────────────────────────────────────
  {
    id: 'cynefin',
    name: 'Cynefin Framework',
    category: 'Decision-Making',
    origin: 'Dave Snowden, IBM, 1999',
    description:
      'A sense-making framework with five domains — Clear, Complicated, Complex, Chaotic, and Confused (the centre) — each requiring a different decision-making approach. Helps leaders avoid applying ordered solutions to complex problems.',
    whenToUse:
      'When diagnosing the nature of a problem, choosing between expert analysis vs. experimentation, or managing a crisis.',
    keyComponents: [
      'Clear — sense, categorise, respond (best practice)',
      'Complicated — sense, analyse, respond (expert practice)',
      'Complex — probe, sense, respond (emergent practice)',
      'Chaotic — act, sense, respond (novel practice)',
      'Confused — break into domains',
      'Catastrophic failure boundary between Clear and Chaotic',
    ],
    pros: ['Prevents misapplication of solutions', 'Legitimises experimentation in complexity', 'Applicable to strategy and operations'],
    cons: ['Domain boundaries can be ambiguous', 'Requires facilitation skill to apply well', 'Can be over-intellectualised'],
    adhdTip: 'When facing a new problem, ask: "Is there a known best practice here?" Yes → Clear/Complicated. No → Complex.',
    related: ['adaptive-leadership', 'rapid-decision-making', 'design-thinking'],
    tags: ['decision-making', 'complexity', 'sense-making', 'strategy'],
  },
  {
    id: 'rapid-decision-making',
    name: 'RAPID Decision Making',
    category: 'Decision-Making',
    origin: 'Bain & Company, 2006',
    description:
      'A framework clarifying decision roles to speed up and improve decision quality. RAPID stands for Recommend, Agree, Perform, Input, Decide. Removes ambiguity about who owns what in cross-functional decisions.',
    whenToUse:
      'When decisions are slow, ownership is unclear, or when cross-functional teams get stuck in circular debate.',
    keyComponents: [
      'Recommend — proposes and develops the decision',
      'Agree — must formally agree (veto power)',
      'Perform — executes once decision is made',
      'Input — provides relevant data and perspective',
      'Decide — single decision owner with final authority',
      'Map RAPID roles for recurring decisions',
    ],
    pros: ['Eliminates decision gridlock', 'Clarifies accountability', 'Speeds up execution'],
    cons: ['Can feel bureaucratic if over-applied to simple decisions', 'Requires honest self-assessment of roles', 'Only as good as the "Decide" owner'],
    adhdTip: 'For any meeting where a decision is needed, assign D, R, and I roles on the agenda — saves 40 minutes.',
    related: ['cynefin', 'five-whys', 'okr'],
    tags: ['decision-making', 'governance', 'accountability', 'process'],
  },
  {
    id: 'six-thinking-hats',
    name: 'Six Thinking Hats',
    category: 'Decision-Making',
    origin: 'Edward de Bono, 1985',
    description:
      'A parallel thinking technique where everyone in a meeting adopts the same perspective at the same time, guided by six coloured "hats": White (data), Red (emotions), Black (risks), Yellow (optimism), Green (creativity), Blue (process).',
    whenToUse:
      'When meetings go in circles, when one or two voices dominate, or when you need creative and critical thinking on the same problem.',
    keyComponents: [
      'White Hat — facts, data, information gaps',
      'Red Hat — gut feelings, emotions, intuition',
      'Black Hat — risks, cautions, why it might not work',
      'Yellow Hat — benefits, best-case, optimism',
      'Green Hat — new ideas, alternatives, creativity',
      'Blue Hat — process control, meeting facilitation',
    ],
    pros: ['Democratises discussion', 'Surfaces emotions safely', 'Fast to learn and run'],
    cons: ['Can feel artificial', 'Requires a skilled facilitator for full benefit', 'Less useful for simple binary decisions'],
    adhdTip: 'Use Red Hat first — it gets emotion out on the table so the rest of the discussion is more rational.',
    related: ['cynefin', 'design-thinking', 'rapid-decision-making'],
    tags: ['decision-making', 'facilitation', 'creativity', 'thinking'],
  },
  {
    id: 'decision-matrix',
    name: 'Decision Matrix (Weighted Criteria)',
    category: 'Decision-Making',
    origin: 'Stuart Pugh, 1981 (Pugh Concept Selection)',
    description:
      'A structured tool for evaluating multiple options against weighted criteria. Options are scored on each criterion and multiplied by the weight; the highest total wins. Turns subjective decisions into a transparent, auditable process.',
    whenToUse:
      'When choosing between competing options (vendors, strategies, hires, solutions) and the decision must be defensible to stakeholders.',
    keyComponents: [
      'Define options (columns)',
      'Agree criteria (rows)',
      'Assign weights to each criterion (% total = 100)',
      'Score each option per criterion (1-5 or 1-10)',
      'Multiply score × weight and sum',
      'Sense-check the result against intuition',
    ],
    pros: ['Transparent and auditable', 'Forces explicit prioritisation', 'Reduces groupthink'],
    cons: ['False precision if criteria/weights are poorly chosen', 'Time-consuming for simple decisions', 'Weights themselves are subjective'],
    adhdTip: 'Limit to 5 criteria and 3 options maximum — more than that and the matrix becomes noise.',
    related: ['rapid-decision-making', 'cynefin', 'six-thinking-hats'],
    tags: ['decision-making', 'analysis', 'prioritisation', 'tools'],
  },

  // ── Problem-Solving ────────────────────────────────────────────────────────
  {
    id: 'five-whys',
    name: 'Five Whys',
    category: 'Problem-Solving',
    origin: 'Sakichi Toyoda, Toyota Production System, 1930s',
    description:
      'A root cause analysis technique that involves repeatedly asking "Why?" (typically five times) to drill down from a symptom to its fundamental cause. Simple, fast, and requires no special tools.',
    whenToUse:
      'After incidents, quality failures, process breakdowns, or any recurring problem where the true root cause is unclear.',
    keyComponents: [
      'State the problem clearly',
      'Ask "Why did this happen?" and write the answer',
      'Repeat for each answer until root cause is identified',
      'Verify the chain of causality',
      'Address root cause, not just symptoms',
    ],
    pros: ['Fast and low-cost', 'No special tools needed', 'Builds shared understanding of root causes'],
    cons: ['Can stop prematurely at a comfortable answer', 'Different people may trace different causal paths', 'Less effective for complex multi-causal problems'],
    adhdTip: 'Do this verbally in 10 minutes with your team. Write answers on a whiteboard — visible thinking helps ADHD brains.',
    related: ['design-thinking', 'rapid-decision-making', 'lean'],
    tags: ['problem-solving', 'root cause', 'process', 'quality'],
  },
  {
    id: 'design-thinking',
    name: 'Design Thinking',
    category: 'Problem-Solving',
    origin: 'IDEO & Stanford d.school, popularised 1990s-2000s',
    description:
      'A human-centred iterative problem-solving methodology with five stages: Empathise, Define, Ideate, Prototype, Test. It privileges deep understanding of user needs before jumping to solutions.',
    whenToUse:
      'When solving complex, ambiguous problems, designing new products or services, or when the "right" solution is genuinely unknown.',
    keyComponents: [
      'Empathise — research and deeply understand the user',
      'Define — synthesise insights into a clear problem statement (HMW)',
      'Ideate — generate many ideas without judgement',
      'Prototype — build quick, cheap representations',
      'Test — get real feedback and iterate',
      'Iterative loops between stages',
    ],
    pros: ['Keeps focus on real user needs', 'Encourages experimentation over debate', 'Works across industries and problems'],
    cons: ['Time-intensive', 'Requires genuine empathy and user access', 'Can feel vague without experienced facilitation'],
    adhdTip: 'Prototype before perfecting. A rough sketch in 15 minutes is worth more than a week of debate.',
    related: ['cynefin', 'lean-startup', 'five-whys'],
    tags: ['problem-solving', 'innovation', 'user-centred', 'process'],
  },
  {
    id: 'lean-startup',
    name: 'Lean Startup',
    category: 'Problem-Solving',
    origin: 'Eric Ries, 2011',
    description:
      'A methodology for building and scaling new ventures or products through rapid validated learning: Build → Measure → Learn. The central concept is the Minimum Viable Product (MVP) to test hypotheses cheaply before full commitment.',
    whenToUse:
      'When launching new products, validating business models, or making large bets with uncertain outcomes.',
    keyComponents: [
      'Build-Measure-Learn feedback loop',
      'Minimum Viable Product (MVP)',
      'Validated learning over opinions',
      'Pivot or persevere decision',
      'Innovation accounting',
      'Actionable metrics vs. vanity metrics',
    ],
    pros: ['Reduces waste and rework', 'Forces early customer contact', 'De-risks large investments'],
    cons: ['MVP can undermine brand if too rough', 'Requires organisational patience for iteration', 'Can justify perpetual "beta" mode'],
    adhdTip: 'Write your one hypothesis on a post-it before building anything: "We believe X will cause Y." Then design the smallest test.',
    related: ['design-thinking', 'business-model-canvas', 'agile'],
    tags: ['innovation', 'product', 'startup', 'experimentation'],
  },
  {
    id: 'mece',
    name: 'MECE Principle',
    category: 'Problem-Solving',
    origin: 'Barbara Minto, McKinsey & Co., 1970s',
    description:
      'A structuring principle meaning Mutually Exclusive, Collectively Exhaustive. Problems, lists, and communications should be broken into parts that don\'t overlap (ME) and together cover the whole (CE). Core to structured thinking.',
    whenToUse:
      'When structuring problem-solving, writing reports, building slide decks, designing org structures, or facilitating issue trees.',
    keyComponents: [
      'Mutually Exclusive — no overlap between categories',
      'Collectively Exhaustive — no gaps in coverage',
      'Issue tree / logic tree construction',
      'Hypothesis-driven approach',
      'Pyramid principle for communication',
    ],
    pros: ['Builds rigorous analytical thinking', 'Prevents double-counting and gap', 'Makes communication crisp'],
    cons: ['Difficult to achieve perfectly in complex systems', 'Can feel unnatural at first', 'Over-application makes communication stiff'],
    adhdTip: 'When structuring any list, ask: "Is anything overlapping? Is anything missing?" — takes 2 minutes and prevents hours of rework.',
    related: ['five-whys', 'design-thinking', 'rapid-decision-making'],
    tags: ['problem-solving', 'structured thinking', 'communication', 'consulting'],
  },

  // ── Change & Transformation ────────────────────────────────────────────────
  {
    id: 'change-management-kotter',
    name: "Kotter's 8-Step Change Model",
    category: 'Change & Transformation',
    origin: 'John Kotter, Harvard Business School, 1996',
    description:
      'An 8-step process for leading large-scale organisational change: Create urgency, Build a guiding coalition, Form vision, Enlist volunteers, Enable action, Generate short-term wins, Sustain acceleration, and Institute change.',
    whenToUse:
      'When planning or leading major organisational transformation, culture change, or strategic pivots that require wide buy-in.',
    keyComponents: [
      'Step 1: Create a sense of urgency',
      'Step 2: Build a guiding coalition',
      'Step 3: Form a strategic vision and initiatives',
      'Step 4: Enlist a volunteer army',
      'Step 5: Enable action by removing barriers',
      'Step 6: Generate short-term wins',
      'Step 7: Sustain acceleration',
      'Step 8: Institute change in culture',
    ],
    pros: ['Comprehensive and sequential', 'Widely taught and recognised', 'Emphasis on coalition building'],
    cons: ['Linear — real change is messier', 'Steps 1-4 often rushed', 'Long timeline for results'],
    adhdTip: 'Identify your two "short-term wins" (Step 6) before you start Step 1 — they keep momentum when energy dips.',
    related: ['adaptive-leadership', 'mckinsey-7s', 'transformational-leadership'],
    tags: ['change', 'transformation', 'leadership', 'organisational'],
  },
  {
    id: 'adkar',
    name: 'ADKAR Model',
    category: 'Change & Transformation',
    origin: 'Jeff Hiatt, Prosci, 2006',
    description:
      'An individual-centred change framework identifying five building blocks: Awareness, Desire, Knowledge, Ability, and Reinforcement. Change fails when any one block is weak — diagnosis determines the targeted intervention.',
    whenToUse:
      'When diagnosing why individual or team adoption of a change is stalling, or when designing change communications and training.',
    keyComponents: [
      'Awareness — understanding why change is needed',
      'Desire — personal motivation to support the change',
      'Knowledge — how to change (training, skills)',
      'Ability — practical capability to implement',
      'Reinforcement — sustaining the change over time',
    ],
    pros: ['Individual-level diagnosis', 'Actionable — identifies exactly where to intervene', 'Complements systems-level models like Kotter'],
    cons: ['Sequential model — real change is non-linear', 'Requires honest assessment of each stage', 'Primarily suited to planned change'],
    adhdTip: 'Survey your team anonymously on which ADKAR stage they\'re stuck at — the data tells you where to focus.',
    related: ['change-management-kotter', 'adaptive-leadership', 'situational-leadership'],
    tags: ['change', 'adoption', 'communication', 'individuals'],
  },
  {
    id: 'bridges-transition',
    name: 'Bridges Transition Model',
    category: 'Change & Transformation',
    origin: 'William Bridges, 1991',
    description:
      'Distinguishes between change (the external event) and transition (the internal psychological process). Transition has three phases: Ending (letting go), Neutral Zone (uncertainty), and New Beginning. Leaders must manage all three.',
    whenToUse:
      'When people are resistant or disengaged during change, or when you want to understand the emotional journey of a transformation.',
    keyComponents: [
      'Ending — acknowledging what is being lost',
      'Neutral Zone — confusion and creativity, the "in-between"',
      'New Beginning — energy and identity aligned with the new state',
      'Leaders must acknowledge endings before pushing new beginnings',
      'Neutral Zone management: small wins, clear purpose, tight teams',
    ],
    pros: ['Humanises change management', 'Explains resistance with compassion', 'Highly applicable in communications'],
    cons: ['Less prescriptive than Kotter or ADKAR', 'Difficult to measure progress', 'Requires psychological safety to apply'],
    adhdTip: 'Start every change communication with a genuine acknowledgement of what is being lost — it earns trust fast.',
    related: ['change-management-kotter', 'adkar', 'adaptive-leadership'],
    tags: ['change', 'psychology', 'transition', 'communication'],
  },

  // ── People & Talent ────────────────────────────────────────────────────────
  {
    id: '9-box-grid',
    name: '9-Box Talent Grid',
    category: 'People & Talent',
    origin: 'McKinsey & Co. / GE, 1970s',
    description:
      'A talent management tool that maps employees on a 3×3 grid across two axes: current performance and future potential. Used in succession planning and to differentiate investment in talent development.',
    whenToUse:
      'During talent reviews, succession planning, or when making promotion and development investment decisions.',
    keyComponents: [
      'X-axis: Performance (low, medium, high)',
      'Y-axis: Potential (low, medium, high)',
      'Stars (high/high) — invest and develop',
      'Core performers (high/medium) — reward and retain',
      'High potentials (medium-low/high) — develop deliberately',
      'Underperformers (low/low) — manage out or support',
      'Calibration sessions to reduce bias',
    ],
    pros: ['Simple visual for complex talent conversations', 'Drives differentiated development investment', 'Widely understood in HR'],
    cons: ['Potential is hard to assess objectively', 'Can entrench bias without calibration', 'Label effects can become self-fulfilling'],
    adhdTip: 'Run calibration with peers before finalising — your own recency bias will skew the bottom-left unfairly.',
    related: ['succession-planning', 'situational-leadership', 'okr'],
    tags: ['talent', 'performance', 'potential', 'succession'],
  },
  {
    id: 'succession-planning',
    name: 'Succession Planning',
    category: 'People & Talent',
    origin: 'Management best practice, formalised post-WWII corporate era',
    description:
      'A process for identifying and developing internal candidates to fill critical leadership and technical roles. Reduces organisational risk from unexpected departures and accelerates career development for high-potentials.',
    whenToUse:
      'Annually during talent reviews, when key roles are at flight risk, or when the organisation is growing rapidly.',
    keyComponents: [
      'Identify critical roles (top-down and cross-functional)',
      'Assess incumbent risk (flight risk, retirement timeline)',
      'Identify successors: ready now, ready in 1-2 years, ready in 3-5 years',
      'Build development plans for each successor',
      'Stretch assignments and sponsorship',
      'Governance: board/CEO visibility of succession bench',
    ],
    pros: ['Reduces business continuity risk', 'Motivates high-potentials', 'Provides career development clarity'],
    cons: ['Plans become stale quickly', 'Creates entitlement if communicated poorly', 'Bias tends to favour successors who look like incumbents'],
    adhdTip: 'Maintain a one-page "bench strength" view per critical role — revisit quarterly rather than annually.',
    related: ['9-box-grid', 'situational-leadership', 'okr'],
    tags: ['talent', 'succession', 'risk', 'HR'],
  },
  {
    id: 'competency-framework',
    name: 'Competency Framework',
    category: 'People & Talent',
    origin: 'David McClelland, 1973; widespread adoption 1980s-1990s',
    description:
      'A structured set of behaviours, skills, and attributes required for effective performance at different levels in an organisation. Used for hiring, performance management, development, and promotions.',
    whenToUse:
      'When designing job architecture, building performance review systems, developing hiring scorecards, or creating L&D curricula.',
    keyComponents: [
      'Core competencies — required of all employees',
      'Leadership competencies — required of all people managers',
      'Functional competencies — role-specific technical skills',
      'Behavioural indicators at each level',
      'Proficiency scale (e.g. emerging, developing, proficient, expert)',
      'Integration with talent processes',
    ],
    pros: ['Consistent language for performance', 'Reduces subjectivity in assessment', 'Enables internal mobility'],
    cons: ['Can become compliance exercise without embedding', 'Competencies lag behind business change', 'Lengthy to develop properly'],
    adhdTip: 'Pick 5 competencies maximum per role — more than that becomes noise that no one remembers.',
    related: ['9-box-grid', 'succession-planning', 'situational-leadership'],
    tags: ['talent', 'performance', 'HR', 'development'],
  },

  // ── Teams & Culture ────────────────────────────────────────────────────────
  {
    id: 'psychological-safety',
    name: 'Psychological Safety (Edmondson)',
    category: 'Teams & Culture',
    origin: 'Amy Edmondson, Harvard Business School, 1999',
    description:
      'The shared belief that the team is safe for interpersonal risk-taking — that you can speak up, admit errors, or challenge ideas without fear of humiliation or punishment. Google\'s Project Aristotle identified it as the #1 factor in team effectiveness.',
    whenToUse:
      'When building high-performing teams, addressing low engagement or silencing behaviour, or creating a learning organisation.',
    keyComponents: [
      'Leader modelling of vulnerability (admitting mistakes)',
      'Framing work as a learning problem',
      'Inviting participation and diverse views',
      'Responding productively to mistakes (curiosity not blame)',
      'Setting clear norms for respectful disagreement',
      'Measuring safety through survey and observation',
    ],
    pros: ['#1 predictor of team performance per Google research', 'Drives innovation and learning', 'Reduces costly silence'],
    cons: ['Requires consistent leader behaviour over time', 'Cannot be faked', 'High safety without accountability enables complacency'],
    adhdTip: 'After each team decision, ask: "Who hasn\'t spoken yet?" — one habit that visibly signals safety.',
    related: ['servant-leadership', 'radical-candor', 'first-team'],
    tags: ['culture', 'teams', 'trust', 'performance'],
  },
  {
    id: 'team-effectiveness-google',
    name: "Google's Project Aristotle",
    category: 'Teams & Culture',
    origin: 'Google People Operations, 2012-2015',
    description:
      'A large-scale research project identifying five factors that distinguish high-performing teams at Google: Psychological Safety, Dependability, Structure & Clarity, Meaning, and Impact. Psychological safety sits at the foundation.',
    whenToUse:
      'When assessing or redesigning team health, building new teams, or diagnosing performance issues.',
    keyComponents: [
      'Psychological Safety — safe to take risks',
      'Dependability — can rely on each other to deliver',
      'Structure & Clarity — clear roles, plans, and goals',
      'Meaning — work is personally important',
      'Impact — believe the work matters',
      'Survey and OKR integration for measurement',
    ],
    pros: ['Research-backed', 'Holistic team health model', 'Easy to measure via survey'],
    cons: ['Findings specific to Google\'s context', 'All five factors require sustained attention', 'Measurement without action is pointless'],
    adhdTip: 'Run a quick 5-question team health pulse (one per factor) monthly — 5 minutes, high signal.',
    related: ['psychological-safety', 'okr', 'servant-leadership'],
    tags: ['teams', 'culture', 'research', 'performance'],
  },
  {
    id: 'tuckman-model',
    name: "Tuckman's Team Development Model",
    category: 'Teams & Culture',
    origin: 'Bruce Tuckman, 1965; "Adjourning" added 1977',
    description:
      'A model describing the stages teams go through: Forming (polite orientation), Storming (conflict and power), Norming (rules and cohesion), Performing (high output), and Adjourning (dissolution). Leaders must adapt their style at each stage.',
    whenToUse:
      'When onboarding new teams, navigating team conflict, or understanding why a team\'s performance has dipped.',
    keyComponents: [
      'Forming — dependency on leader, orientation',
      'Storming — conflict over roles and direction',
      'Norming — establishing shared norms and trust',
      'Performing — autonomous, high-output',
      'Adjourning — closure and transition',
      'Teams can regress when membership or context changes',
    ],
    pros: ['Intuitive and memorable', 'Explains storming as normal', 'Useful for leader coaching'],
    cons: ['Stages rarely occur linearly', 'Simplified view of team dynamics', 'No guidance on how to accelerate stages'],
    adhdTip: 'Name the stage you\'re in with your team — simply saying "we\'re in Storming" reduces anxiety and normalises conflict.',
    related: ['psychological-safety', 'situational-leadership', 'first-team'],
    tags: ['teams', 'development', 'leadership', 'culture'],
  },

  // ── Communication & Influence ──────────────────────────────────────────────
  {
    id: 'pyramid-principle',
    name: 'Pyramid Principle (Minto)',
    category: 'Communication & Influence',
    origin: 'Barbara Minto, McKinsey & Co., 1970s',
    description:
      'A communication framework where you lead with the answer/recommendation first (the apex), then support it with grouped arguments, which are themselves supported by data. Mirrors how readers and listeners actually process information.',
    whenToUse:
      'When writing executive communications, structuring presentations, or whenever you need to get to the point quickly.',
    keyComponents: [
      'Start with the single governing thought (BLUF)',
      'Group supporting arguments into 3-5 categories',
      'Each group supported by evidence',
      'Vertical logic — each level answers "Why?"',
      'Horizontal logic — same type of idea at each level',
      'SCR structure: Situation, Complication, Resolution',
    ],
    pros: ['Ruthlessly clarifying', 'Saves executive time', 'Applicable to email, decks, and verbal updates'],
    cons: ['Counterintuitive ("bottom-up" reasoning must be done first)', 'Can feel cold without narrative', 'Overused in consulting to the point of parody'],
    adhdTip: 'Write the answer sentence first — even if you don\'t know it yet. Forces clarity before you type another word.',
    related: ['mece', 'radical-candor', 'situational-leadership'],
    tags: ['communication', 'writing', 'consulting', 'leadership'],
  },
  {
    id: 'cialdini-influence',
    name: "Cialdini's 6 Principles of Influence",
    category: 'Communication & Influence',
    origin: 'Robert Cialdini, "Influence: The Psychology of Persuasion", 1984',
    description:
      'Six universal principles of persuasion: Reciprocity, Commitment & Consistency, Social Proof, Authority, Liking, and Scarcity. Used ethically, they dramatically improve the effectiveness of any persuasion attempt.',
    whenToUse:
      'When designing communications, negotiations, change campaigns, or any situation requiring buy-in from stakeholders.',
    keyComponents: [
      'Reciprocity — give first, receive later',
      'Commitment & Consistency — small yes leads to big yes',
      'Social Proof — people follow the crowd',
      'Authority — expertise and credentials earn credibility',
      'Liking — people say yes to people they like',
      'Scarcity — rare = valuable',
    ],
    pros: ['Evidence-based', 'Applicable to virtually any influence situation', 'Memorable and teachable'],
    cons: ['Manipulation risk if misused', 'Over-reliance on shortcuts', 'Cultural variation in effectiveness'],
    adhdTip: 'Choose ONE principle per stakeholder conversation. Using all six at once is overwhelming and often backfires.',
    related: ['pyramid-principle', 'radical-candor', 'adaptive-leadership'],
    tags: ['influence', 'persuasion', 'communication', 'psychology'],
  },
  {
    id: 'scqa',
    name: 'SCQA Storytelling Framework',
    category: 'Communication & Influence',
    origin: 'Barbara Minto, McKinsey & Co.; popularised broadly',
    description:
      'A narrative structure for compelling communication: Situation (context everyone agrees on), Complication (what changed or is at stake), Question (the key question this raises), Answer (your recommendation). Creates tension that pulls audiences toward your message.',
    whenToUse:
      'When writing executive briefs, kicking off presentations, crafting change narratives, or pitching ideas to leadership.',
    keyComponents: [
      'Situation — shared, non-controversial starting point',
      'Complication — the disruption, challenge, or opportunity',
      'Question — what must be decided or solved?',
      'Answer — your recommendation or finding',
      'Keep Situation brief — go quickly to Complication',
    ],
    pros: ['Engaging and tension-building', 'Works for verbal and written', 'Easy to remember under pressure'],
    cons: ['Requires you to know your answer first', 'Situation padding is a common failure mode', 'Can feel manipulative if overused'],
    adhdTip: 'Draft your Complication sentence first — it\'s the most important line and tells you whether you have a real story.',
    related: ['pyramid-principle', 'cialdini-influence', 'radical-candor'],
    tags: ['communication', 'storytelling', 'writing', 'consulting'],
  },

  // ── Operations & Process ───────────────────────────────────────────────────
  {
    id: 'lean',
    name: 'Lean Management',
    category: 'Operations & Process',
    origin: 'Toyota Production System, Taiichi Ohno, 1950s; "Lean" coined by Womack & Jones, 1990',
    description:
      'A management philosophy focused on maximising customer value while minimising waste. The eight wastes (DOWNTIME) include Defects, Overproduction, Waiting, Non-utilised talent, Transport, Inventory, Motion, and Extra processing.',
    whenToUse:
      'When improving operational efficiency, reducing lead times, or building a continuous improvement culture.',
    keyComponents: [
      'Value — define value from the customer\'s perspective',
      'Value Stream — map all steps that create value',
      'Flow — ensure value flows without interruption',
      'Pull — produce only what is demanded',
      'Perfection — continuously improve toward zero waste',
      '8 wastes: DOWNTIME',
      'Kaizen — continuous improvement events',
    ],
    pros: ['Eliminates waste systematically', 'Builds improvement culture', 'Applicable from manufacturing to services'],
    cons: ['Culture change is slow and hard', 'Tools without philosophy fail', 'Requires long-term leadership commitment'],
    adhdTip: 'Pick one process and map every step — circle the steps that add no customer value. Start eliminating the biggest one.',
    related: ['five-whys', 'agile', 'six-sigma'],
    tags: ['operations', 'process', 'efficiency', 'quality'],
  },
  {
    id: 'agile',
    name: 'Agile (Scrum/Kanban)',
    category: 'Operations & Process',
    origin: 'Agile Manifesto, 2001; Scrum (Schwaber & Sutherland); Kanban (Ohno/Anderson)',
    description:
      'An iterative approach to work delivery built on short cycles, continuous feedback, and cross-functional collaboration. Scrum uses fixed Sprints; Kanban uses continuous flow. Both prioritise working output over documentation.',
    whenToUse:
      'In software development, product management, or any work where requirements evolve and fast feedback loops are valuable.',
    keyComponents: [
      'Sprints / iterations (1-4 weeks)',
      'Product Backlog — prioritised list of work',
      'Daily Standup — 15-minute sync',
      'Sprint Review — demo to stakeholders',
      'Retrospective — team improvement',
      'Kanban board — visualise flow and WIP limits',
      'Definition of Done',
    ],
    pros: ['Fast feedback and course correction', 'High team autonomy and engagement', 'Transparent progress'],
    cons: ['Hard to scale without frameworks (SAFe, LeSS)', 'Requires product owner discipline', 'Can become "fake Agile" without culture change'],
    adhdTip: 'Use a physical or digital Kanban board — visual WIP limits help ADHD brains avoid context-switching.',
    related: ['lean', 'lean-startup', 'okr'],
    tags: ['agile', 'scrum', 'kanban', 'software', 'teams'],
  },
  {
    id: 'six-sigma',
    name: 'Six Sigma (DMAIC)',
    category: 'Operations & Process',
    origin: 'Motorola, 1986; popularised by GE/Jack Welch, 1990s',
    description:
      'A data-driven methodology for reducing defects and variation in processes. DMAIC (Define, Measure, Analyse, Improve, Control) is the improvement cycle. Targets fewer than 3.4 defects per million opportunities.',
    whenToUse:
      'When you have a measurable quality or efficiency problem with clear data available and need a rigorous, structured improvement approach.',
    keyComponents: [
      'Define — clarify the problem and project scope',
      'Measure — collect baseline data',
      'Analyse — identify root causes statistically',
      'Improve — implement and test solutions',
      'Control — sustain improvements via control charts',
      'Belt system: Yellow, Green, Black, Master Black Belt',
    ],
    pros: ['Highly rigorous and data-driven', 'Reduces variation reliably', 'Provides certification path'],
    cons: ['Heavy toolset — overkill for simple problems', 'Requires statistical capability', 'Slow for fast-moving environments'],
    adhdTip: 'Use DMAIC as a checklist, not a manual. Define the problem and measure the baseline before anything else.',
    related: ['lean', 'five-whys', 'design-thinking'],
    tags: ['quality', 'process', 'data', 'operations'],
  },

  // ── Governance & Risk ──────────────────────────────────────────────────────
  {
    id: 'risk-management',
    name: 'Risk Management (ISO 31000)',
    category: 'Governance & Risk',
    origin: 'ISO 31000:2018; COSO framework, 1990s',
    description:
      'A systematic framework for identifying, assessing, and mitigating risks. The risk register captures risks by likelihood and impact; treatment options are Avoid, Reduce, Transfer, or Accept.',
    whenToUse:
      'During project planning, strategic planning cycles, or any time significant uncertainty could affect outcomes.',
    keyComponents: [
      'Risk identification — brainstorm and categorise risks',
      'Likelihood and impact assessment',
      'Risk scoring and prioritisation (heat map)',
      'Treatment: Avoid, Reduce, Transfer, Accept',
      'Risk register maintenance',
      'Monitoring and review cadence',
      'Escalation thresholds',
    ],
    pros: ['Structured approach to uncertainty', 'Drives proactive rather than reactive management', 'Board and executive communication tool'],
    cons: ['Risk registers often become compliance documents', 'Probability estimation is unreliable', 'Tail risks (unknown unknowns) are missed'],
    adhdTip: 'Review your top 5 risks for 10 minutes in your weekly review — any more and it becomes background noise.',
    related: ['pestle', 'cynefin', 'rapid-decision-making'],
    tags: ['risk', 'governance', 'planning', 'compliance'],
  },
  {
    id: 'raci',
    name: 'RACI Matrix',
    category: 'Governance & Risk',
    origin: 'Management best practice, 1950s-1970s; formalised as RACI in 1980s',
    description:
      'A responsibility assignment matrix clarifying roles across tasks or decisions: Responsible (does the work), Accountable (owns the outcome), Consulted (provides input), Informed (kept up to date). Prevents confusion and duplicated effort.',
    whenToUse:
      'When launching cross-functional projects, redesigning processes, or when accountability gaps or overlaps are causing friction.',
    keyComponents: [
      'Responsible — who does the work (can be multiple)',
      'Accountable — single owner of the outcome (must be one)',
      'Consulted — two-way communication before decisions',
      'Informed — one-way communication after decisions',
      'Map tasks in rows, roles in columns',
      'Each row must have exactly one A',
    ],
    pros: ['Eliminates ambiguity fast', 'Scalable from task to project level', 'Easy to build and communicate'],
    cons: ['Can become bureaucratic for simple work', 'Frequent changes reduce utility', 'Confusion between R and A is common'],
    adhdTip: 'Before any new project, spend 15 minutes on RACI. It saves weeks of conflict downstream.',
    related: ['rapid-decision-making', 'risk-management', 'agile'],
    tags: ['governance', 'accountability', 'process', 'projects'],
  },

  // ── Project & Portfolio ────────────────────────────────────────────────────
  {
    id: 'okr',
    name: 'OKRs (Objectives & Key Results)',
    category: 'Project & Portfolio',
    origin: 'Andy Grove, Intel, 1970s; popularised by John Doerr at Google',
    description:
      'A goal-setting framework where each Objective answers "What do I want to achieve?" and 3-5 Key Results answer "How will I know I achieved it?" OKRs are typically set quarterly, public, and graded 0-1.',
    whenToUse:
      'When aligning teams to strategy, setting measurable goals, or shifting from output-focused to outcome-focused management.',
    keyComponents: [
      'Objective — inspiring, qualitative, time-bound goal',
      'Key Results — specific, measurable, 3-5 per objective',
      'Grading (0-1 scale; 0.7 is success)',
      'Committed vs. aspirational OKRs',
      'Weekly check-ins and end-of-quarter retrospective',
      'Cascade: company → team → individual',
      'CFRs: Conversations, Feedback, Recognition',
    ],
    pros: ['Tight alignment from strategy to execution', 'Transparency builds accountability', 'Drives focus and prioritisation'],
    cons: ['Output metrics used instead of outcomes', 'Annual salary link destroys aspirational culture', 'Requires significant process discipline'],
    adhdTip: 'Write your OKRs on a sticky note. If they don\'t fit, they\'re too complex. One objective per quarter per person.',
    related: ['balanced-scorecard', 'three-horizons', 'agile'],
    tags: ['goals', 'performance', 'strategy', 'measurement'],
  },
  {
    id: 'portfolio-management',
    name: 'Portfolio Management',
    category: 'Project & Portfolio',
    origin: 'Harry Markowitz (finance), 1952; applied to projects PMI, 1990s',
    description:
      'The centralised management of projects and programmes to achieve strategic objectives. Involves selecting, prioritising, and balancing the portfolio of initiatives against organisational capacity and strategic value.',
    whenToUse:
      'When managing multiple competing initiatives, allocating scarce resources, or connecting strategic planning to project execution.',
    keyComponents: [
      'Strategic alignment scoring of initiatives',
      'Benefits realisation tracking',
      'Resource capacity planning',
      'Stage-gate governance',
      'Portfolio dashboard (RAG status)',
      'Portfolio review cadence',
      'Killing or pausing underperforming projects',
    ],
    pros: ['Stops "too many projects" problem', 'Connects strategy to execution', 'Improves resource utilisation'],
    cons: ['Governance overhead', 'Political resistance to killing projects', 'Requires centralised PMO capability'],
    adhdTip: 'List all active initiatives and rate each: strategic value (H/M/L) vs. effort remaining (H/M/L). Kill or park anything low/high immediately.',
    related: ['raci', 'okr', 'three-horizons'],
    tags: ['portfolio', 'projects', 'governance', 'strategy'],
  },

  // ── HR & Organisation ──────────────────────────────────────────────────────
  {
    id: 'job-architecture',
    name: 'Job Architecture & Levelling',
    category: 'HR & Organisation',
    origin: 'Hay Group / Korn Ferry job evaluation, 1940s-1950s; evolved through consulting',
    description:
      'A systematic framework for defining job families, levels, and career paths across an organisation. Enables consistent pay, promotion criteria, and workforce planning. Typically includes IC and Management tracks.',
    whenToUse:
      'When scaling beyond ~50 employees, when pay equity is at risk, or when career development conversations are inconsistent.',
    keyComponents: [
      'Job families (functions and subfunctions)',
      'Levels (L1-L7 or equivalent)',
      'Level descriptors: scope, complexity, accountability, skills',
      'IC (Individual Contributor) and Management tracks',
      'Pay bands per level',
      'Promotion criteria between levels',
    ],
    pros: ['Pay equity and consistency', 'Clear career progression', 'Scalable workforce planning'],
    cons: ['Rigid levels can slow high-potential advancement', 'Takes significant time to design', 'Requires annual maintenance'],
    adhdTip: 'Define levels by "what can this person do independently?" rather than years of experience — keeps it concrete.',
    related: ['competency-framework', '9-box-grid', 'succession-planning'],
    tags: ['HR', 'compensation', 'career', 'organisational design'],
  },
  {
    id: 'employee-value-proposition',
    name: 'Employee Value Proposition (EVP)',
    category: 'HR & Organisation',
    origin: 'Employer branding practice, 1990s; popularised by Towers Perrin (now Willis Towers Watson)',
    description:
      'The unique set of benefits an employee receives in return for their skills, capabilities, and experience. A compelling EVP attracts, retains, and engages talent. Covers compensation, career, culture, connection, and meaning.',
    whenToUse:
      'When building employer brand, facing talent retention challenges, or designing total rewards strategy.',
    keyComponents: [
      'Compensation & Benefits — pay, equity, perks',
      'Career & Development — growth opportunities',
      'Culture & Environment — how we work together',
      'Purpose & Mission — why we exist',
      'Recognition — how we celebrate contribution',
      'Flexibility & Wellbeing',
      'EVP research: employee surveys, exit interviews, competitor analysis',
    ],
    pros: ['Differentiates employer brand', 'Focuses HR investment', 'Reduces turnover when authentic'],
    cons: ['EVP can become marketing spin', 'Must be lived, not just stated', 'Requires ongoing measurement'],
    adhdTip: 'Ask your top performers why they stay. Their answers ARE your EVP — build from reality, not aspiration.',
    related: ['competency-framework', 'psychological-safety', 'job-architecture'],
    tags: ['HR', 'talent', 'culture', 'employer brand'],
  },
  {
    id: 'performance-management',
    name: 'Performance Management Cycle',
    category: 'HR & Organisation',
    origin: 'Management best practice; formalised in corporate HR 1950s-1970s',
    description:
      'A continuous cycle of goal-setting, feedback, development, and evaluation. Modern performance management has shifted from annual appraisals to ongoing conversations, real-time feedback, and forward-looking development.',
    whenToUse:
      'When designing or redesigning how the organisation sets goals, gives feedback, and evaluates performance.',
    keyComponents: [
      'Goal-setting (OKRs or objectives) — start of cycle',
      'Regular 1:1 check-ins (weekly or bi-weekly)',
      'Mid-year review — course correction',
      'Continuous feedback (tools and norms)',
      'Year-end evaluation (ratings or narratives)',
      'Calibration to reduce bias',
      'Link to compensation and development decisions',
    ],
    pros: ['Builds accountability and alignment', 'Creates development conversations', 'Required for reward decisions'],
    cons: ['Annual ratings demoralise more than they motivate', 'Manager quality determines system quality', 'Gaming and recency bias are pervasive'],
    adhdTip: 'Replace one annual review with twelve monthly 15-minute check-ins. Same total time, dramatically better outcome.',
    related: ['okr', 'radical-candor', '9-box-grid'],
    tags: ['HR', 'performance', 'feedback', 'management'],
  },
];

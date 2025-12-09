PRD — “Sleek Coach” Fitness App

1) Overview

Problem: People struggle to translate goals (“lose 20 lbs”, “recomp”, “run a 10k”) into consistent daily actions, and most apps either (a) are rigid trackers or (b) provide generic advice.

Solution: A beautiful, Material-design mobile app that combines:
	•	daily lightweight check-ins (weight, habits, optional photos),
	•	nutrition + activity ingestion (manual + integrations),
	•	an AI coach that adapts plans based on real progress and preferences, using transparent tool calls.

Principles
	•	“Minimal friction logging”
	•	“Actionable insights > raw data”
	•	“Privacy-first by default”
	•	“AI must be explainable, safe, and user-controlled”

2) Goals & Success Metrics

Business/Product goals
	•	High retention through habit loops and visible progress.
	•	Trustworthy recommendations (no “black box” vibes).

Success metrics
	•	D1 / D7 / D30 retention
	•	Weekly active users (WAU) and % completing check-in
	•	% users who set goals and complete onboarding
	•	Average “plan adherence” score (custom metric)
	•	% recommendations accepted / dismissed
	•	Time-to-value (from install → first useful insight)

3) Personas
	1.	Busy Beginner (primary)
Wants simple guidance, low cognitive load, hates calorie math.
	2.	Data-Driven Intermediate
Tracks macros, expects graphs, wants fine control.
	3.	Coached Client (future)
Works with trainer; wants shareable progress & reports.

4) Key Use Cases (User Stories)

Onboarding
	•	As a user, I can enter goal (fat loss, muscle gain, performance), timeline preference, experience level.
	•	I can set dietary preferences (vegetarian, halal, allergies), disliked foods, meal frequency.
	•	I can choose what data I’m comfortable sharing (photos, weight, nutrition, activity).

Daily workflow
	•	I can log weight in <10 seconds.
	•	I can optionally add a progress photo with private storage.
	•	I can see a daily “next best action” (e.g., steps target, protein target, workout suggestion).
	•	I can ask the AI coach a question (“what should I eat today?”) and it uses my data.

Progress & coaching
	•	I can see trends (weekly rate of change, adherence).
	•	AI updates recommendations when progress stalls (calories/macros, training volume, habit focus).
	•	I can export/share a weekly report.

5) MVP Scope (Must-Have)

MVP Feature Set
	1.	Auth + Profile
	•	Email/password + OAuth (optional)
	•	Goal setup, dietary prefs, baseline stats
	2.	Check-ins
	•	Weight, notes, optional photo, optional mood/energy/sleep slider
	3.	Nutrition
	•	Manual macro entry (minimum)
	•	Optional: MyFitnessPal import pathway (see Integrations)
	4.	Dashboard
	•	Today view + streaks
	•	Weekly trend charts (weight, adherence)
	5.	AI Coach (agentic)
	•	Chat UI
	•	Generates weekly plan + daily nudges
	•	Uses tool calls to: fetch user data, compute metrics, search approved web sources for recipes/fitness references
	6.	Settings + Privacy
	•	Data download/export
	•	Delete account
	•	Toggle: “Allow web search in coaching”

Explicitly NOT in MVP
	•	Social feed / communities
	•	Marketplace trainers
	•	Wearable deep integrations beyond basic import
	•	Complex workout program builder (keep workouts simple templates)

6) Integrations (MyFitnessPal Strategy)

Because MFP Partner API access is restricted and may be unavailable to new developers right now  ￼, design three tiers:

Tier A — Official Partner API (best UX)
	•	OAuth-based connection (partner credentials)
	•	Pull diary, nutrition summaries, measurements

Tier B — Aggregator (recommended fallback)
	•	Use a third-party health data aggregation provider (user OAuth to MFP through them), or prioritize Apple Health / Google Fit for activity while keeping nutrition manual.

Tier C — User-driven Import
	•	Let the user upload the MyFitnessPal export zip/CSVs and map to your schema. Export includes meal-level nutrition, progress history, exercise history.  ￼

7) AI Coach Requirements (Agentic)

Core capabilities
	•	Generates personalized calorie/macro targets and training guidance from inputs.
	•	Updates recommendations from observed trends (weight slope, adherence).
	•	Uses tool calls for:
	•	fetching user’s check-ins/nutrition/activity
	•	computing TDEE estimates & adherence
	•	searching the web for recipes or exercise references (via an approved Search API)
	•	optional: calling integration connectors

User trust requirements
	•	Every recommendation must include:
	•	“Why” (data-backed explanation)
	•	“What changed since last time”
	•	“Confidence level” + what data it’s missing
	•	Show when the AI used external tools (“Looked up 3 high-protein vegetarian recipes”)

Safety requirements
	•	No medical diagnoses.
	•	Guardrails against disordered eating: refuse unsafe calorie targets, avoid shaming language, prompt for professional help when needed.
	•	Sensitive content handling for photos (private by default, optional local-only mode).

8) Non-Functional Requirements
	•	Performance: check-in screen <300ms interactive; charts smooth.
	•	Reliability: offline-first for check-ins; sync when online.
	•	Security: encryption in transit, secure auth, least privilege.
	•	Privacy: granular consent, data deletion, minimal retention.
	•	Accessibility: Material design + screen reader labels, large text.
	•	Observability: crash reports, API tracing, audit logs for AI tool calls.

9) Compliance / Legal Considerations
	•	Treat user health and body data as sensitive.
	•	Provide:
	•	privacy policy + data retention schedule
	•	export + deletion workflows
	•	disclaimers: informational only, not medical advice

10) Milestones (Outcome-Based)
	•	MVP “logging + basic coaching” usable end-to-end
	•	Integration pathways working (at least Tier C import)
	•	AI coach shipping behind a feature flag with telemetry + safety checks
	•	CI/CD deploying staging and production with reproducible infra

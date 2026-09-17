# Pathwise 🧭

### AI-Powered Personalized DSA Learning Planner

**Pathwise** is a personalized learning platform for students learning **Data Structures & Algorithms (DSA)**.

Instead of asking learners to search through hundreds of playlists, courses, and practice problems, Pathwise helps them determine **what to learn, what to practice, and what to review next** based on their goals, current level, available study time, deadline, and preferred learning style.

> **Learn the right topic. Practice the right problems. Follow the right path.**

---

## 🎯 The Problem

Learning DSA online is not necessarily difficult because resources are unavailable.

The real problem is **choosing the right resources and following the right sequence**.

A learner often has to answer:

* Which DSA topic should I learn first?
* Which playlist should I follow?
* Which video should I watch?
* How much should I study today?
* Which problems should I solve after learning a topic?
* When should I revise?
* Am I actually improving?
* What should I do if I struggle with a topic?

There are thousands of tutorials, playlists, articles, and coding problems available online, but they are usually **not organized around an individual's learning journey**.

Pathwise is designed to solve this problem.

---

# 💡 What is Pathwise?

Pathwise converts a learner's goals and constraints into a structured learning journey.

The learner provides:

```text
Programming Language
        +
Current Skill Level
        +
Learning Goal
        +
Daily Available Time
        +
Target Deadline
        +
Learning Style
```

Pathwise then generates an ordered learning experience:

```text
                 ┌──────────────┐
                 │    Learn     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Practice   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Review    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  Assessment  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Adapt     │
                 └──────┬───────┘
                        │
                        └──────────→ Next Topic
```

---

# ✨ Core Features

## 🧑‍🎓 Personalized Learning Setup

Pathwise considers:

* Programming language
* Current experience level
* Learning goal
* Daily study time
* Target deadline
* Preferred learning style

This allows the roadmap to be generated around the learner instead of providing the same sequence to everyone.

---

## 🗺️ Structured DSA Roadmap

Pathwise organizes DSA into a logical progression.

A typical learning journey can look like:

```text
Programming Fundamentals
          ↓
Arrays
          ↓
Strings
          ↓
Searching
          ↓
Sorting
          ↓
Recursion
          ↓
Linked Lists
          ↓
Stacks & Queues
          ↓
Trees
          ↓
Graphs
          ↓
Greedy Algorithms
          ↓
Dynamic Programming
```

The roadmap engine is implemented in:

```text
lib/roadmap-engine.ts
```

---

## 📚 Resource-to-Topic Mapping

One of the core ideas behind Pathwise is connecting learning resources with the topics they teach.

Instead of:

```text
YouTube
 ↓
Search "DSA playlist"
 ↓
Open playlist
 ↓
Guess what to watch
```

Pathwise aims for:

```text
Learning Goal
      ↓
Topic
      ↓
Recommended Resource
      ↓
Specific Learning Session
```

The project includes seeded topic and resource metadata in:

```text
lib/data.ts
```

The Prisma data model also supports **resource-to-topic mappings**.

---

## 📅 Personalized Learning Plan

Pathwise breaks the roadmap into manageable learning sessions based on the learner's available time and target timeline.

For example:

```text
TODAY — 2 HOURS

01  Learn Arrays
    35 minutes

02  Implementation
    25 minutes

03  Practice Problems
    45 minutes

04  Quick Assessment
    10 minutes

05  Review
    5 minutes
```

The objective is simple:

> **Remove the friction of deciding what to study next.**

---

## 🧩 Practice & Assessment

Learning does not stop after watching a video.

Pathwise follows a:

```text
Learn
 ↓
Practice
 ↓
Review
 ↓
Assess
```

workflow.

This allows the system to use learner performance when determining what should happen next.

---

## 🔄 Adaptive Recommendations

The recommendation engine can provide progression guidance based on learner activity and performance.

For example:

```text
                  Topic
                    │
                    ▼
                Assessment
                    │
          ┌─────────┴─────────┐
          │                   │
       Strong              Weak
          │                   │
          ▼                   ▼
     Next Topic         More Practice
                              │
                              ▼
                           Review
                              │
                              ▼
                         Assessment
```

The recommendation logic is implemented in:

```text
lib/recommendation-engine.ts
```

---

# 🤖 AI Architecture

Pathwise is designed with a **swappable AI-provider architecture**.

Instead of coupling the application directly to a single AI provider, AI functionality is abstracted behind:

```text
lib/ai/
```

This makes it easier to:

* Change AI providers
* Add new models
* Test AI functionality independently
* Keep application logic separate from model-specific code

The AI layer can eventually support:

* Personalized study-plan generation
* Concept explanations
* Resource recommendations
* Practice recommendations
* Mistake analysis
* Revision suggestions
* Adaptive learning

---

# 🏗️ Architecture

```text
                       ┌─────────────────┐
                       │     Student     │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Next.js App   │
                       │       UI        │
                       └────────┬────────┘
                                │
                ┌───────────────┼────────────────┐
                │               │                │
                ▼               ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Roadmap    │ │Recommendation│ │  AI Provider │
        │    Engine    │ │    Engine    │ │  Abstraction │
        └──────┬───────┘ └──────┬───────┘ └──────────────┘
               │                │
               └────────┬───────┘
                        ▼
               ┌─────────────────┐
               │   Data Layer    │
               │ Prisma / DB     │
               └─────────────────┘
```

---

# 🛠️ Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Framework  | Next.js                          |
| Language   | TypeScript                       |
| UI         | React                            |
| Styling    | Tailwind CSS                     |
| Database   | PostgreSQL                       |
| ORM        | Prisma                           |
| Validation | Zod                              |
| AI         | Provider-agnostic AI abstraction |
| Testing    | Project test suite               |
| Linting    | ESLint                           |

The repository currently includes a Prisma schema, Next.js application structure, Tailwind configuration, and TypeScript configuration.

---

# 📁 Project Structure

```text
Learning-Platform/
│
├── app/
│   └── Route-level application UI
│
├── components/
│   └── Reusable UI components
│
├── lib/
│   ├── ai/
│   │   └── AI provider abstraction
│   │
│   ├── data.ts
│   │   └── Seeded topics and resource metadata
│   │
│   ├── roadmap-engine.ts
│   │   └── Personalized roadmap generation
│   │
│   └── recommendation-engine.ts
│       └── Adaptive progression logic
│
├── prisma/
│   └── schema.prisma
│       └── PostgreSQL data model
│
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

The repository currently contains these main application directories and configuration files.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* PostgreSQL *(when using the database layer)*

---

## 1. Clone the repository

```bash
git clone https://github.com/raahul4559/Learning-Platform.git

cd Learning-Platform
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure your database connection:

```env
DATABASE_URL="your-postgresql-connection-string"
```

The current demo can run without a PostgreSQL-backed repository because application state is currently persisted through browser local storage.

---

## 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Validation

Run the project's validation commands before submitting changes:

```bash
npm run typecheck
```

```bash
npm run test
```

```bash
npm run lint
```

```bash
npm run build
```

These commands are already documented by the repository for type checking, tests, linting, and production builds.

---

# 🧠 Example Learning Journey

Imagine a student wants to prepare for software-engineering interviews.

They enter:

```text
Language:
Java

Current Level:
Beginner

Goal:
Technical Interviews

Available Time:
2 hours/day

Deadline:
4 months

Learning Style:
Video + Practice
```

Pathwise can transform this into:

```text
                    Interview Goal
                         │
                         ▼
                  Initial Assessment
                         │
                         ▼
                 Personalized Roadmap
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        Arrays         Strings       Recursion
          │
          ▼
       Resources
          │
          ▼
      Daily Session
          │
          ▼
       Practice
          │
          ▼
      Assessment
          │
          ▼
   Recommendation Engine
          │
          ▼
      Next Session
```

---

# 🎯 MVP Philosophy

Pathwise is intentionally focused.

It is **not trying to become another giant course platform**.

The core idea is:

> **Don't give learners more content. Help them navigate the content they already have.**

The MVP focuses on:

* Personalization
* Structured learning paths
* Resource discovery
* Daily planning
* Practice
* Assessment
* Adaptive recommendations

---

# 🔮 Future Roadmap

## Phase 1 — Personalized DSA Planner

* [x] Learner configuration
* [x] DSA roadmap
* [x] Resource metadata
* [x] Roadmap engine
* [x] Recommendation engine
* [x] Learning workflow
* [x] Demo persistence

## Phase 2 — Intelligent Learning

* [ ] AI-generated study plans
* [ ] AI concept explanations
* [ ] AI mistake analysis
* [ ] Personalized revision
* [ ] Dynamic difficulty adjustment
* [ ] Smarter resource recommendations

## Phase 3 — Resource Discovery

* [ ] YouTube resource discovery
* [ ] Playlist analysis
* [ ] Topic extraction
* [ ] Automatic resource-to-topic mapping
* [ ] Resource quality signals

## Phase 4 — Practice Ecosystem

* [ ] Coding-platform integrations
* [ ] Problem recommendations
* [ ] Difficulty adaptation
* [ ] Pattern-based practice
* [ ] Automated progress synchronization

## Phase 5 — Long-Term Learning System

* [ ] Spaced repetition
* [ ] Advanced learner analytics
* [ ] Learning streaks
* [ ] Personalized revision calendar
* [ ] Multiple learning domains
* [ ] Mobile application

---

# 🔐 Security

When deploying Pathwise:

* Never commit `.env`
* Keep API keys server-side
* Validate user input
* Protect database credentials
* Validate AI-generated responses
* Use authentication for private learner data
* Apply authorization to protected resources

---

# 🤝 Contributing

Contributions are welcome.

### Create a feature branch

```bash
git checkout -b feature/your-feature
```

### Commit your changes

```bash
git add .
git commit -m "feat: add your feature"
```

### Push the branch

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# 📄 License

This project is currently intended for educational and development purposes.

If you plan to distribute Pathwise publicly, add an appropriate open-source license.

---

# 🌟 Vision

Pathwise

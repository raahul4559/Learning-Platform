/* Demo catalog only: no scraping or third-party API calls are made here. */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const topics = [
  ["complexity", "Complexity Analysis", "Measure time and space cost with Big-O, Big-Theta, and Big-Omega.", "BEGINNER", 75, 90, []],
  ["arrays", "Arrays", "Traverse, modify, and reason about contiguous collections.", "BEGINNER", 100, 180, ["complexity"]],
  ["strings", "Strings", "Work with character sequences, frequency counts, and transformations.", "BEGINNER", 90, 180, ["arrays"]],
  ["hashing", "Hashing", "Use hash maps and sets for membership, grouping, and lookup.", "INTERMEDIATE", 100, 210, ["arrays", "strings"]],
  ["two-pointers", "Two Pointers", "Use converging and same-direction pointers to reduce nested work.", "INTERMEDIATE", 90, 210, ["arrays", "strings"]],
  ["sliding-window", "Sliding Window", "Maintain a moving range and its invariants efficiently.", "INTERMEDIATE", 105, 240, ["two-pointers", "hashing"]],
  ["binary-search", "Binary Search", "Search sorted spaces and monotonic answer ranges.", "INTERMEDIATE", 100, 210, ["complexity", "arrays"]],
  ["linked-lists", "Linked Lists", "Manipulate nodes, pointers, reversal, and cycle detection.", "INTERMEDIATE", 105, 210, ["arrays"]],
  ["stack", "Stack", "Apply LIFO processing for matching, monotonic, and expression problems.", "INTERMEDIATE", 75, 180, ["arrays"]],
  ["queue", "Queue", "Apply FIFO processing, deques, and breadth-first workflows.", "INTERMEDIATE", 75, 180, ["arrays"]],
  ["recursion", "Recursion", "Design base cases and recursive decompositions.", "INTERMEDIATE", 110, 240, ["complexity"]],
  ["backtracking", "Backtracking", "Explore a decision tree with choices, constraints, and undo steps.", "ADVANCED", 110, 270, ["recursion"]],
  ["trees", "Trees", "Traverse binary trees with DFS, BFS, and recursive structure.", "INTERMEDIATE", 135, 300, ["recursion", "queue"]],
  ["bst", "Binary Search Trees", "Use ordering invariants for search, insertion, and validation.", "INTERMEDIATE", 85, 210, ["trees", "binary-search"]],
  ["heap", "Heap", "Maintain top-k and priority scheduling with priority queues.", "ADVANCED", 100, 240, ["trees"]],
  ["graphs", "Graphs", "Model connections and traverse using BFS, DFS, and visited state.", "ADVANCED", 150, 360, ["queue", "recursion"]],
  ["greedy", "Greedy Algorithms", "Prove local choices using ordering and exchange arguments.", "ADVANCED", 105, 270, ["arrays", "sorting"]],
  ["dynamic-programming", "Dynamic Programming", "Turn overlapping subproblems into memoized or tabulated solutions.", "ADVANCED", 165, 420, ["recursion", "arrays"]],
];

const moduleFor = (slug) => {
  if (["complexity", "arrays", "strings", "hashing", "two-pointers", "sliding-window", "binary-search"].includes(slug)) return "demo-dsa-foundations";
  if (["linked-lists", "stack", "queue", "recursion", "backtracking"].includes(slug)) return "demo-dsa-linear";
  return "demo-dsa-advanced";
};

const resourceTypes = ["YOUTUBE_PLAYLIST", "VIDEO", "ARTICLE", "COURSE", "PROBLEM_SHEET", "DOCUMENTATION", "PRACTICE_PLATFORM"];
const problemTitles = {
  complexity: "Analyze Nested Loop Cost", arrays: "Pair Sum in an Array", strings: "Longest Common Prefix", hashing: "First Unique Character",
  "two-pointers": "Container With Most Water", "sliding-window": "Longest Substring Without Repeating Characters", "binary-search": "First True in a Sorted Range",
  "linked-lists": "Reverse a Linked List", stack: "Valid Parentheses", queue: "Implement a Circular Queue", recursion: "Generate Power Set Sum",
  backtracking: "Combination Sum", trees: "Level Order Traversal", bst: "Validate a Binary Search Tree", heap: "Kth Largest Element",
  graphs: "Number of Islands", greedy: "Minimum Meeting Rooms", "dynamic-programming": "Coin Change"
};

async function upsertTopic(topic, position) {
  const [slug, title, description, difficulty, learning, practice] = topic;
  return prisma.topic.upsert({
    where: { slug },
    update: { title, description, difficulty, position, estimatedLearningMinutes: learning, estimatedPracticeMinutes: practice, moduleId: moduleFor(slug) },
    create: { id: `demo-topic-${slug}`, slug, title, description, difficulty, position, estimatedLearningMinutes: learning, estimatedPracticeMinutes: practice, moduleId: moduleFor(slug) }
  });
}

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "demo-user" },
    update: { email: "demo@pathwise.local", displayName: "Pathwise Demo Learner" },
    create: { id: "demo-user", email: "demo@pathwise.local", displayName: "Pathwise Demo Learner" }
  });
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { preferredLanguage: "Java", experienceLevel: "Beginner", dailyMinutes: 90, timezone: "Asia/Kolkata" },
    create: { userId: user.id, preferredLanguage: "Java", experienceLevel: "Beginner", dailyMinutes: 90, timezone: "Asia/Kolkata", preferences: { learningStyle: "mixed" } }
  });

  await prisma.learningGoal.upsert({
    where: { id: "demo-dsa-goal" },
    update: { status: "ACTIVE" },
    create: { id: "demo-dsa-goal", userId: user.id, title: "Placement preparation", domain: "Data Structures and Algorithms", description: "Build interview-ready DSA fluency in Java.", status: "ACTIVE", targetDate: new Date("2027-03-31") }
  });
  // A second goal demonstrates that plans are not constrained to DSA.
  await prisma.learningGoal.upsert({
    where: { id: "demo-web-goal" },
    update: { status: "DRAFT" },
    create: { id: "demo-web-goal", userId: user.id, title: "Project learning", domain: "Web Development", description: "Learn Next.js through a portfolio project.", status: "DRAFT" }
  });
  await prisma.roadmap.upsert({
    where: { id: "demo-dsa-roadmap" },
    update: { status: "ACTIVE", estimatedMinutes: 3665 },
    create: { id: "demo-dsa-roadmap", learningGoalId: "demo-dsa-goal", title: "DSA → Java → Placement preparation", description: "A progressive interview-preparation plan.", status: "ACTIVE", estimatedMinutes: 3665, settings: { language: "Java" } }
  });
  await prisma.roadmap.upsert({
    where: { id: "demo-web-roadmap" },
    update: {},
    create: { id: "demo-web-roadmap", learningGoalId: "demo-web-goal", title: "Web Development → Next.js → Project learning", status: "DRAFT", settings: { language: "TypeScript" } }
  });

  const modules = [
    ["demo-dsa-foundations", "Foundations and Patterns", "Build analysis skills and array/string patterns."],
    ["demo-dsa-linear", "Linear Structures and Search", "Master linked structures, recursion, and systematic search."],
    ["demo-dsa-advanced", "Trees, Graphs, and Optimization", "Apply non-linear structures and advanced optimization techniques."]
  ];
  for (const [id, title, description] of modules) {
    await prisma.module.upsert({ where: { id }, update: { title, description }, create: { id, roadmapId: "demo-dsa-roadmap", title, description, position: modules.findIndex(([moduleId]) => moduleId === id) + 1 } });
  }

  const bySlug = {};
  for (let i = 0; i < topics.length; i += 1) bySlug[topics[i][0]] = await upsertTopic(topics[i], i + 1);

  for (const [slug, , , , , , prerequisites] of topics) {
    for (const prerequisiteSlug of prerequisites) {
      // "sorting" is intentionally a conceptual prerequisite, represented in metadata until it is added as a topic.
      if (bySlug[prerequisiteSlug]) await prisma.topicPrerequisite.upsert({ where: { topicId_prerequisiteId: { topicId: bySlug[slug].id, prerequisiteId: bySlug[prerequisiteSlug].id } }, update: {}, create: { topicId: bySlug[slug].id, prerequisiteId: bySlug[prerequisiteSlug].id } });
    }
  }

  for (let i = 0; i < topics.length; i += 1) {
    const [slug, title, , difficulty] = topics[i];
    const resourceSlug = `demo-${slug}-resource`;
    const type = resourceTypes[i % resourceTypes.length];
    const resource = await prisma.resource.upsert({
      where: { slug: resourceSlug },
      update: { title: `${title}: guided ${type.toLowerCase().replaceAll("_", " ")}`, type },
      create: { slug: resourceSlug, title: `${title}: guided ${type.toLowerCase().replaceAll("_", " ")}`, description: `Seeded ${title} learning resource for the demo catalog.`, type, url: `https://example.org/demo/dsa/${slug}`, provider: "Demo Learning Library", metadata: { seeded: true } }
    });
    await prisma.resourceTopic.upsert({ where: { resourceId_topicId: { resourceId: resource.id, topicId: bySlug[slug].id } }, update: { position: 1 }, create: { resourceId: resource.id, topicId: bySlug[slug].id, position: 1, sectionMetadata: { recommended: true } } });
    const problemDifficulty = difficulty === "BEGINNER" ? "EASY" : difficulty === "INTERMEDIATE" ? "MEDIUM" : "HARD";
    await prisma.problem.upsert({
      where: { slug: `demo-${slug}-problem` },
      update: { title: problemTitles[slug], difficulty: problemDifficulty, subtopic: "Core pattern", topicId: bySlug[slug].id },
      create: { slug: `demo-${slug}-problem`, topicId: bySlug[slug].id, title: problemTitles[slug], description: `A seeded practice prompt for ${title}. Explain the approach and its complexity.`, difficulty: problemDifficulty, subtopic: "Core pattern", estimatedMinutes: difficulty === "ADVANCED" ? 45 : 30, url: `https://example.org/demo/problems/${slug}`, platform: "Demo Practice", tags: [slug, "dsa"] }
    });
    const assessment = await prisma.assessment.upsert({
      where: { slug: `demo-${slug}-quiz` },
      update: { title: `${title} check-in`, topicId: bySlug[slug].id, isPublished: true },
      create: { slug: `demo-${slug}-quiz`, topicId: bySlug[slug].id, title: `${title} check-in`, description: `A short seeded quiz for ${title}.`, passingScore: 70, estimatedMinutes: 10, isPublished: true }
    });
    await prisma.question.deleteMany({ where: { assessmentId: assessment.id } });
    await prisma.question.createMany({ data: [
      { assessmentId: assessment.id, position: 1, prompt: `Which statement best describes the main goal of ${title}?`, type: "SINGLE_CHOICE", options: ["Apply the topic's core invariant", "Memorize syntax only", "Avoid testing edge cases", "Always use brute force"], correctAnswer: "Apply the topic's core invariant", explanation: "Strong solutions preserve the topic's key invariant.", points: 1 },
      { assessmentId: assessment.id, position: 2, prompt: `A good ${title} solution should state its time and space complexity.`, type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "True", explanation: "Complexity is part of communicating and evaluating an algorithm.", points: 1 }
    ] });
  }

  const progress = await prisma.userProgress.upsert({
    where: { userId_roadmapId: { userId: user.id, roadmapId: "demo-dsa-roadmap" } },
    update: { status: "IN_PROGRESS", completion: 8 },
    create: { userId: user.id, learningGoalId: "demo-dsa-goal", roadmapId: "demo-dsa-roadmap", status: "IN_PROGRESS", completion: 8, startedAt: new Date("2026-09-01") }
  });
  await prisma.topicProgress.upsert({ where: { userProgressId_topicId: { userProgressId: progress.id, topicId: bySlug.complexity.id } }, update: { status: "COMPLETED", completion: 100 }, create: { userProgressId: progress.id, topicId: bySlug.complexity.id, status: "COMPLETED", completion: 100, assessmentScore: 100, practiceAccuracy: 80, timeSpentMinutes: 145, completedAt: new Date("2026-09-03") } });
  await prisma.studySession.upsert({ where: { id: "demo-study-session-1" }, update: { durationMinutes: 45 }, create: { id: "demo-study-session-1", userId: user.id, userProgressId: progress.id, topicId: bySlug.arrays.id, startedAt: new Date("2026-09-19T08:00:00Z"), endedAt: new Date("2026-09-19T08:45:00Z"), durationMinutes: 45, notes: "Practised prefix sums and boundary cases." } });
  await prisma.dailyTask.upsert({ where: { id: "demo-daily-task-1" }, update: { status: "NOT_STARTED" }, create: { id: "demo-daily-task-1", userId: user.id, userProgressId: progress.id, topicId: bySlug.arrays.id, title: "Solve Pair Sum in an Array", description: "Write a hash-map solution and compare it with brute force.", type: "PRACTICE", dueDate: new Date("2026-09-19"), estimatedMinutes: 30, status: "NOT_STARTED", position: 1 } });
  const complexityQuiz = await prisma.assessment.findUniqueOrThrow({ where: { slug: "demo-complexity-quiz" } });
  const complexityProblem = await prisma.problem.findUniqueOrThrow({ where: { slug: "demo-complexity-problem" } });
  await prisma.assessmentAttempt.upsert({ where: { id: "demo-assessment-attempt-1" }, update: { score: 2 }, create: { id: "demo-assessment-attempt-1", userId: user.id, assessmentId: complexityQuiz.id, status: "GRADED", score: 2, maxScore: 2, answers: { 1: "Apply the topic's core invariant", 2: "True" }, startedAt: new Date("2026-09-03T08:00:00Z"), submittedAt: new Date("2026-09-03T08:08:00Z") } });
  await prisma.problemAttempt.upsert({ where: { id: "demo-problem-attempt-1" }, update: { isSolved: true }, create: { id: "demo-problem-attempt-1", userId: user.id, problemId: complexityProblem.id, status: "GRADED", isSolved: true, language: "Java", durationMinutes: 25, startedAt: new Date("2026-09-03T09:00:00Z"), submittedAt: new Date("2026-09-03T09:25:00Z"), notes: "Used operation counting." } });

  console.log(`Seeded ${topics.length} DSA topics, resources, problems, quizzes, and a multi-plan demo learner.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());

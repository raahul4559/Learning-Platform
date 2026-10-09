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

/* Seeded assessment question bank: 5 single-choice questions per topic, hand-written (no AI generation). */
const questionBank = {
  complexity: [
    { prompt: "What does Big-O notation describe?", options: ["The exact runtime in seconds", "The upper bound growth rate of an algorithm's cost as input size grows", "The amount of memory a variable uses", "The number of lines of code"], correctAnswer: "The upper bound growth rate of an algorithm's cost as input size grows" },
    { prompt: "What is the time complexity of a single loop that runs n times?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "Two nested loops, each running n times, produce what complexity?", options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"], correctAnswer: "O(n²)" },
    { prompt: "Which complexity grows fastest as n increases?", options: ["O(log n)", "O(n)", "O(n²)", "O(2ⁿ)"], correctAnswer: "O(2ⁿ)" },
    { prompt: "What does O(1) represent?", options: ["Linear time", "Constant time, independent of input size", "Logarithmic time", "Exponential time"], correctAnswer: "Constant time, independent of input size" },
  ],
  arrays: [
    { prompt: "What is the time complexity of accessing an array element by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: "O(1)" },
    { prompt: "Inserting an element at the start of an array of size n requires shifting how many elements in the worst case?", options: ["0", "1", "n", "log n"], correctAnswer: "n" },
    { prompt: "What is the time complexity of linear search in an unsorted array?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "Which technique finds the maximum subarray sum in O(n) time?", options: ["Brute-force pairs", "Kadane's algorithm", "Bubble sort", "Binary search"], correctAnswer: "Kadane's algorithm" },
    { prompt: "Arrays store elements using what kind of memory layout?", options: ["Linked nodes scattered in memory", "Contiguous memory", "Hash buckets", "Tree nodes"], correctAnswer: "Contiguous memory" },
  ],
  strings: [
    { prompt: "What is the time complexity of comparing two strings of length n character by character?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "Which data structure is commonly used to count character frequencies in a string?", options: ["Stack", "Hash map", "Binary search tree", "Heap"], correctAnswer: "Hash map" },
    { prompt: "Which technique finds the longest palindromic substring by expanding outward from a center?", options: ["Expand around center", "Binary search", "Dijkstra's algorithm", "Topological sort"], correctAnswer: "Expand around center" },
    { prompt: "Reversing a string of length n takes what time complexity?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "What is an anagram?", options: ["A string that reads the same forwards and backwards", "A rearrangement of another string's letters", "A substring of another string", "A string with no repeated characters"], correctAnswer: "A rearrangement of another string's letters" },
  ],
  hashing: [
    { prompt: "What is the average time complexity of a hash map lookup?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(1)" },
    { prompt: "What causes two different keys to map to the same bucket?", options: ["Resizing", "Collision", "Rehashing", "Chaining"], correctAnswer: "Collision" },
    { prompt: "Which strategy resolves collisions by storing multiple entries per bucket in a linked list?", options: ["Open addressing", "Separate chaining", "Binary search", "Linear probing only"], correctAnswer: "Separate chaining" },
    { prompt: "What problem does a hash set efficiently solve?", options: ["Sorting elements", "Membership / uniqueness checks", "Finding shortest paths", "Balancing a tree"], correctAnswer: "Membership / uniqueness checks" },
    { prompt: "What happens to a hash map's performance when too many collisions occur?", options: ["It stays O(1) always", "It can degrade toward O(n)", "It becomes O(log n)", "Performance is unaffected"], correctAnswer: "It can degrade toward O(n)" },
  ],
  "two-pointers": [
    { prompt: "The two-pointer technique is most naturally applied to which kind of input?", options: ["Unsorted hash maps", "Sorted arrays or sequences", "Unordered graphs", "Binary trees only"], correctAnswer: "Sorted arrays or sequences" },
    { prompt: "In \"container with most water\", which pointer should you move at each step?", options: ["Always the left pointer", "Always the right pointer", "The pointer at the shorter line", "Both pointers simultaneously, always"], correctAnswer: "The pointer at the shorter line" },
    { prompt: "What is the time complexity of a two-pointer scan over an array of size n?", options: ["O(1)", "O(n)", "O(n log n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "Two pointers moving toward each other from opposite ends is called what?", options: ["Sliding window", "Converging pointers", "Fast-slow pointers", "Binary search"], correctAnswer: "Converging pointers" },
    { prompt: "What do \"fast and slow\" pointers (Floyd's algorithm) commonly detect?", options: ["A sort order", "A cycle in a linked list", "The median value", "A tree imbalance"], correctAnswer: "A cycle in a linked list" },
  ],
  "sliding-window": [
    { prompt: "A sliding window is used to efficiently process what kind of problems?", options: ["Static single-element lookups", "Contiguous subarrays or substrings", "Unrelated random pairs", "Tree traversals"], correctAnswer: "Contiguous subarrays or substrings" },
    { prompt: "What is the time complexity of a sliding window scan where each element is visited a constant number of times?", options: ["O(n²)", "O(n log n)", "O(n)", "O(2ⁿ)"], correctAnswer: "O(n)" },
    { prompt: "When does a sliding window shrink from the left?", options: ["Never", "When the window violates a constraint", "Only at the very end", "On every single step, regardless of constraint"], correctAnswer: "When the window violates a constraint" },
    { prompt: "\"Longest substring without repeating characters\" is efficiently solved using which approach?", options: ["Sliding window with a hash set/map", "Sorting", "Dynamic programming over all pairs", "Depth-first search"], correctAnswer: "Sliding window with a hash set/map" },
    { prompt: "A fixed-size sliding window is useful when you need what?", options: ["All subsequences", "A running aggregate (sum/max) over a constant-size range", "A sorted copy of the array", "The graph's shortest path"], correctAnswer: "A running aggregate (sum/max) over a constant-size range" },
  ],
  "binary-search": [
    { prompt: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: "O(log n)" },
    { prompt: "Binary search requires the input to be what?", options: ["A linked list", "Sorted (or monotonic)", "A hash map", "Unsorted"], correctAnswer: "Sorted (or monotonic)" },
    { prompt: "At each step, binary search eliminates what fraction of the remaining search space?", options: ["A quarter", "A third", "Half", "None"], correctAnswer: "Half" },
    { prompt: "Searching over a monotonic function's answer space using binary search is often called what?", options: ["Binary search on the answer", "Brute-force enumeration", "Topological sort", "Greedy selection"], correctAnswer: "Binary search on the answer" },
    { prompt: "What happens if you run standard binary search on an unsorted array?", options: ["It still works correctly", "It may return an incorrect or missed result", "It always finds the minimum", "It becomes O(1)"], correctAnswer: "It may return an incorrect or missed result" },
  ],
  "linked-lists": [
    { prompt: "What is the time complexity of inserting a node at the head of a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: "O(1)" },
    { prompt: "What is the time complexity of accessing the k-th element of a singly linked list?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(n)" },
    { prompt: "Which algorithm detects a cycle in a linked list in O(n) time and O(1) space?", options: ["Binary search", "Floyd's tortoise and hare", "Dijkstra's algorithm", "Merge sort"], correctAnswer: "Floyd's tortoise and hare" },
    { prompt: "Reversing a singly linked list in place requires tracking which pointers?", options: ["Only the head", "Previous, current, and next", "Only the tail", "A full copy of the list"], correctAnswer: "Previous, current, and next" },
    { prompt: "What is a key disadvantage of linked lists compared to arrays?", options: ["O(1) random access", "No contiguous memory, so no O(1) random access", "Fixed size", "Cannot grow dynamically"], correctAnswer: "No contiguous memory, so no O(1) random access" },
  ],
  stack: [
    { prompt: "A stack follows which ordering principle?", options: ["FIFO", "LIFO", "Random access", "Priority-based"], correctAnswer: "LIFO" },
    { prompt: "What is the time complexity of push and pop on a stack?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: "O(1)" },
    { prompt: "Which problem is classically solved using a stack to track opening/closing symbols?", options: ["Valid parentheses", "Shortest path", "Binary search", "Topological sort"], correctAnswer: "Valid parentheses" },
    { prompt: "A \"monotonic stack\" is used to efficiently solve which kind of problem?", options: ["Sorting a hash map", "Next greater / smaller element problems", "Graph coloring", "String hashing"], correctAnswer: "Next greater / smaller element problems" },
    { prompt: "What does the call stack behave like during recursive function calls?", options: ["A queue", "A stack", "A heap", "A hash map"], correctAnswer: "A stack" },
  ],
  queue: [
    { prompt: "A queue follows which ordering principle?", options: ["LIFO", "FIFO", "Random access", "Priority-based only"], correctAnswer: "FIFO" },
    { prompt: "What is the time complexity of enqueue and dequeue on a well-implemented queue?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: "O(1)" },
    { prompt: "Breadth-first search uses which data structure to track nodes still to visit?", options: ["Stack", "Queue", "Heap", "Binary search tree"], correctAnswer: "Queue" },
    { prompt: "What does a circular queue avoid?", options: ["Wasted space from unused slots at the front", "Underflow only", "Hash collisions", "Recursion depth limits"], correctAnswer: "Wasted space from unused slots at the front" },
    { prompt: "A deque (double-ended queue) allows insertion and removal at which ends?", options: ["Only the front", "Only the back", "Both ends", "Neither end"], correctAnswer: "Both ends" },
  ],
  recursion: [
    { prompt: "Every correct recursive function must have what?", options: ["A loop", "A base case", "A global variable", "Multiple return types"], correctAnswer: "A base case" },
    { prompt: "What data structure implicitly tracks recursive function calls?", options: ["Queue", "Call stack", "Hash map", "Heap"], correctAnswer: "Call stack" },
    { prompt: "What risk does deep, unbounded recursion carry?", options: ["Guaranteed memory savings", "Stack overflow", "Automatic memoization", "Guaranteed O(1) time"], correctAnswer: "Stack overflow" },
    { prompt: "Recursion that re-solves identical overlapping subproblems can be optimized using what?", options: ["Random shuffling", "Memoization", "Sorting first", "Removing the base case"], correctAnswer: "Memoization" },
    { prompt: "Tail recursion is characterized by what?", options: ["The recursive call is the last operation performed", "Having no base case", "Multiple unrelated recursive calls", "Always O(n²) time"], correctAnswer: "The recursive call is the last operation performed" },
  ],
  backtracking: [
    { prompt: "When a choice fails a constraint, backtracking does what?", options: ["Restarts from scratch every time", "Undoes the last choice and tries another", "Ignores constraints entirely", "Sorts the input first"], correctAnswer: "Undoes the last choice and tries another" },
    { prompt: "Which classic problem is solved with backtracking over choosing/excluding elements?", options: ["Combination sum", "Binary search", "Dijkstra's algorithm", "Kadane's algorithm"], correctAnswer: "Combination sum" },
    { prompt: "Backtracking is often visualized as exploring what kind of structure?", options: ["A single linear array", "A decision tree", "A hash table", "A sorted list"], correctAnswer: "A decision tree" },
    { prompt: "What technique prunes a backtracking search to avoid wasted work?", options: ["Early constraint checking", "Removing the base case", "Ignoring duplicates always", "Increasing recursion depth"], correctAnswer: "Early constraint checking" },
    { prompt: "Compared to pure brute force, backtracking is typically more efficient because it:", options: ["Explores every possibility with no shortcuts", "Abandons invalid partial solutions early", "Always runs in O(n)", "Avoids recursion entirely"], correctAnswer: "Abandons invalid partial solutions early" },
  ],
  trees: [
    { prompt: "What is the defining property of a binary tree?", options: ["Every node has exactly two children", "Every node has at most two children", "Nodes form a cycle", "All nodes are leaves"], correctAnswer: "Every node has at most two children" },
    { prompt: "Which traversal visits the left subtree, then the root, then the right subtree?", options: ["Preorder", "Inorder", "Postorder", "Level order"], correctAnswer: "Inorder" },
    { prompt: "Breadth-first traversal of a tree is also known as what?", options: ["Inorder traversal", "Level order traversal", "Postorder traversal", "Depth-first traversal"], correctAnswer: "Level order traversal" },
    { prompt: "What is the time complexity of visiting every node in a tree with n nodes?", options: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correctAnswer: "O(n)" },
    { prompt: "Which traversal is commonly used to safely delete a tree (children before parent)?", options: ["Preorder", "Inorder", "Postorder", "Level order"], correctAnswer: "Postorder" },
  ],
  bst: [
    { prompt: "In a binary search tree, where are values smaller than a node's value stored?", options: ["In the right subtree", "In the left subtree", "At the root only", "In a separate hash map"], correctAnswer: "In the left subtree" },
    { prompt: "What is the average time complexity of search, insert, and delete in a balanced BST?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(log n)" },
    { prompt: "What causes a BST's operations to degrade toward O(n)?", options: ["Balanced insertion order", "The tree becoming skewed / unbalanced", "Using inorder traversal", "Storing duplicate values"], correctAnswer: "The tree becoming skewed / unbalanced" },
    { prompt: "An inorder traversal of a valid BST produces values in what order?", options: ["Random order", "Sorted ascending order", "Sorted descending order", "Level order"], correctAnswer: "Sorted ascending order" },
    { prompt: "Which self-balancing tree variant guarantees O(log n) operations?", options: ["Linked list", "AVL tree or Red-Black tree", "Unsorted array", "Hash map"], correctAnswer: "AVL tree or Red-Black tree" },
  ],
  heap: [
    { prompt: "In a min-heap, where is the smallest element always located?", options: ["At a random leaf", "At the root", "At the last index", "Not guaranteed anywhere specific"], correctAnswer: "At the root" },
    { prompt: "What is the time complexity of inserting into a binary heap?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(log n)" },
    { prompt: "What is a heap commonly used to efficiently solve?", options: ["Exact string matching", "Top-k / priority scheduling problems", "Graph coloring", "Hashing"], correctAnswer: "Top-k / priority scheduling problems" },
    { prompt: "What is the time complexity of extracting the min (or max) from a binary heap?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: "O(log n)" },
    { prompt: "A binary heap is typically implemented using what underlying structure?", options: ["A linked list", "An array", "A hash map", "A graph adjacency list"], correctAnswer: "An array" },
  ],
  graphs: [
    { prompt: "Which traversal uses a queue and explores neighbors level by level?", options: ["Depth-first search", "Breadth-first search", "Backtracking", "Binary search"], correctAnswer: "Breadth-first search" },
    { prompt: "Which traversal explores as deep as possible before backtracking?", options: ["Breadth-first search", "Depth-first search", "Binary search", "Two-pointer scan"], correctAnswer: "Depth-first search" },
    { prompt: "Which structure represents a sparse graph's edges efficiently?", options: ["Adjacency matrix only", "Adjacency list", "A hash set of all pairs", "A single array"], correctAnswer: "Adjacency list" },
    { prompt: "What must you track during traversal to avoid infinite loops in cyclic graphs?", options: ["Nothing extra is needed", "Visited nodes", "Only the call stack depth", "Sorted order of nodes"], correctAnswer: "Visited nodes" },
    { prompt: "\"Number of islands\" is typically solved using which technique?", options: ["Binary search", "BFS/DFS flood fill", "Dynamic programming over subsets", "Two-pointer scan"], correctAnswer: "BFS/DFS flood fill" },
  ],
  greedy: [
    { prompt: "A greedy algorithm makes decisions based on what?", options: ["Exploring every possible combination", "The locally optimal choice at each step", "Random selection", "Reversing the input first"], correctAnswer: "The locally optimal choice at each step" },
    { prompt: "Greedy algorithms are only correct when the problem has what property?", options: ["No structure at all", "The greedy-choice property and optimal substructure", "An exponential solution space only", "No valid ordering"], correctAnswer: "The greedy-choice property and optimal substructure" },
    { prompt: "\"Minimum meeting rooms\" is commonly solved by greedily doing what?", options: ["Ignoring overlaps", "Sorting intervals and tracking overlaps", "Trying every permutation", "Using a hash map only"], correctAnswer: "Sorting intervals and tracking overlaps" },
    { prompt: "Compared to dynamic programming, greedy algorithms are typically:", options: ["Slower but always correct", "Faster but only correct for specific problem structures", "Identical in all cases", "Never usable for scheduling problems"], correctAnswer: "Faster but only correct for specific problem structures" },
    { prompt: "Interval scheduling to maximize the count of activities is typically solved by sorting by what?", options: ["Start time only", "Earliest finish time", "Duration descending", "Random order"], correctAnswer: "Earliest finish time" },
  ],
  "dynamic-programming": [
    { prompt: "Dynamic programming is most useful when a problem has what two properties?", options: ["Randomness and no structure", "Overlapping subproblems and optimal substructure", "Only greedy choices", "No recursive structure"], correctAnswer: "Overlapping subproblems and optimal substructure" },
    { prompt: "What technique stores previously computed subproblem results to avoid recomputation?", options: ["Backtracking", "Memoization/tabulation", "Sorting", "Hashing without storage"], correctAnswer: "Memoization/tabulation" },
    { prompt: "\"Coin change\" (minimum coins for an amount) is a classic example of which DP pattern?", options: ["Interval DP", "Unbounded knapsack-style DP", "Tree DP", "Bitmask DP"], correctAnswer: "Unbounded knapsack-style DP" },
    { prompt: "Top-down DP typically combines recursion with what?", options: ["No storage at all", "A memo/cache of computed results", "Only iteration", "Randomized restarts"], correctAnswer: "A memo/cache of computed results" },
    { prompt: "Bottom-up DP (tabulation) builds a solution by doing what?", options: ["Starting from the final answer backward with no table", "Filling a table from smaller subproblems upward", "Ignoring subproblem order entirely", "Always using recursion only"], correctAnswer: "Filling a table from smaller subproblems upward" },
  ],
};
const problemTitles = {
  complexity: "Analyze Nested Loop Cost", arrays: "Pair Sum in an Array", strings: "Longest Common Prefix", hashing: "First Unique Character",
  "two-pointers": "Container With Most Water", "sliding-window": "Longest Substring Without Repeating Characters", "binary-search": "First True in a Sorted Range",
  "linked-lists": "Reverse a Linked List", stack: "Valid Parentheses", queue: "Implement a Circular Queue", recursion: "Generate Power Set Sum",
  backtracking: "Combination Sum", trees: "Level Order Traversal", bst: "Validate a Binary Search Tree", heap: "Kth Largest Element",
  graphs: "Number of Islands", greedy: "Minimum Meeting Rooms", "dynamic-programming": "Coin Change"
};

/*
 * Resource-to-roadmap mapping demo data: a single seeded YouTube playlist with
 * curated video ranges per topic (e.g. Arrays -> videos 4-8). This is exactly
 * the shape a future YouTube Data API or course-syllabus ingestion provider
 * would produce — see lib/resource-mapping/ — except it's hand-curated here
 * rather than extracted automatically.
 */
const javaDsaCourseSections = {
  complexity: [1, 3], arrays: [4, 8], strings: [9, 12], hashing: [13, 14], "two-pointers": [15, 16], "sliding-window": [17, 17],
  "binary-search": [18, 22], "linked-lists": [23, 23], recursion: [25, 30], stack: [31, 32], queue: [33, 33], backtracking: [34, 36],
  trees: [40, 52], bst: [53, 57], heap: [58, 61], graphs: [62, 68], greedy: [69, 72], "dynamic-programming": [73, 80],
};

async function seedResourceMapping(bySlug) {
  const resource = await prisma.resource.upsert({
    where: { slug: "java-dsa-complete-course" },
    update: { title: "Java DSA Complete Course", type: "YOUTUBE_PLAYLIST" },
    create: {
      slug: "java-dsa-complete-course", title: "Java DSA Complete Course",
      description: "A seeded, topic-mapped YouTube playlist demonstrating the resource-to-roadmap mapping system.",
      type: "YOUTUBE_PLAYLIST", url: "https://www.youtube.com/playlist?list=seeded-java-dsa-complete-course",
      provider: "Seeded Demo Catalog", metadata: { seeded: true, totalVideos: 80 },
    },
  });
  for (const [slug, [startIndex, endIndex]] of Object.entries(javaDsaCourseSections)) {
    const topic = bySlug[slug];
    if (!topic) continue;
    const sectionMetadata = { unit: "video", startIndex, endIndex, label: `Videos ${startIndex}–${endIndex}` };
    const existing = await prisma.resourceTopic.findUnique({ where: { resourceId_topicId: { resourceId: resource.id, topicId: topic.id } } });
    const position = existing ? existing.position : (await prisma.resourceTopic.count({ where: { topicId: topic.id } })) + 1;
    await prisma.resourceTopic.upsert({
      where: { resourceId_topicId: { resourceId: resource.id, topicId: topic.id } },
      update: { position, sectionMetadata },
      create: { resourceId: resource.id, topicId: topic.id, position, sectionMetadata },
    });
  }
}

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
      update: { title: `${title} Assessment`, topicId: bySlug[slug].id, isPublished: true },
      create: { slug: `demo-${slug}-quiz`, topicId: bySlug[slug].id, title: `${title} Assessment`, description: `A short seeded checkpoint quiz for ${title}.`, passingScore: 70, estimatedMinutes: 10, isPublished: true }
    });
    await prisma.question.deleteMany({ where: { assessmentId: assessment.id } });
    const bankQuestions = questionBank[slug] ?? [];
    await prisma.question.createMany({ data: bankQuestions.map((question, index) => ({
      assessmentId: assessment.id, position: index + 1, prompt: question.prompt, type: "SINGLE_CHOICE",
      options: question.options, correctAnswer: question.correctAnswer, points: 1,
    })) });
  }

  await seedResourceMapping(bySlug);

  const progress = await prisma.userProgress.upsert({
    where: { userId_roadmapId: { userId: user.id, roadmapId: "demo-dsa-roadmap" } },
    update: { status: "IN_PROGRESS", completion: 8 },
    create: { userId: user.id, learningGoalId: "demo-dsa-goal", roadmapId: "demo-dsa-roadmap", status: "IN_PROGRESS", completion: 8, startedAt: new Date("2026-09-01") }
  });
  await prisma.topicProgress.upsert({ where: { userProgressId_topicId: { userProgressId: progress.id, topicId: bySlug.complexity.id } }, update: { status: "COMPLETED", completion: 100 }, create: { userProgressId: progress.id, topicId: bySlug.complexity.id, status: "COMPLETED", completion: 100, assessmentScore: 100, practiceAccuracy: 80, timeSpentMinutes: 145, completedAt: new Date("2026-09-03") } });
  await prisma.studySession.upsert({ where: { id: "demo-study-session-1" }, update: { durationMinutes: 45 }, create: { id: "demo-study-session-1", userId: user.id, userProgressId: progress.id, topicId: bySlug.arrays.id, startedAt: new Date("2026-09-19T08:00:00Z"), endedAt: new Date("2026-09-19T08:45:00Z"), durationMinutes: 45, notes: "Practised prefix sums and boundary cases." } });
  await prisma.dailyTask.upsert({ where: { id: "demo-daily-task-1" }, update: { status: "NOT_STARTED" }, create: { id: "demo-daily-task-1", userId: user.id, userProgressId: progress.id, topicId: bySlug.arrays.id, title: "Solve Pair Sum in an Array", description: "Write a hash-map solution and compare it with brute force.", type: "PRACTICE", dueDate: new Date("2026-09-19"), estimatedMinutes: 30, status: "NOT_STARTED", position: 1 } });
  const complexityQuiz = await prisma.assessment.findUniqueOrThrow({ where: { slug: "demo-complexity-quiz" }, include: { questions: { orderBy: { position: "asc" } } } });
  const complexityProblem = await prisma.problem.findUniqueOrThrow({ where: { slug: "demo-complexity-problem" } });
  const complexityAnswers = Object.fromEntries(complexityQuiz.questions.map((question) => [question.id, question.correctAnswer]));
  await prisma.assessmentAttempt.upsert({ where: { id: "demo-assessment-attempt-1" }, update: { score: complexityQuiz.questions.length, maxScore: complexityQuiz.questions.length, answers: complexityAnswers }, create: { id: "demo-assessment-attempt-1", userId: user.id, assessmentId: complexityQuiz.id, status: "GRADED", score: complexityQuiz.questions.length, maxScore: complexityQuiz.questions.length, answers: complexityAnswers, startedAt: new Date("2026-09-03T08:00:00Z"), submittedAt: new Date("2026-09-03T08:08:00Z") } });
  await prisma.problemAttempt.upsert({ where: { id: "demo-problem-attempt-1" }, update: { isSolved: true }, create: { id: "demo-problem-attempt-1", userId: user.id, problemId: complexityProblem.id, status: "GRADED", isSolved: true, language: "Java", durationMinutes: 25, startedAt: new Date("2026-09-03T09:00:00Z"), submittedAt: new Date("2026-09-03T09:25:00Z"), notes: "Used operation counting." } });

  console.log(`Seeded ${topics.length} DSA topics, resources, problems, quizzes, a mapped course (Java DSA Complete Course), and a multi-plan demo learner.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());

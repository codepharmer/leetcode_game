import { useState, useEffect, useCallback, useRef } from "react";

// TEMPLATE DATA
const UNIVERSAL_TEMPLATE = {
  name: "Universal Interview Skeleton",
  code: `def solve(input):
    # 1) Clarify: constraints, edge cases, return format
    # 2) Restate: what must be true at the end?
    # 3) Choose pattern: hash / 2ptr / window / dfs / dp / etc.
    # 4) Implement with invariants + helper funcs
    # 5) Test mentally on:
    #    - smallest
    #    - typical
    #    - tricky (duplicates, empty, negatives, cycles)
    return ans`,
};

const TEMPLATE_GROUPS = [
  {
    category: "Arrays & Hashing",
    patterns: ["Hash Map", "Bucket Sort", "Prefix/Suffix", "Design"],
    templates: [
      {
        name: "A) Hash Lookup (set / dict)",
        code: `seen = set()
for x in data:
    if need_match(x, seen):   # e.g., (target-x) in seen
        return build_answer(x)
    seen.add(x)`,
      },
      {
        name: "B) Frequency Map",
        code: `from collections import defaultdict
freq = defaultdict(int)

for x in data:
    freq[key(x)] += 1

# use freq[...] for decisions`,
      },
      {
        name: "C) Prefix Sum + Hashmap (count flavor)",
        code: `prefix = 0
count = 0
seen = {0: 1}  # prefix_sum -> how many times seen

for x in nums:
    prefix += x
    count += seen.get(prefix - target, 0)
    seen[prefix] = seen.get(prefix, 0) + 1
return count`,
      },
      {
        name: "C) Prefix Sum + Hashmap (first-index flavor)",
        code: `prefix = 0
first = {0: -1}  # prefix_sum -> earliest index
best = 0

for i, x in enumerate(nums):
    prefix += x
    if (prefix - target) in first:
        best = max(best, i - first[prefix - target])
    if prefix not in first:
        first[prefix] = i
return best`,
      },
    ],
  },
  {
    category: "Two Pointers",
    patterns: ["Two Pointers"],
    templates: [
      {
        name: "A) Opposite Ends (often after sorting)",
        code: `l, r = 0, len(arr) - 1
while l < r:
    if good(arr[l], arr[r]):
        update_answer(l, r)
        l += 1
        r -= 1
    elif need_bigger():
        l += 1
    else:
        r -= 1`,
      },
      {
        name: "B) Fast/Slow (in-place rewrite / partition)",
        code: `slow = 0
for fast in range(len(arr)):
    if keep(arr[fast]):
        arr[slow] = arr[fast]
        slow += 1
# result is arr[:slow]`,
      },
    ],
  },
  {
    category: "Sliding Window",
    patterns: ["Sliding Window"],
    templates: [
      {
        name: "A) Fixed-size Window (size = k)",
        code: `l = 0
state = init()
for r in range(len(s)):
    add(s[r], state)
    if r - l + 1 > k:
        remove(s[l], state)
        l += 1
    if r - l + 1 == k:
        ans = best(ans, state)
return ans`,
      },
      {
        name: "B) Variable-size Window (expand r, shrink l)",
        code: `l = 0
state = init()
for r in range(len(s)):
    add(s[r], state)

    while window_invalid(state):
        remove(s[l], state)
        l += 1

    ans = best(ans, l, r, state)
return ans`,
      },
      {
        name: 'C) "At Most K" Trick',
        code: `# Many "exactly K" = atMost(K) - atMost(K-1)
def at_most(K):
    l = 0
    state = init()
    total = 0
    for r in range(len(s)):
        add(s[r], state)
        while bad(state, K):
            remove(s[l], state)
            l += 1
        total += (r - l + 1)
    return total`,
      },
    ],
  },
  {
    category: "Stack",
    patterns: ["Stack", "Monotonic Stack"],
    templates: [
      {
        name: "A) Matching Stack (pairs)",
        code: `stack = []
match = {')':'(', ']':'[', '}':'{'}

for ch in s:
    if ch in match:  # closing
        if not stack or stack[-1] != match[ch]:
            return False
        stack.pop()
    else:
        stack.append(ch)

return len(stack) == 0`,
      },
      {
        name: "B) Monotonic Stack (next greater / bounds / areas)",
        code: `stack = []  # stores indices; maintain monotonic property
for i, x in enumerate(arr):
    while stack and violates_monotonic(arr[stack[-1]], x):
        j = stack.pop()
        use(j, i)   # j resolved by i
    stack.append(i)

# optionally flush remaining stack`,
      },
    ],
  },
  {
    category: "Binary Search",
    patterns: ["Binary Search"],
    templates: [
      {
        name: "A) Standard Exact Search",
        code: `l, r = 0, n - 1
while l <= r:
    m = (l + r) // 2
    if arr[m] == target: return m
    if arr[m] < target: l = m + 1
    else: r = m - 1
return -1`,
      },
      {
        name: "B) Lower Bound (first index where predicate true)",
        code: `l, r = 0, n  # r is exclusive
while l < r:
    m = (l + r) // 2
    if predicate(arr[m]):   # true on the right side
        r = m
    else:
        l = m + 1
return l  # first true`,
      },
      {
        name: "C) Binary Search on the Answer",
        code: `lo, hi = min_possible, max_possible
while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid):
        hi = mid
    else:
        lo = mid + 1
return lo`,
      },
    ],
  },
  {
    category: "Linked List",
    patterns: ["Linked List", "Fast & Slow Pointers"],
    templates: [
      {
        name: "A) Dummy Head (clean edge cases)",
        code: `dummy = ListNode(0, head)
prev = dummy
cur = head

while cur:
    if should_delete(cur):
        prev.next = cur.next
    else:
        prev = cur
    cur = cur.next

return dummy.next`,
      },
      {
        name: "B) Reverse (iterative)",
        code: `prev = None
cur = head
while cur:
    nxt = cur.next
    cur.next = prev
    prev = cur
    cur = nxt
return prev`,
      },
      {
        name: "C) Fast/Slow (middle / cycle detect)",
        code: `slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
# slow is middle (variant depends on loop)`,
      },
    ],
  },
  {
    category: "Trees",
    patterns: ["DFS", "BFS", "BFS / DFS", "DFS (Inorder)", "DFS + Hash Map"],
    templates: [
      {
        name: "A) DFS Recursion",
        code: `def dfs(node):
    if not node:
        return base_value

    left = dfs(node.left)
    right = dfs(node.right)

    return combine(node, left, right)`,
      },
      {
        name: "B) DFS Iterative",
        code: `stack = [(root, state0)]
while stack:
    node, st = stack.pop()
    if not node:
        continue
    # push children and/or process
    # depending on traversal order`,
      },
      {
        name: "C) BFS Level-order",
        code: `from collections import deque
q = deque([root])
while q:
    level = []
    for _ in range(len(q)):
        node = q.popleft()
        level.append(node.val)
        if node.left: q.append(node.left)
        if node.right: q.append(node.right)
    use_level(level)`,
      },
      {
        name: "D) Validate BST (range invariant)",
        code: `def ok(node, lo, hi):
    if not node: return True
    if not (lo < node.val < hi): return False
    return ok(node.left, lo, node.val) and \\
           ok(node.right, node.val, hi)`,
      },
    ],
  },
  {
    category: "Heap / Priority Queue",
    patterns: ["Heap / Divide & Conquer", "Two Heaps", "Heap / Sorting"],
    templates: [
      {
        name: "A) Top-K via Min-Heap",
        code: `import heapq
heap = []
for item, score in items:
    heapq.heappush(heap, (score, item))
    if len(heap) > K:
        heapq.heappop(heap)
return [item for score, item in heap]`,
      },
      {
        name: "B) Merge K Sorted Lists",
        code: `heap = []
for i, node in enumerate(lists):
    if node:
        heappush(heap, (node.val, i, node))

dummy = ListNode()
tail = dummy
while heap:
    val, i, node = heappop(heap)
    tail.next = node
    tail = tail.next
    if node.next:
        heappush(heap, (node.next.val, i, node.next))
tail.next = None
return dummy.next`,
      },
      {
        name: "C) Median Stream (two heaps)",
        code: `low = []   # max-heap via negatives
high = []  # min-heap

def add(x):
    heappush(low, -x)
    heappush(high, -heappop(low))
    if len(high) > len(low):
        heappush(low, -heappop(high))

def median():
    if len(low) > len(high): return -low[0]
    return (-low[0] + high[0]) / 2`,
      },
    ],
  },
  {
    category: "Backtracking",
    patterns: ["Backtracking", "Trie + Backtracking"],
    templates: [
      {
        name: "Choose  Recurse  Unchoose",
        code: `ans = []
path = []

def backtrack(start, state):
    if done(state):
        ans.append(path[:])
        return

    for choice in choices_from(start, state):
        if not allowed(choice, state):
            continue
        apply(choice, state)
        path.append(choice)

        backtrack(next_start(choice), state)

        path.pop()
        undo(choice, state)

backtrack(0, init_state())
return ans`,
      },
    ],
  },
  {
    category: "Tries",
    patterns: ["Trie"],
    templates: [
      {
        name: "A) Trie Skeleton",
        code: `class Node:
    def __init__(self):
        self.children = {}
        self.end = False

root = Node()

def insert(word):
    cur = root
    for ch in word:
        cur = cur.children.setdefault(ch, Node())
    cur.end = True

def starts_with(prefix):
    cur = root
    for ch in prefix:
        if ch not in cur.children: return False
        cur = cur.children[ch]
    return True`,
      },
      {
        name: "B) Wildcard Search ('.' matches any)",
        code: `def search(word, node=root, i=0):
    if i == len(word): return node.end
    ch = word[i]
    if ch == '.':
        return any(search(word, nxt, i+1)
                    for nxt in node.children.values())
    if ch not in node.children: return False
    return search(word, node.children[ch], i+1)`,
      },
    ],
  },
  {
    category: "Graphs",
    patterns: ["DFS / BFS", "Topological Sort", "Union Find / DFS"],
    templates: [
      {
        name: "A) DFS/BFS Adjacency List",
        code: `graph = build_adj()
seen = set()

def dfs(u):
    seen.add(u)
    for v in graph[u]:
        if v not in seen:
            dfs(v)

for node in graph:
    if node not in seen:
        dfs(node)`,
      },
      {
        name: "B) Grid DFS (flood fill)",
        code: `ROWS, COLS = len(grid), len(grid[0])
seen = set()

def dfs(r, c):
    if (r,c) in seen or out_of_bounds(r,c) or bad_cell(r,c):
        return
    seen.add((r,c))
    for dr, dc in dirs:
        dfs(r+dr, c+dc)

for r in range(ROWS):
    for c in range(COLS):
        if is_new_component(r, c):
            dfs(r, c)
            count += 1`,
      },
      {
        name: "C) Topological Sort (Kahn's)",
        code: `from collections import deque, defaultdict
indeg = defaultdict(int)
adj = defaultdict(list)

for a, b in edges:     # b -> a
    adj[b].append(a)
    indeg[a] += 1

q = deque([v for v in nodes if indeg[v] == 0])
order = []

while q:
    u = q.popleft()
    order.append(u)
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)

return len(order) == len(nodes)  # feasible?`,
      },
      {
        name: "D) Union-Find (DSU)",
        code: `parent = {x: x for x in nodes}
rank = {x: 0 for x in nodes}

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb: return False
    if rank[ra] < rank[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    if rank[ra] == rank[rb]:
        rank[ra] += 1
    return True`,
      },
      {
        name: "E) Dijkstra (min-heap)",
        code: `import heapq
dist = {src: 0}
pq = [(0, src)]

while pq:
    d, u = heapq.heappop(pq)
    if d != dist.get(u, float('inf')):
        continue
    if u == target:
        return d
    for v, w in graph[u]:
        nd = d + w
        if nd < dist.get(v, float('inf')):
            dist[v] = nd
            heapq.heappush(pq, (nd, v))

return dist.get(target, INF)`,
      },
    ],
  },
  {
    category: "Dynamic Programming",
    patterns: ["Dynamic Programming"],
    templates: [
      {
        name: "A) Bottom-up dp[i]",
        code: `dp = [0] * (n + 1)
dp[0] = base0
dp[1] = base1

for i in range(2, n + 1):
    dp[i] = transition(dp, i)  # e.g., dp[i-1] + dp[i-2]
return dp[n]`,
      },
      {
        name: "B) Rolling Variables (O(1) space)",
        code: `a, b = base0, base1
for i in range(2, n + 1):
    a, b = b, f(a, b, i)
return b`,
      },
      {
        name: "C) Top-down Memo",
        code: `memo = {}
def solve(i):
    if i in memo: return memo[i]
    if base(i): return base_value
    memo[i] = min_or_max(solve(i-1), solve(i-2), ...)
    return memo[i]`,
      },
      {
        name: "D) 2-D DP (grid / strings)",
        code: `dp = [[0]*(C+1) for _ in range(R+1)]

for r in range(1, R+1):
    for c in range(1, C+1):
        dp[r][c] = transition(dp, r, c)
return dp[R][C]
# For string DP, r and c are indices in the two strings.`,
      },
    ],
  },
  {
    category: "Greedy",
    patterns: ["Greedy", "Kadane's Algorithm"],
    templates: [
      {
        name: 'A) "Farthest Reach So Far"',
        code: `far = 0
for i, x in enumerate(nums):
    if i > far: return False
    far = max(far, i + x)
return True`,
      },
      {
        name: "B) Greedy After Sorting",
        code: `arr.sort(key=key_fn)
cur = init
for item in arr:
    if can_take(item, cur):
        take(item, cur)
return result`,
      },
      {
        name: "Kadane's Algorithm (max subarray)",
        code: `cur = best = nums[0]
for x in nums[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)
return best`,
      },
    ],
  },
  {
    category: "Intervals",
    patterns: ["Intervals", "Sorting"],
    templates: [
      {
        name: "A) Merge Intervals",
        code: `intervals.sort(key=lambda x: x[0])
res = []

for s, e in intervals:
    if not res or s > res[-1][1]:
        res.append([s, e])
    else:
        res[-1][1] = max(res[-1][1], e)
return res`,
      },
      {
        name: "B) Non-overlapping (count removals  sort by end)",
        code: `intervals.sort(key=lambda x: x[1])
keep_end = -inf
removed = 0

for s, e in intervals:
    if s >= keep_end:
        keep_end = e
    else:
        removed += 1
return removed`,
      },
    ],
  },
  {
    category: "Bit Manipulation",
    patterns: ["Bit Manipulation"],
    templates: [
      {
        name: "A) Popcount with n & (n-1)",
        code: `count = 0
while n:
    n &= (n - 1)
    count += 1
return count`,
      },
      {
        name: 'B) XOR "Cancel Out Pairs"',
        code: `x = 0
for v in nums:
    x ^= v
return x`,
      },
      {
        name: "C) Build DP Bits",
        code: `dp = [0]*(n+1)
for i in range(1, n+1):
    dp[i] = dp[i >> 1] + (i & 1)
return dp`,
      },
    ],
  },
  {
    category: "Math & Geometry",
    patterns: ["Matrix"],
    templates: [
      {
        name: "A) Spiral Traversal (bounds shrink)",
        code: `top, bot = 0, R-1
left, right = 0, C-1
ans = []

while top <= bot and left <= right:
    for c in range(left, right+1):
        ans.append(mat[top][c])
    top += 1
    for r in range(top, bot+1):
        ans.append(mat[r][right])
    right -= 1
    if top <= bot:
        for c in range(right, left-1, -1):
            ans.append(mat[bot][c])
        bot -= 1
    if left <= right:
        for r in range(bot, top-1, -1):
            ans.append(mat[r][left])
        left += 1
return ans`,
      },
      {
        name: "B) In-place Rotate (layer swap)",
        code: `n = len(mat)
for layer in range(n // 2):
    first, last = layer, n - 1 - layer
    for i in range(first, last):
        offset = i - first
        top = mat[first][i]
        mat[first][i] = mat[last-offset][first]
        mat[last-offset][first] = mat[last][last-offset]
        mat[last][last-offset] = mat[i][last]
        mat[i][last] = top`,
      },
    ],
  },
];

// Build lookup: pattern -> templates
const PATTERN_TO_TEMPLATES = {};
TEMPLATE_GROUPS.forEach((g) => {
  g.patterns.forEach((p) => {
    PATTERN_TO_TEMPLATES[p] = { category: g.category, templates: g.templates };
  });
});

const QUESTIONS = [
  { id: 1, name: "Two Sum", pattern: "Hash Map", difficulty: "Easy",
    desc: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution and you may not use the same element twice." },
  { id: 2, name: "Valid Anagram", pattern: "Hash Map", difficulty: "Easy",
    desc: "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram uses all the original letters exactly once." },
  { id: 3, name: "Contains Duplicate", pattern: "Hash Map", difficulty: "Easy",
    desc: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct." },
  { id: 4, name: "Group Anagrams", pattern: "Hash Map", difficulty: "Medium",
    desc: "Given an array of strings strs, group the anagrams together. You can return the answer in any order. An anagram is a word formed by rearranging the letters of another word." },
  { id: 5, name: "Top K Frequent Elements", pattern: "Bucket Sort", difficulty: "Medium",
    desc: "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order. Your algorithm must be better than O(n log n)." },
  { id: 6, name: "Product of Array Except Self", pattern: "Prefix/Suffix", difficulty: "Medium",
    desc: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must solve it in O(n) time without using the division operation." },
  { id: 7, name: "Encode and Decode Strings", pattern: "Design", difficulty: "Medium",
    desc: "Design an algorithm to encode a list of strings to a single string. The encoded string is then decoded back to the original list of strings. Implement encode and decode methods." },
  { id: 8, name: "Longest Consecutive Sequence", pattern: "Hash Map", difficulty: "Medium",
    desc: "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time." },
  { id: 9, name: "Valid Palindrome", pattern: "Two Pointers", difficulty: "Easy",
    desc: "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome." },
  { id: 10, name: "3Sum", pattern: "Two Pointers", difficulty: "Medium",
    desc: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j != k and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets." },
  { id: 11, name: "Container With Most Water", pattern: "Two Pointers", difficulty: "Medium",
    desc: "Given n non-negative integers a1, a2, ..., an where each represents a point at coordinate (i, ai), find two lines that together with the x-axis form a container that holds the most water." },
  { id: 12, name: "Trapping Rain Water", pattern: "Two Pointers", difficulty: "Hard",
    desc: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining." },
  { id: 13, name: "Best Time to Buy and Sell Stock", pattern: "Sliding Window", difficulty: "Easy",
    desc: "Given an array prices where prices[i] is the price of a stock on the ith day, find the maximum profit from one buy and one sell. If no profit is possible, return 0." },
  { id: 14, name: "Longest Substring Without Repeating Characters", pattern: "Sliding Window", difficulty: "Medium",
    desc: "Given a string s, find the length of the longest substring without repeating characters." },
  { id: 15, name: "Longest Repeating Character Replacement", pattern: "Sliding Window", difficulty: "Medium",
    desc: "Given a string s and an integer k, you can choose any character and change it to any other uppercase English character at most k times. Return the length of the longest substring containing the same letter after performing at most k operations." },
  { id: 16, name: "Minimum Window Substring", pattern: "Sliding Window", difficulty: "Hard",
    desc: "Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If no such substring exists, return the empty string." },
  { id: 17, name: "Valid Parentheses", pattern: "Stack", difficulty: "Easy",
    desc: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Brackets must close in the correct order and each close bracket must match an open bracket of the same type." },
  { id: 18, name: "Daily Temperatures", pattern: "Monotonic Stack", difficulty: "Medium",
    desc: "Given an array of integers temperatures representing daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day, set answer[i] = 0." },
  { id: 19, name: "Car Fleet", pattern: "Monotonic Stack", difficulty: "Medium",
    desc: "There are n cars going to the same destination along a one-lane road. Each car has a position and speed. A car fleet is cars that drive at the same speed when they catch up. Return the number of car fleets that will arrive at the destination." },
  { id: 20, name: "Largest Rectangle in Histogram", pattern: "Monotonic Stack", difficulty: "Hard",
    desc: "Given an array of integers heights representing the histogram's bar heights where the width of each bar is 1, return the area of the largest rectangle in the histogram." },
  { id: 21, name: "Binary Search", pattern: "Binary Search", difficulty: "Easy",
    desc: "Given a sorted array of integers nums and an integer target, return the index of target if it is found. If not, return -1. You must write an algorithm with O(log n) runtime complexity." },
  { id: 22, name: "Search a 2D Matrix", pattern: "Binary Search", difficulty: "Medium",
    desc: "Given an m x n matrix where each row is sorted in ascending order and the first integer of each row is greater than the last integer of the previous row, determine if a target integer exists in the matrix." },
  { id: 23, name: "Koko Eating Bananas", pattern: "Binary Search", difficulty: "Medium",
    desc: "Koko has n piles of bananas and h hours to eat them all. She can eat at speed k bananas/hour per pile. Find the minimum integer k such that she can eat all bananas within h hours." },
  { id: 24, name: "Find Minimum in Rotated Sorted Array", pattern: "Binary Search", difficulty: "Medium",
    desc: "Given a sorted array of unique elements that has been rotated between 1 and n times, find the minimum element. You must write an algorithm that runs in O(log n) time." },
  { id: 25, name: "Search in Rotated Sorted Array", pattern: "Binary Search", difficulty: "Medium",
    desc: "Given an integer array nums sorted in ascending order (with distinct values) that is possibly rotated, and an integer target, return its index or -1 if not found. You must achieve O(log n) time." },
  { id: 26, name: "Median of Two Sorted Arrays", pattern: "Binary Search", difficulty: "Hard",
    desc: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n))." },
  { id: 27, name: "Reverse Linked List", pattern: "Linked List", difficulty: "Easy",
    desc: "Given the head of a singly linked list, reverse the list, and return the reversed list." },
  { id: 28, name: "Merge Two Sorted Lists", pattern: "Linked List", difficulty: "Easy",
    desc: "Merge two sorted linked lists and return it as one sorted list. The list should be made by splicing together the nodes of the first two lists." },
  { id: 29, name: "Linked List Cycle", pattern: "Fast & Slow Pointers", difficulty: "Easy",
    desc: "Given head, the head of a linked list, determine if the linked list has a cycle in it. A cycle exists if some node can be reached again by continuously following the next pointer." },
  { id: 30, name: "Reorder List", pattern: "Fast & Slow Pointers", difficulty: "Medium",
    desc: "Given the head of a singly linked list L0 -> L1 -> ... -> Ln, reorder it to L0 -> Ln -> L1 -> Ln-1 -> L2 -> Ln-2 -> ... You may not modify the values in the nodes, only the nodes themselves may be changed." },
  { id: 31, name: "Remove Nth Node From End of List", pattern: "Two Pointers", difficulty: "Medium",
    desc: "Given the head of a linked list, remove the nth node from the end of the list and return its head." },
  { id: 32, name: "Merge K Sorted Lists", pattern: "Heap / Divide & Conquer", difficulty: "Hard",
    desc: "Given an array of k linked-lists, each sorted in ascending order, merge all the linked-lists into one sorted linked-list and return it." },
  { id: 33, name: "Invert Binary Tree", pattern: "DFS", difficulty: "Easy",
    desc: "Given the root of a binary tree, invert the tree (mirror it), and return its root." },
  { id: 34, name: "Maximum Depth of Binary Tree", pattern: "DFS", difficulty: "Easy",
    desc: "Given the root of a binary tree, return its maximum depth. A tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node." },
  { id: 35, name: "Same Tree", pattern: "DFS", difficulty: "Easy",
    desc: "Given the roots of two binary trees p and q, check if they are the same or not. Two binary trees are the same if they are structurally identical and the nodes have the same value." },
  { id: 36, name: "Subtree of Another Tree", pattern: "DFS", difficulty: "Easy",
    desc: "Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values as subRoot." },
  { id: 37, name: "Lowest Common Ancestor of a BST", pattern: "DFS", difficulty: "Medium",
    desc: "Given a binary search tree (BST) and two nodes p and q, find the lowest common ancestor (LCA). The LCA is the lowest node that has both p and q as descendants (a node can be a descendant of itself)." },
  { id: 38, name: "Binary Tree Level Order Traversal", pattern: "BFS", difficulty: "Medium",
    desc: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level)." },
  { id: 39, name: "Validate Binary Search Tree", pattern: "DFS", difficulty: "Medium",
    desc: "Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST has left subtree values less than the node and right subtree values greater than the node." },
  { id: 40, name: "Kth Smallest Element in a BST", pattern: "DFS (Inorder)", difficulty: "Medium",
    desc: "Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree." },
  { id: 41, name: "Construct Binary Tree from Preorder and Inorder", pattern: "DFS", difficulty: "Medium",
    desc: "Given two integer arrays preorder and inorder where preorder is the preorder traversal and inorder is the inorder traversal of the same tree, construct and return the binary tree." },
  { id: 42, name: "Binary Tree Maximum Path Sum", pattern: "DFS", difficulty: "Hard",
    desc: "Given the root of a binary tree, return the maximum path sum of any non-empty path. A path is a sequence of nodes where each pair of adjacent nodes has an edge. A node can only appear at most once in the path." },
  { id: 43, name: "Serialize and Deserialize Binary Tree", pattern: "BFS / DFS", difficulty: "Hard",
    desc: "Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure. There is no restriction on how your serialization/deserialization algorithm should work." },
  { id: 44, name: "Implement Trie (Prefix Tree)", pattern: "Trie", difficulty: "Medium",
    desc: "Implement a Trie class with insert(word), search(word) which returns true if the word is in the trie, and startsWith(prefix) which returns true if any previously inserted word has the given prefix." },
  { id: 45, name: "Word Search II", pattern: "Trie + Backtracking", difficulty: "Hard",
    desc: "Given an m x n board of characters and a list of words, return all words that can be formed by sequentially adjacent cells (horizontally or vertically neighboring). The same cell may not be used more than once in a word." },
  { id: 46, name: "Find Median from Data Stream", pattern: "Two Heaps", difficulty: "Hard",
    desc: "Design a data structure that supports addNum(num) to add an integer and findMedian() to return the median of all elements so far. If the count is even, return the average of the two middle values." },
  { id: 47, name: "Combination Sum", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given an array of distinct integers candidates and a target integer, return all unique combinations of candidates where the chosen numbers sum to target. The same number may be chosen an unlimited number of times." },
  { id: 48, name: "Word Search", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given an m x n grid of characters and a string word, return true if word exists in the grid. The word can be constructed from sequentially adjacent cells (horizontal or vertical). Each cell may be used only once." },
  { id: 49, name: "Subsets", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order." },
  { id: 50, name: "Permutations", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order." },
  { id: 51, name: "Palindrome Partitioning", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitionings of s." },
  { id: 52, name: "Letter Combinations of a Phone Number", pattern: "Backtracking", difficulty: "Medium",
    desc: "Given a string containing digits from 2-9, return all possible letter combinations that the number could represent (like on a phone keypad). Return the answer in any order." },
  { id: 53, name: "N-Queens", pattern: "Backtracking", difficulty: "Hard",
    desc: "Place n queens on an n x n chessboard such that no two queens attack each other. Return all distinct solutions where each solution contains the board configuration with 'Q' and '.' indicating a queen and empty space." },
  { id: 54, name: "Number of Islands", pattern: "DFS / BFS", difficulty: "Medium",
    desc: "Given an m x n 2D grid of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically." },
  { id: 55, name: "Clone Graph", pattern: "DFS + Hash Map", difficulty: "Medium",
    desc: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value and a list of its neighbors." },
  { id: 56, name: "Pacific Atlantic Water Flow", pattern: "DFS / BFS", difficulty: "Medium",
    desc: "Given an m x n matrix of heights, find all cells where water can flow to both the Pacific (top/left edges) and Atlantic (bottom/right edges) oceans. Water can flow from a cell to an adjacent cell with equal or lower height." },
  { id: 57, name: "Course Schedule", pattern: "Topological Sort", difficulty: "Medium",
    desc: "There are numCourses courses with prerequisite pairs. Determine if it is possible to finish all courses. (Detect if there is a cycle in a directed graph.)" },
  { id: 58, name: "Course Schedule II", pattern: "Topological Sort", difficulty: "Medium",
    desc: "There are numCourses courses with prerequisites. Return the ordering of courses you should take to finish all courses. If impossible, return an empty array. (Return a valid topological order.)" },
  { id: 59, name: "Graph Valid Tree", pattern: "Union Find / DFS", difficulty: "Medium",
    desc: "Given n nodes labeled from 0 to n-1 and a list of undirected edges, determine if these edges make up a valid tree. A valid tree is a connected acyclic graph." },
  { id: 60, name: "Number of Connected Components", pattern: "Union Find / DFS", difficulty: "Medium",
    desc: "Given n nodes labeled from 0 to n-1 and a list of undirected edges, find the number of connected components in the graph." },
  { id: 61, name: "Alien Dictionary", pattern: "Topological Sort", difficulty: "Hard",
    desc: "Given a sorted list of words from an alien language, derive the order of characters in the alien alphabet. If the order is invalid or ambiguous, return an appropriate result." },
  { id: 62, name: "Climbing Stairs", pattern: "Dynamic Programming", difficulty: "Easy",
    desc: "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?" },
  { id: 63, name: "House Robber", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given an integer array nums representing money at each house along a street, return the maximum amount you can rob without robbing two adjacent houses." },
  { id: 64, name: "House Robber II", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Same as House Robber, but the houses are arranged in a circle, meaning the first and last houses are adjacent." },
  { id: 65, name: "Longest Palindromic Substring", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given a string s, return the longest palindromic substring in s." },
  { id: 66, name: "Palindromic Substrings", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given a string s, return the number of palindromic substrings in it. A substring is palindromic if it reads the same backward as forward." },
  { id: 67, name: "Decode Ways", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "A message containing letters A-Z can be encoded as '1' to '26'. Given a string s containing only digits, return the number of ways to decode it." },
  { id: 68, name: "Coin Change", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given an integer array coins of different denominations and an integer amount, return the fewest number of coins needed to make up that amount. If it cannot be made, return -1." },
  { id: 69, name: "Maximum Product Subarray", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given an integer array nums, find a contiguous non-empty subarray that has the largest product, and return the product." },
  { id: 70, name: "Word Break", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words." },
  { id: 71, name: "Longest Increasing Subsequence", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "Given an integer array nums, return the length of the longest strictly increasing subsequence." },
  { id: 72, name: "Unique Paths", pattern: "Dynamic Programming", difficulty: "Medium",
    desc: "A robot is at the top-left corner of an m x n grid. It can only move down or right. How many unique paths are there to reach the bottom-right corner?" },
  { id: 73, name: "Jump Game", pattern: "Greedy", difficulty: "Medium",
    desc: "Given an integer array nums where each element represents the maximum jump length from that position, determine if you can reach the last index starting from the first index." },
  { id: 74, name: "Insert Interval", pattern: "Intervals", difficulty: "Medium",
    desc: "Given a set of non-overlapping intervals sorted by start time and a new interval, insert the new interval and merge if necessary. Return the result sorted and non-overlapping." },
  { id: 75, name: "Merge Intervals", pattern: "Intervals", difficulty: "Medium",
    desc: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals and return an array of the non-overlapping intervals." },
  { id: 76, name: "Non-overlapping Intervals", pattern: "Greedy", difficulty: "Medium",
    desc: "Given an array of intervals, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping." },
  { id: 77, name: "Meeting Rooms", pattern: "Sorting", difficulty: "Easy",
    desc: "Given an array of meeting time intervals consisting of start and end times, determine if a person could attend all meetings (i.e., no two meetings overlap)." },
  { id: 78, name: "Meeting Rooms II", pattern: "Heap / Sorting", difficulty: "Medium",
    desc: "Given an array of meeting time intervals, find the minimum number of conference rooms required to hold all meetings." },
  { id: 79, name: "Maximum Subarray", pattern: "Kadane's Algorithm", difficulty: "Medium",
    desc: "Given an integer array nums, find the subarray with the largest sum, and return its sum." },
  { id: 80, name: "Number of 1 Bits", pattern: "Bit Manipulation", difficulty: "Easy",
    desc: "Write a function that takes the binary representation of a positive integer and returns the number of set bits (1s) it has (also known as the Hamming weight)." },
  { id: 81, name: "Counting Bits", pattern: "Bit Manipulation", difficulty: "Easy",
    desc: "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i." },
  { id: 82, name: "Reverse Bits", pattern: "Bit Manipulation", difficulty: "Easy",
    desc: "Reverse the bits of a given 32-bit unsigned integer." },
  { id: 83, name: "Missing Number", pattern: "Bit Manipulation", difficulty: "Easy",
    desc: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array." },
  { id: 84, name: "Sum of Two Integers", pattern: "Bit Manipulation", difficulty: "Medium",
    desc: "Given two integers a and b, return the sum of the two integers without using the + and - operators." },
  { id: 85, name: "Rotate Image", pattern: "Matrix", difficulty: "Medium",
    desc: "Given an n x n 2D matrix representing an image, rotate the image by 90 degrees clockwise. You must rotate it in-place." },
  { id: 86, name: "Spiral Matrix", pattern: "Matrix", difficulty: "Medium",
    desc: "Given an m x n matrix, return all elements of the matrix in spiral order." },
  { id: 87, name: "Set Matrix Zeroes", pattern: "Matrix", difficulty: "Medium",
    desc: "Given an m x n integer matrix, if an element is 0, set its entire row and column to 0. You must do it in place." },
];

const ALL_PATTERNS = [...new Set(QUESTIONS.map((q) => q.pattern))].sort();

const PATTERN_COLORS = {
  "Hash Map": "#e06c75", "Bucket Sort": "#e06c75", "Prefix/Suffix": "#e06c75",
  Design: "#c678dd", "Two Pointers": "#61afef", "Sliding Window": "#56b6c2",
  Stack: "#d19a66", "Monotonic Stack": "#d19a66", "Binary Search": "#98c379",
  "Linked List": "#c678dd", "Fast & Slow Pointers": "#c678dd",
  "Heap / Divide & Conquer": "#e5c07b", DFS: "#61afef", BFS: "#56b6c2",
  "BFS / DFS": "#56b6c2", "DFS / BFS": "#56b6c2", "DFS (Inorder)": "#61afef",
  "DFS + Hash Map": "#61afef", Trie: "#c678dd", "Trie + Backtracking": "#c678dd",
  "Two Heaps": "#e5c07b", Backtracking: "#e06c75", "Topological Sort": "#98c379",
  "Union Find / DFS": "#98c379", "Dynamic Programming": "#c678dd",
  Greedy: "#e5c07b", Intervals: "#d19a66", Sorting: "#d19a66",
  "Heap / Sorting": "#e5c07b", "Kadane's Algorithm": "#e5c07b",
  "Bit Manipulation": "#56b6c2", Matrix: "#61afef",
};

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function genChoices(correct, all) {
  return shuffle([correct, ...shuffle(all.filter((p) => p !== correct)).slice(0, 3)]);
}

const DEFAULT_STATS = { gamesPlayed: 0, totalCorrect: 0, totalAnswered: 0, bestStreak: 0 };

function getStorageAdapter() {
  if (typeof window === "undefined") {
    return {
      get: async () => ({ value: null }),
      set: async () => {},
    };
  }

  const w = window;
  if (w.storage && typeof w.storage.get === "function" && typeof w.storage.set === "function") {
    return w.storage;
  }

  // Fallback for normal web deployments.
  return {
    get: async (key) => ({ value: w.localStorage.getItem(key) }),
    set: async (key, value) => {
      w.localStorage.setItem(key, value);
    },
  };
}

async function loadData() {
  const storage = getStorageAdapter();
  let stats = { ...DEFAULT_STATS },
    history = {};
  try {
    const r = await storage.get("lc-pattern-data");
    if (r && r.value) {
      const p = JSON.parse(r.value);
      stats = p.stats || stats;
      history = p.history || history;
    }
  } catch (e) {}
  return { stats, history };
}
async function saveData(s, h) {
  const storage = getStorageAdapter();
  try {
    await storage.set("lc-pattern-data", JSON.stringify({ stats: s, history: h }));
  } catch (e) {}
}

// CODE BLOCK COMPONENT
function CodeBlock({ code }) {
  return (
    <pre style={S.codeBlock}>
      <code>{code}</code>
    </pre>
  );
}

// TEMPLATE VIEWER
function TemplateViewer({ pattern, compact, open: openProp, onOpenChange }) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [showUniversal, setShowUniversal] = useState(false);
  const info = PATTERN_TO_TEMPLATES[pattern];
  if (!info) return null;

  if (compact) {
    return (
      <div style={{ marginTop: 6 }}>
        <button className="hover-row" onClick={() => setOpen(!open)} style={S.templateToggle}>
          {open ? "" : ""} {info.category} templates
          <span style={S.templateCount}>{info.templates.length}</span>
        </button>
        {open && (
          <div style={{ ...S.templatePanel, animation: "descReveal 0.25s ease-out" }}>
            {info.templates.map((t, i) => (
              <div key={i} style={S.templateItem}>
                <div style={S.templateName}>{t.name}</div>
                <CodeBlock code={t.code} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.templateSection}>
      <button className="hover-row" onClick={() => setOpen(!open)} style={S.templateToggleLg}>
        {open ? "" : ""} view template: {info.category}
        <span style={S.descHotkey}>T</span>
      </button>
      {open && (
        <div style={{ ...S.templatePanelLg, animation: "descReveal 0.25s ease-out" }}>
          <button
            className="hover-row"
            onClick={() => setShowUniversal(!showUniversal)}
            style={{ ...S.templateToggle, marginBottom: 8, color: "#565f89" }}
          >
            {showUniversal ? "" : ""} universal skeleton
          </button>
          {showUniversal && <CodeBlock code={UNIVERSAL_TEMPLATE.code} />}
          {info.templates.map((t, i) => (
            <div key={i} style={S.templateItem}>
              <div style={S.templateName}>{t.name}</div>
              <CodeBlock code={t.code} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccuracyDot({ qId, history }) {
  const h = history[qId];
  if (!h || (h.correct === 0 && h.wrong === 0)) return null;
  const total = h.correct + h.wrong,
    pct = Math.round((h.correct / total) * 100);
  const color = pct >= 80 ? "#98c379" : pct >= 50 ? "#e5c07b" : "#e06c75";
  return (
    <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0, marginLeft: 4 }}>
      {pct}%<span style={{ color: "#3b3d52", fontSize: 9 }}> ({total})</span>
    </span>
  );
}

const DIFF_COLORS = { Easy: "#98c379", Medium: "#e5c07b", Hard: "#e06c75" };
const MODES = { MENU: "menu", PLAY: "play", RESULTS: "results", BROWSE: "browse", TEMPLATES: "templates" };

export default function App() {
  const [mode, setMode] = useState(MODES.MENU);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [showNext, setShowNext] = useState(false);
  const [browseFilter, setBrowseFilter] = useState("All");
  const [showDesc, setShowDesc] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [history, setHistory] = useState({});
  const historyRef = useRef(history);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadData().then(({ stats: s, history: h }) => {
      setStats(s);
      setHistory(h);
      historyRef.current = h;
      setLoaded(true);
    });
  }, []);

  const currentQ = questions[currentIdx];

  const startGame = useCallback(() => {
    let pool = QUESTIONS;
    if (filterDifficulty !== "All") pool = pool.filter((q) => q.difficulty === filterDifficulty);
    const picked = shuffle(pool).slice(0, totalQuestions);
    setQuestions(picked);
    setCurrentIdx(0);
    setScore(0);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    if (picked.length > 0) setChoices(genChoices(picked[0].pattern, ALL_PATTERNS));
    setMode(MODES.PLAY);
  }, [filterDifficulty, totalQuestions]);

  const handleSelect = (choice) => {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === currentQ.pattern;
    setHistory((prev) => {
      const e = prev[currentQ.id] || { correct: 0, wrong: 0 };
      const next = {
        ...prev,
        [currentQ.id]: { correct: e.correct + (correct ? 1 : 0), wrong: e.wrong + (correct ? 0 : 1) },
      };
      historyRef.current = next;
      return next;
    });
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => { const ns = s + 1; setBestStreak((b) => Math.max(b, ns)); return ns; });
    } else { setStreak(0); }
    setResults((r) => [...r, { question: currentQ, chosen: choice, correct }]);
    setShowNext(true);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalCorrect = results.filter((r) => r.correct).length;
      const ns = {
        gamesPlayed: stats.gamesPlayed + 1,
        totalCorrect: stats.totalCorrect + finalCorrect,
        totalAnswered: stats.totalAnswered + questions.length,
        bestStreak: Math.max(stats.bestStreak, bestStreak),
      };
      setStats(ns);
      saveData(ns, historyRef.current);
      setMode(MODES.RESULTS);
      setExpandedResult({});
      return;
    }
    const ni = currentIdx + 1;
    setCurrentIdx(ni);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    setChoices(genChoices(questions[ni].pattern, ALL_PATTERNS));
  };

  const resetAllData = async () => {
    const f = { ...DEFAULT_STATS };
    setStats(f);
    setHistory({});
    historyRef.current = {};
    await saveData(f, {});
    setShowResetConfirm(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (mode !== MODES.PLAY) return;
      if (showNext && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); nextQuestion(); return; }
      if (e.key === "d" || e.key === "D") { setShowDesc((p) => !p); return; }
      if (e.key === "t" || e.key === "T") { if (showNext) setShowTemplate((p) => !p); return; }
      if (!showNext && selected === null) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4 && choices[num - 1]) handleSelect(choices[num - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, showNext, selected, choices, currentIdx, questions, showTemplate]);

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const lifetimePct = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const weakSpots = QUESTIONS.filter((q) => {
    const h = history[q.id];
    if (!h) return false;
    const t = h.correct + h.wrong;
    return t >= 2 && h.correct / t < 0.6;
  }).sort((a, b) => {
    const ha = history[a.id],
      hb = history[b.id];
    return ha.correct / (ha.correct + ha.wrong) - hb.correct / (hb.correct + hb.wrong);
  });
  const masteredCount = QUESTIONS.filter((q) => {
    const h = history[q.id];
    if (!h) return false;
    const t = h.correct + h.wrong;
    return t >= 2 && h.correct / t >= 0.8;
  }).length;

  const groupedByPattern = {};
  const browseList = browseFilter === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.difficulty === browseFilter);
  browseList.forEach((q) => {
    if (!groupedByPattern[q.pattern]) groupedByPattern[q.pattern] = [];
    groupedByPattern[q.pattern].push(q);
  });

  if (!loaded) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "#565f89", fontFamily: "'JetBrains Mono',monospace", animation: "pulse 1s ease-in-out infinite" }}>
          loading...
        </span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}body{background:#1a1b26;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes barGrow{from{width:0}}
        @keyframes descReveal{from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
        .hover-row:hover{background:#24253a!important}
        pre::-webkit-scrollbar{height:4px}pre::-webkit-scrollbar-thumb{background:#3b3d52;border-radius:2px}
      `}</style>

      {/*  MENU  */}
      {mode === MODES.MENU && (
        <div style={S.menuContainer}>
          <div style={S.logo}>
            <span style={S.logoAccent}>$</span> pattern<span style={S.logoDim}>.match</span>
            <span style={S.logoCursor}></span>
          </div>
          <p style={S.subtitle}>Map Blind 75 questions to their solution patterns</p>
          {stats.gamesPlayed > 0 && (
            <div style={S.statsCard}>
              <div style={S.statsRow}>
                <div style={S.statBlock}>
                  <span style={S.statValue}>{stats.gamesPlayed}</span>
                  <span style={S.statLabel2}>games</span>
                </div>
                <div style={S.statBlock}>
                  <span style={S.statValue}>
                    {lifetimePct}
                    <span style={{ fontSize: 14, color: "#565f89" }}>%</span>
                  </span>
                  <span style={S.statLabel2}>accuracy</span>
                </div>
                <div style={S.statBlock}>
                  <span style={S.statValue}>{stats.bestStreak}</span>
                  <span style={S.statLabel2}>best streak</span>
                </div>
                <div style={S.statBlock}>
                  <span style={S.statValue}>
                    {masteredCount}
                    <span style={{ fontSize: 14, color: "#565f89" }}>/87</span>
                  </span>
                  <span style={S.statLabel2}>mastered</span>
                </div>
              </div>
              {weakSpots.length > 0 && (
                <div style={S.weakSection}>
                  <span style={S.weakLabel}>needs work</span>
                  <div style={S.weakList}>
                    {weakSpots.slice(0, 5).map((q) => {
                      const h = history[q.id];
                      const wp = Math.round((h.correct / (h.correct + h.wrong)) * 100);
                      return (
                        <span key={q.id} style={S.weakItem}>
                          <span style={{ color: "#e06c75" }}>{wp}%</span> {q.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={S.configCard}>
            <div style={S.configRow}>
              <span style={S.configLabel}>difficulty</span>
              <div style={S.pillGroup}>
                {["All", "Easy", "Medium", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDifficulty(d)}
                    style={{
                      ...S.pill,
                      ...(filterDifficulty === d ? S.pillActive : {}),
                      color: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] : undefined,
                      borderColor: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] + "60" : undefined,
                    }}
                  >
                    {d.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={S.configRow}>
              <span style={S.configLabel}>questions</span>
              <div style={S.pillGroup}>
                {[10, 20, 40, 87].map((n) => (
                  <button key={n} onClick={() => setTotalQuestions(n)} style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}>
                    {n === 87 ? "all" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={startGame} style={S.startBtn}>
            start round{" "}
          </button>
          <div style={S.menuBtnRow}>
            <button onClick={() => setMode(MODES.BROWSE)} style={S.browseBtn}>
              browse patterns
            </button>
            <button onClick={() => setMode(MODES.TEMPLATES)} style={S.browseBtn}>
              view templates
            </button>
          </div>
          {stats.gamesPlayed > 0 && (
            <div style={{ marginTop: 4 }}>
              {!showResetConfirm ? (
                <button onClick={() => setShowResetConfirm(true)} style={S.resetBtn}>
                  reset all data
                </button>
              ) : (
                <div style={S.resetConfirm}>
                  <span style={{ fontSize: 12, color: "#e06c75" }}>erase all progress?</span>
                  <button onClick={resetAllData} style={{ ...S.resetBtn, color: "#e06c75", borderColor: "#e06c7540" }}>
                    yes, reset
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} style={S.resetBtn}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/*  PLAY  */}
      {mode === MODES.PLAY && currentQ && (
        <div style={S.playContainer}>
          <div style={S.topBar}>
            <button onClick={() => setMode(MODES.MENU)} style={S.backBtn}>
              {" "}
              back
            </button>
            <div style={S.stats2}>
              <span style={S.statItem}>
                {currentIdx + 1}
                <span style={S.statDim}>/{questions.length}</span>
              </span>
              <span style={{ ...S.statItem, color: "#98c379" }}>
                {score}
                <span style={S.statDim}> correct</span>
              </span>
              {streak > 1 && (
                <span style={{ ...S.statItem, color: "#e5c07b", animation: "pulse 1s ease-in-out infinite" }}>🔥 {streak}</span>
              )}
            </div>
          </div>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressBar, width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>

          <div style={S.questionArea}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ ...S.diffBadge, color: DIFF_COLORS[currentQ.difficulty], borderColor: DIFF_COLORS[currentQ.difficulty] + "40" }}
              >
                {currentQ.difficulty}
              </span>
              <AccuracyDot qId={currentQ.id} history={history} />
            </div>
            <h2 style={S.questionName}>{currentQ.name}</h2>

            <button className="hover-row" onClick={() => setShowDesc((p) => !p)} style={S.descToggle}>
              {showDesc ? " hide description" : " show description"}
              <span style={S.descHotkey}>D</span>
            </button>

            {showDesc && <div style={{ ...S.descBox, animation: "descReveal 0.25s ease-out" }}>{currentQ.desc}</div>}

            <p style={S.questionPrompt}>What pattern solves this?</p>
          </div>

          <div style={S.choicesGrid}>
            {choices.map((c, i) => {
              let bg = "transparent",
                border = "#3b3d52",
                fg = "#a9b1d6";
              if (selected !== null) {
                if (c === currentQ.pattern) {
                  bg = "#98c37918";
                  border = "#98c379";
                  fg = "#98c379";
                } else if (c === selected) {
                  bg = "#e06c7518";
                  border = "#e06c75";
                  fg = "#e06c75";
                }
              }
              return (
                <button
                  key={c}
                  onClick={() => handleSelect(c)}
                  style={{
                    ...S.choiceBtn,
                    borderColor: border,
                    background: bg,
                    color: fg,
                    cursor: selected !== null ? "default" : "pointer",
                    animation: `fadeUp 0.2s ease-out ${i * 0.05}s both`,
                  }}
                >
                  <span style={S.choiceNum}>{i + 1}</span>
                  {c}
                </button>
              );
            })}
          </div>

          {showNext && (
            <div style={{ animation: "fadeUp 0.2s ease-out" }}>
              <div style={S.nextArea}>
                {selected === currentQ.pattern ? (
                  <span style={{ color: "#98c379", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}> correct</span>
                ) : (
                  <span style={{ color: "#e06c75", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
                    {" "}
                    answer: <span style={{ color: "#a9b1d6" }}>{currentQ.pattern}</span>
                  </span>
                )}
                <button onClick={nextQuestion} style={S.nextBtn}>
                  {currentIdx + 1 >= questions.length ? "see results" : "next"}{" "}
                </button>
              </div>
              <TemplateViewer pattern={currentQ.pattern} open={showTemplate} onOpenChange={setShowTemplate} />
            </div>
          )}
        </div>
      )}

      {/*  RESULTS  */}
      {mode === MODES.RESULTS && (
        <div style={S.resultsContainer}>
          <div style={S.resultsHeader}>
            <div style={S.logo}>
              <span style={S.logoAccent}>$</span> results<span style={S.logoCursor}></span>
            </div>
            <div style={S.scoreCircle}>
              <span style={S.scoreNum}>{pct}</span>
              <span style={S.scorePct}>%</span>
            </div>
            <p style={S.scoreSummary}>
              {score}/{questions.length} correct best streak: {bestStreak}
            </p>
            <div style={S.lifetimeBar}>
              <span style={S.lifetimeLabel}>
                lifetime: {stats.gamesPlayed} games {lifetimePct}% accuracy {stats.bestStreak} best streak
              </span>
            </div>
          </div>
          <div style={S.resultsList}>
            {results.map((r, i) => (
              <div key={i} style={{ ...S.resultRowOuter, animation: `slideIn 0.2s ease-out ${i * 0.03}s both` }}>
                <div className="hover-row" onClick={() => setExpandedResult((p) => ({ ...p, [i]: !p[i] }))} style={S.resultRow}>
                  <span style={{ ...S.resultIcon, color: r.correct ? "#98c379" : "#e06c75" }}>{r.correct ? "" : ""}</span>
                  <span style={S.resultName}>{r.question.name}</span>
                  <AccuracyDot qId={r.question.id} history={history} />
                  <span style={{ ...S.resultPattern, color: PATTERN_COLORS[r.question.pattern] || "#a9b1d6" }}>{r.question.pattern}</span>
                  {!r.correct && <span style={S.resultWrong}>(you: {r.chosen})</span>}
                  <span style={S.chevron}>{expandedResult[i] ? "" : ""}</span>
                </div>
                {expandedResult[i] && (
                  <div style={{ padding: "0 12px 12px 40px", animation: "descReveal 0.2s ease-out" }}>
                    <div style={{ fontSize: 12, lineHeight: 1.55, color: "#565f89", marginBottom: 8 }}>{r.question.desc}</div>
                    <TemplateViewer pattern={r.question.pattern} compact />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={S.resultsActions}>
            <button onClick={startGame} style={S.startBtn}>
              play again{" "}
            </button>
            <button onClick={() => setMode(MODES.MENU)} style={S.browseBtn}>
              menu
            </button>
          </div>
        </div>
      )}

      {/*  BROWSE  */}
      {mode === MODES.BROWSE && (
        <div style={S.browseContainer}>
          <div style={S.topBar}>
            <button onClick={() => setMode(MODES.MENU)} style={S.backBtn}>
              {" "}
              back
            </button>
            <div style={S.pillGroup}>
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setBrowseFilter(d)}
                  style={{ ...S.pillSmall, ...(browseFilter === d ? S.pillActive : {}), color: d !== "All" && browseFilter === d ? DIFF_COLORS[d] : undefined }}
                >
                  {d.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <h2 style={S.browseTitle}>All Patterns</h2>
          <div style={S.browseGrid}>
            {Object.entries(groupedByPattern)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([pattern, qs]) => (
                <div key={pattern} style={S.patternCard}>
                  <div style={S.patternHeader}>
                    <span style={{ ...S.patternDot, background: PATTERN_COLORS[pattern] || "#a9b1d6" }} />
                    <span style={{ ...S.patternName, color: PATTERN_COLORS[pattern] || "#a9b1d6" }}>{pattern}</span>
                    <span style={S.patternCount}>{qs.length}</span>
                  </div>
                  {qs.map((q) => (
                    <div key={q.id}>
                      <div className="hover-row" onClick={() => setExpandedBrowse((p) => ({ ...p, [q.id]: !p[q.id] }))} style={S.patternQ}>
                        <span style={{ ...S.patternQDiff, color: DIFF_COLORS[q.difficulty] }}></span>
                        <span style={{ flex: 1 }}>{q.name}</span>
                        <AccuracyDot qId={q.id} history={history} />
                        <span style={S.chevron}>{expandedBrowse[q.id] ? "" : ""}</span>
                      </div>
                      {expandedBrowse[q.id] && <div style={{ ...S.browseDescBox, animation: "descReveal 0.2s ease-out" }}>{q.desc}</div>}
                    </div>
                  ))}
                  <TemplateViewer pattern={pattern} compact />
                </div>
              ))}
          </div>
        </div>
      )}

      {/*  TEMPLATES  */}
      {mode === MODES.TEMPLATES && (
        <div style={S.browseContainer}>
          <div style={S.topBar}>
            <button onClick={() => setMode(MODES.MENU)} style={S.backBtn}>
              {" "}
              back
            </button>
            <span style={{ fontSize: 14, color: "#c0caf5", fontWeight: 600 }}>All Templates</span>
          </div>

          <div style={S.templateFullCard}>
            <div style={{ ...S.patternHeader, marginBottom: 6 }}>
              <span style={{ ...S.patternDot, background: "#98c379" }} />
              <span style={{ ...S.patternName, color: "#98c379" }}>Universal Interview Skeleton</span>
            </div>
            <CodeBlock code={UNIVERSAL_TEMPLATE.code} />
          </div>

          {TEMPLATE_GROUPS.map((g, gi) => (
            <div key={gi} style={S.templateFullCard}>
              <div style={S.patternHeader}>
                <span style={{ ...S.patternDot, background: PATTERN_COLORS[g.patterns[0]] || "#a9b1d6" }} />
                <span style={{ ...S.patternName, color: PATTERN_COLORS[g.patterns[0]] || "#a9b1d6" }}>{g.category}</span>
                <span style={S.patternCount}>{g.templates.length} templates</span>
              </div>
              <div style={{ fontSize: 11, color: "#3b3d52", marginBottom: 8 }}>patterns: {g.patterns.join(", ")}</div>
              {g.templates.map((t, ti) => (
                <div key={ti} style={S.templateItem}>
                  <div style={S.templateName}>{t.name}</div>
                  <CodeBlock code={t.code} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#1a1b26", color: "#a9b1d6", fontFamily: "'JetBrains Mono',monospace", padding: "24px 16px", maxWidth: 640, margin: "0 auto" },
  menuContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 20 },
  logo: { fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: "#c0caf5", letterSpacing: "-0.5px" },
  logoAccent: { color: "#98c379" },
  logoDim: { color: "#565f89" },
  logoCursor: { color: "#98c379", animation: "pulse 1.2s step-end infinite", marginLeft: 2 },
  subtitle: { fontSize: 14, color: "#565f89", textAlign: "center", maxWidth: 320, lineHeight: 1.5 },
  statsCard: { background: "#1f2031", borderRadius: 12, padding: "16px 20px", width: "100%", maxWidth: 400, border: "1px solid #2a2b3d", display: "flex", flexDirection: "column", gap: 14 },
  statsRow: { display: "flex", justifyContent: "space-between", gap: 8 },
  statBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1 },
  statValue: { fontSize: 22, fontWeight: 700, color: "#c0caf5", lineHeight: 1 },
  statLabel2: { fontSize: 10, color: "#565f89", textTransform: "uppercase", letterSpacing: "0.5px" },
  weakSection: { borderTop: "1px solid #2a2b3d", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  weakLabel: { fontSize: 10, color: "#e06c75", textTransform: "uppercase", letterSpacing: "0.5px" },
  weakList: { display: "flex", flexDirection: "column", gap: 3 },
  weakItem: { fontSize: 12, color: "#7a7f9a" },
  configCard: { background: "#1f2031", borderRadius: 12, padding: "20px 24px", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16, border: "1px solid #2a2b3d" },
  configRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  configLabel: { fontSize: 13, color: "#565f89", minWidth: 80 },
  pillGroup: { display: "flex", gap: 6 },
  pill: { padding: "6px 14px", borderRadius: 20, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all 0.15s ease" },
  pillSmall: { padding: "4px 10px", borderRadius: 16, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" },
  pillActive: { color: "#c0caf5", borderColor: "#565f89", background: "#2a2b3d" },
  startBtn: { padding: "14px 40px", borderRadius: 10, border: "none", background: "#98c379", color: "#1a1b26", fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: "0.3px" },
  browseBtn: { padding: "10px 24px", borderRadius: 10, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" },
  menuBtnRow: { display: "flex", gap: 10 },
  resetBtn: { background: "none", border: "1px solid #2a2b3d", borderRadius: 8, padding: "4px 12px", color: "#3b3d52", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" },
  resetConfirm: { display: "flex", alignItems: "center", gap: 10 },
  playContainer: { display: "flex", flexDirection: "column", gap: 20 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "none", border: "none", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" },
  stats2: { display: "flex", gap: 16, alignItems: "center" },
  statItem: { fontSize: 14, fontWeight: 500, color: "#c0caf5" },
  statDim: { color: "#565f89" },
  progressTrack: { height: 2, background: "#2a2b3d", borderRadius: 1, overflow: "hidden" },
  progressBar: { height: "100%", background: "linear-gradient(90deg,#98c379,#61afef)", borderRadius: 1, transition: "width 0.3s ease" },
  questionArea: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0 16px" },
  diffBadge: { fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 12, border: "1px solid", textTransform: "uppercase", letterSpacing: "0.5px" },
  questionName: { fontSize: 22, fontWeight: 600, color: "#c0caf5", textAlign: "center", lineHeight: 1.3, fontFamily: "'JetBrains Mono',monospace" },
  descToggle: { background: "none", border: "none", color: "#565f89", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 6, transition: "all 0.15s ease" },
  descHotkey: { fontSize: 10, padding: "1px 5px", borderRadius: 4, border: "1px solid #3b3d52", color: "#3b3d52", fontWeight: 600 },
  descBox: { background: "#1f2031", border: "1px solid #2a2b3d", borderRadius: 10, padding: "14px 18px", fontSize: 13, lineHeight: 1.6, color: "#7a7f9a", maxWidth: 520, textAlign: "left", overflow: "hidden" },
  questionPrompt: { fontSize: 13, color: "#565f89", marginTop: 4 },
  choicesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  choiceBtn: { padding: "16px 14px", borderRadius: 10, border: "1px solid", background: "transparent", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", textAlign: "left", transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 10, lineHeight: 1.35 },
  choiceNum: { fontSize: 11, color: "#3b3d52", fontWeight: 600, flexShrink: 0, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "1px solid #3b3d52" },
  nextArea: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" },
  nextBtn: { padding: "10px 24px", borderRadius: 8, border: "none", background: "#2a2b3d", color: "#c0caf5", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", fontWeight: 500 },
  resultsContainer: { display: "flex", flexDirection: "column", gap: 24, alignItems: "center" },
  resultsHeader: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" },
  scoreCircle: { display: "flex", alignItems: "baseline", gap: 2 },
  scoreNum: { fontSize: 56, fontWeight: 700, color: "#c0caf5", lineHeight: 1 },
  scorePct: { fontSize: 24, fontWeight: 300, color: "#565f89" },
  scoreSummary: { fontSize: 14, color: "#565f89" },
  lifetimeBar: { background: "#1f2031", borderRadius: 8, padding: "8px 14px", border: "1px solid #2a2b3d" },
  lifetimeLabel: { fontSize: 11, color: "#565f89" },
  resultsList: { width: "100%", display: "flex", flexDirection: "column", gap: 4 },
  resultRowOuter: { borderRadius: 8, background: "#1f2031", overflow: "hidden" },
  resultRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", fontSize: 13, cursor: "pointer", borderRadius: 8, transition: "background 0.1s ease" },
  resultIcon: { fontSize: 14, fontWeight: 700, flexShrink: 0, width: 18 },
  resultName: { color: "#a9b1d6", flex: 1, fontSize: 12 },
  resultPattern: { fontSize: 12, fontWeight: 500, flexShrink: 0 },
  resultWrong: { fontSize: 11, color: "#565f89", flexShrink: 0 },
  chevron: { fontSize: 10, color: "#3b3d52", flexShrink: 0, marginLeft: 4 },
  resultsActions: { display: "flex", gap: 12, padding: "16px 0" },
  browseContainer: { display: "flex", flexDirection: "column", gap: 16 },
  browseTitle: { fontSize: 20, fontWeight: 600, color: "#c0caf5", fontFamily: "'JetBrains Mono',monospace" },
  browseGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  patternCard: { background: "#1f2031", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2b3d" },
  patternHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  patternDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  patternName: { fontSize: 14, fontWeight: 600, flex: 1 },
  patternCount: { fontSize: 12, color: "#565f89" },
  patternQ: { fontSize: 12, color: "#7a7f9a", padding: "6px 6px 6px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 6, transition: "background 0.1s ease" },
  patternQDiff: { fontSize: 8, flexShrink: 0 },
  browseDescBox: { padding: "4px 8px 10px 30px", fontSize: 11, lineHeight: 1.55, color: "#565f89", overflow: "hidden" },
  // Template styles
  codeBlock: { background: "#16161e", border: "1px solid #2a2b3d", borderRadius: 8, padding: "12px 14px", fontSize: 12, lineHeight: 1.55, color: "#c0caf5", fontFamily: "'JetBrains Mono',monospace", overflowX: "auto", whiteSpace: "pre", margin: "4px 0" },
  templateToggle: { background: "none", border: "none", color: "#7a7f9a", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, transition: "all 0.15s ease", width: "100%", textAlign: "left" },
  templateToggleLg: { background: "none", border: "none", color: "#565f89", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, transition: "all 0.15s ease" },
  templateCount: { fontSize: 10, color: "#3b3d52", marginLeft: "auto" },
  templatePanel: { paddingLeft: 8, overflow: "hidden" },
  templatePanelLg: { background: "#1f2031", border: "1px solid #2a2b3d", borderRadius: 10, padding: "14px 16px", maxWidth: 560, overflow: "hidden" },
  templateSection: { display: "flex", flexDirection: "column", gap: 4, padding: "4px 0" },
  templateItem: { marginBottom: 10 },
  templateName: { fontSize: 12, color: "#e5c07b", fontWeight: 500, marginBottom: 4 },
  templateFullCard: { background: "#1f2031", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2b3d" },
};

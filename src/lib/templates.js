export const UNIVERSAL_TEMPLATE = {
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

export const TEMPLATE_GROUPS = [
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
export const PATTERN_TO_TEMPLATES = {};
TEMPLATE_GROUPS.forEach((g) => {
  g.patterns.forEach((p) => {
    PATTERN_TO_TEMPLATES[p] = { category: g.category, templates: g.templates };
  });
});


# Primitive Levels Expansion Plan

## Objective

Add a focused primitive curriculum to Blueprint mode so players build core interview mechanics in a structured sequence before composition-heavy problems.

This plan intentionally avoids implementation in this phase. It defines content scope, sequencing, and execution steps for a later coding change.

## Approach

1. Keep the current 87-question strategy pipeline unchanged.
2. Add a primitives layer as curated Blueprint campaign content.
3. Reuse existing levels where they already match target primitives.
4. Add only missing primitives as new handcrafted levels.
5. Re-sequence campaign worlds so prerequisites come before advanced variants.

## Gap Audit

### Already represented in current content

- `q-1` Two Sum (complement lookup)
- `q-2` Valid Anagram (frequency count)
- `q-4` Group Anagrams (group by key)
- `q-9` Valid Palindrome (two pointers converge)
- `1` Maximum Window Sum (fixed-size sliding window)
- `q-14` Longest Substring Without Repeating Characters (variable-size sliding window)
- `q-17` Valid Parentheses (stack push/pop)
- `q-21` Binary Search (sorted bounds template)
- `q-27` Reverse Linked List
- `q-28` Merge Two Sorted Lists
- `q-29` Linked List Cycle (Floyd)
- `q-31` Remove Nth Node From End (two-pointer gap)
- `q-33` Invert Binary Tree
- `q-34` Maximum Depth of Binary Tree
- `q-38` Binary Tree Level Order Traversal (BFS queue)
- `q-54` Number of Islands (DFS components)
- `q-57` Course Schedule (topological sort)

### Missing primitives to add

- Tree traversal skeletons (inorder / preorder / postorder)
- Prefix sum (range sum query pattern)
- Monotonic stack as Next Greater Element
- BFS shortest path in unweighted grid
- Quickselect / partition (kth largest)

### Optional reinforcement

- Merge-sort merge step on arrays (optional bonus level)

## Target Primitive Curriculum (22 Core Levels)

### Linked List Primitives

- Reverse a linked list
- Remove nth node from end
- Detect cycle (Floyd)
- Merge two sorted lists

### Binary Tree Primitives

- Inorder / preorder / postorder traversal
- Level-order traversal (BFS)
- Max depth
- Invert binary tree

### Array/String Primitives

- Two-pointer converge
- Sliding window fixed-size
- Sliding window variable-size
- Binary search on sorted array
- Prefix sum (range sum query)

### Hash Map Primitives

- Frequency count
- Complement lookup
- Group by key

### Stack Primitives

- Valid parentheses
- Monotonic stack (next greater element)

### Graph Primitives

- BFS shortest path (unweighted grid)
- DFS connected components
- Topological sort

### Sorting/Searching Primitives

- Quickselect / partition

## Implementation Phases

## Phase 1: Define canonical primitive spec

Create a canonical primitive spec section in this doc (or a sibling doc) with one row per primitive:

- `id` (stable, recommended `p-*` IDs)
- title
- template family
- difficulty tier
- prerequisite IDs
- objective statement
- acceptance test shape

Recommended ID style examples:

- `p-tree-traversal-orders`
- `p-prefix-sum-range-query`
- `p-next-greater-element`
- `p-grid-bfs-shortest-path`
- `p-quickselect-kth-largest`

## Phase 2: Add new handcrafted primitive levels

File scope:

- `src/lib/blueprint/levels.js`

Plan:

- Add only missing primitives as `p-*` level entries.
- Keep existing matching `q-*` and base levels for already-covered primitives.
- Assign template IDs to match flow semantics:
  - tree/graph primitives -> `TREE_GRAPH_TEMPLATE_ID`
  - hash/prefix primitives -> `ARRAY_HASHING_TEMPLATE_ID`
  - stack primitives -> `STACK_HEAP_TEMPLATE_ID`
  - quickselect/partition -> `DEFAULT_BLUEPRINT_TEMPLATE_ID` or `INTERVAL_GREEDY_TEMPLATE_ID` based on final slot clarity

## Phase 3: Re-sequence campaign worlds

File scope:

- `src/lib/blueprint/campaign.js`

Plan:

- Reorder `WORLD_DEFINITIONS` and `levelIds` to enforce prerequisite progression.
- Keep world-by-structure organization:
  - Linked List World
  - Tree World
  - Array/String World
  - Hash Map World
  - Stack World
  - Graph World
  - Sorting/Searching World
- Ensure graph sequence places BFS shortest path before topo sort.
- Keep unlock policy initially unless stricter gating is explicitly desired.

## Phase 4: Align menu preview and route entry expectations

File scope:

- `src/App.jsx`

Plan:

- Update `BLUEPRINT_MENU_PREVIEW_WORLDS` so menu preview worlds reflect the new campaign structure.
- Confirm quick-start still selects first unsolved unlocked challenge.

## Phase 5: Update tests

File scope:

- `src/lib/blueprint/levels.test.js`
- `src/lib/blueprint/campaign.test.js`
- `src/lib/blueprint/engine.test.js`
- `src/screens/BlueprintScreen.test.jsx`
- `src/screens/MenuScreen.test.jsx`

Plan:

- Add assertions that new primitive `p-*` levels exist and are buildable.
- Update sequencing/unlock tests for new world order.
- Keep all-level canonical-pass test green in engine tests.
- Update UI tests for changed world labels/families/preview rows.

## Phase 6: QA, reporting, and docs

Commands:

- `npm run test`
- `npm run blueprint:report`

Manual checks:

- campaign map ordering and unlock flow
- world detail tier progression
- daily challenge selection still deterministic
- star persistence for newly added `p-*` level IDs
- quick-start CTA behavior (`Jump In` / `Continue Challenge`)

Documentation:

- Update `README.md` in the implementation PR because campaign behavior/content sequencing changes user-visible Blueprint mode behavior.

## Guardrails

- Do not add primitives as new entries in `src/lib/questions.js` for this rollout.
  - Reason: that would force contract/strategy coverage changes and affect strict 87/87 CI assumptions.
- Keep existing level IDs stable to avoid breaking historical star progress.
- Prefer additive rollout first; avoid deleting old levels in initial pass.
- Preserve existing fallback/coverage CI gates for auto-generated `q-*` levels.

## Proposed First Implementation Slice

Smallest high-value first PR:

1. Add two missing primitives:
   - `p-prefix-sum-range-query`
   - `p-next-greater-element`
2. Insert into existing relevant worlds with prerequisite ordering.
3. Update tests and README.
4. Validate with `npm run test` and `npm run blueprint:report`.

Then follow with tree traversal, grid BFS shortest path, and quickselect in a second PR.


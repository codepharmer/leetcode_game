import { useState, useEffect, useCallback, useRef } from "react";

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(correctPattern, allPatterns) {
  const wrong = shuffle(allPatterns.filter((p) => p !== correctPattern)).slice(0, 3);
  return shuffle([correctPattern, ...wrong]);
}

const MODES = { MENU: "menu", PLAY: "play", RESULTS: "results", BROWSE: "browse" };
const DIFF_COLORS = { Easy: "#98c379", Medium: "#e5c07b", Hard: "#e06c75" };

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
  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});

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
    if (picked.length > 0) setChoices(generateChoices(picked[0].pattern, ALL_PATTERNS));
    setMode(MODES.PLAY);
  }, [filterDifficulty, totalQuestions]);

  const handleSelect = (choice) => {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === currentQ.pattern;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => { const ns = s + 1; setBestStreak((b) => Math.max(b, ns)); return ns; });
    } else { setStreak(0); }
    setResults((r) => [...r, { question: currentQ, chosen: choice, correct }]);
    setShowNext(true);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) { setMode(MODES.RESULTS); setExpandedResult({}); return; }
    const ni = currentIdx + 1;
    setCurrentIdx(ni);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setChoices(generateChoices(questions[ni].pattern, ALL_PATTERNS));
  };

  useEffect(() => {
    const handler = (e) => {
      if (mode !== MODES.PLAY) return;
      if (showNext && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); nextQuestion(); return; }
      if (e.key === "d" || e.key === "D") { setShowDesc((p) => !p); return; }
      if (!showNext && selected === null) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4 && choices[num - 1]) handleSelect(choices[num - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, showNext, selected, choices, currentIdx, questions]);

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const groupedByPattern = {};
  const browseList = browseFilter === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.difficulty === browseFilter);
  browseList.forEach((q) => {
    if (!groupedByPattern[q.pattern]) groupedByPattern[q.pattern] = [];
    groupedByPattern[q.pattern].push(q);
  });

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1b26; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes barGrow { from { width: 0; } }
        @keyframes descReveal { from { opacity: 0; max-height: 0; padding-top:0; padding-bottom:0; } to { opacity: 1; max-height: 200px; } }
        .hover-row:hover { background: #24253a !important; }
      `}</style>

      {/* ─── MENU ─── */}
      {mode === MODES.MENU && (
        <div style={S.menuContainer}>
          <div style={S.logo}><span style={S.logoAccent}>$</span> pattern<span style={S.logoDim}>.match</span><span style={S.logoCursor}>▊</span></div>
          <p style={S.subtitle}>Map Blind 75 questions to their solution patterns</p>
          <div style={S.configCard}>
            <div style={S.configRow}>
              <span style={S.configLabel}>difficulty</span>
              <div style={S.pillGroup}>
                {["All", "Easy", "Medium", "Hard"].map((d) => (
                  <button key={d} onClick={() => setFilterDifficulty(d)}
                    style={{ ...S.pill, ...(filterDifficulty === d ? S.pillActive : {}),
                      color: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] : undefined,
                      borderColor: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] + "60" : undefined }}>
                    {d.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={S.configRow}>
              <span style={S.configLabel}>questions</span>
              <div style={S.pillGroup}>
                {[10, 20, 40, 87].map((n) => (
                  <button key={n} onClick={() => setTotalQuestions(n)}
                    style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}>
                    {n === 87 ? "all" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={startGame} style={S.startBtn}>start round →</button>
          <button onClick={() => setMode(MODES.BROWSE)} style={S.browseBtn}>browse all patterns</button>
        </div>
      )}

      {/* ─── PLAY ─── */}
      {mode === MODES.PLAY && currentQ && (
        <div style={S.playContainer}>
          <div style={S.topBar}>
            <button onClick={() => setMode(MODES.MENU)} style={S.backBtn}>← back</button>
            <div style={S.stats}>
              <span style={S.statItem}>{currentIdx + 1}<span style={S.statDim}>/{questions.length}</span></span>
              <span style={{ ...S.statItem, color: "#98c379" }}>{score}<span style={S.statDim}> correct</span></span>
              {streak > 1 && <span style={{ ...S.statItem, color: "#e5c07b", animation: "pulse 1s ease-in-out infinite" }}>🔥 {streak}</span>}
            </div>
          </div>

          <div style={S.progressTrack}>
            <div style={{ ...S.progressBar, width: `${((currentIdx + 1) / questions.length) * 100}%`, animation: "barGrow 0.3s ease-out" }} />
          </div>

          <div style={S.questionArea}>
            <span style={{ ...S.diffBadge, color: DIFF_COLORS[currentQ.difficulty], borderColor: DIFF_COLORS[currentQ.difficulty] + "40" }}>
              {currentQ.difficulty}
            </span>
            <h2 style={S.questionName}>{currentQ.name}</h2>

            <button className="hover-row" onClick={() => setShowDesc((p) => !p)} style={S.descToggle}>
              {showDesc ? "▾ hide description" : "▸ show description"}
              <span style={S.descHotkey}>D</span>
            </button>

            {showDesc && (
              <div style={{ ...S.descBox, animation: "descReveal 0.25s ease-out" }}>
                {currentQ.desc}
              </div>
            )}

            <p style={S.questionPrompt}>What pattern solves this?</p>
          </div>

          <div style={S.choicesGrid}>
            {choices.map((c, i) => {
              let bg = "transparent", border = "#3b3d52", fg = "#a9b1d6";
              if (selected !== null) {
                if (c === currentQ.pattern) { bg = "#98c37918"; border = "#98c379"; fg = "#98c379"; }
                else if (c === selected) { bg = "#e06c7518"; border = "#e06c75"; fg = "#e06c75"; }
              }
              return (
                <button key={c} onClick={() => handleSelect(c)}
                  style={{ ...S.choiceBtn, borderColor: border, background: bg, color: fg,
                    cursor: selected !== null ? "default" : "pointer",
                    animation: `fadeUp 0.2s ease-out ${i * 0.05}s both` }}>
                  <span style={S.choiceNum}>{i + 1}</span>{c}
                </button>
              );
            })}
          </div>

          {showNext && (
            <div style={{ ...S.nextArea, animation: "fadeUp 0.2s ease-out" }}>
              {selected === currentQ.pattern
                ? <span style={{ color: "#98c379", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>✓ correct</span>
                : <span style={{ color: "#e06c75", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>✗ answer: <span style={{ color: "#a9b1d6" }}>{currentQ.pattern}</span></span>}
              <button onClick={nextQuestion} style={S.nextBtn}>
                {currentIdx + 1 >= questions.length ? "see results" : "next"} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {mode === MODES.RESULTS && (
        <div style={S.resultsContainer}>
          <div style={S.resultsHeader}>
            <div style={S.logo}><span style={S.logoAccent}>$</span> results<span style={S.logoCursor}>▊</span></div>
            <div style={S.scoreCircle}><span style={S.scoreNum}>{pct}</span><span style={S.scorePct}>%</span></div>
            <p style={S.scoreSummary}>{score}/{questions.length} correct · best streak: {bestStreak}</p>
          </div>

          <div style={S.resultsList}>
            {results.map((r, i) => (
              <div key={i} style={{ ...S.resultRowOuter, animation: `slideIn 0.2s ease-out ${i * 0.03}s both` }}>
                <div className="hover-row" onClick={() => setExpandedResult((p) => ({ ...p, [i]: !p[i] }))} style={S.resultRow}>
                  <span style={{ ...S.resultIcon, color: r.correct ? "#98c379" : "#e06c75" }}>{r.correct ? "✓" : "✗"}</span>
                  <span style={S.resultName}>{r.question.name}</span>
                  <span style={{ ...S.resultPattern, color: PATTERN_COLORS[r.question.pattern] || "#a9b1d6" }}>{r.question.pattern}</span>
                  {!r.correct && <span style={S.resultWrong}>(you: {r.chosen})</span>}
                  <span style={S.chevron}>{expandedResult[i] ? "▾" : "▸"}</span>
                </div>
                {expandedResult[i] && (
                  <div style={{ ...S.inlineDesc, animation: "descReveal 0.2s ease-out" }}>{r.question.desc}</div>
                )}
              </div>
            ))}
          </div>

          <div style={S.resultsActions}>
            <button onClick={startGame} style={S.startBtn}>play again →</button>
            <button onClick={() => setMode(MODES.MENU)} style={S.browseBtn}>menu</button>
          </div>
        </div>
      )}

      {/* ─── BROWSE ─── */}
      {mode === MODES.BROWSE && (
        <div style={S.browseContainer}>
          <div style={S.topBar}>
            <button onClick={() => setMode(MODES.MENU)} style={S.backBtn}>← back</button>
            <div style={S.pillGroup}>
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button key={d} onClick={() => setBrowseFilter(d)}
                  style={{ ...S.pillSmall, ...(browseFilter === d ? S.pillActive : {}),
                    color: d !== "All" && browseFilter === d ? DIFF_COLORS[d] : undefined }}>
                  {d.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <h2 style={S.browseTitle}>All Patterns</h2>
          <div style={S.browseGrid}>
            {Object.entries(groupedByPattern).sort((a, b) => a[0].localeCompare(b[0])).map(([pattern, qs]) => (
              <div key={pattern} style={S.patternCard}>
                <div style={S.patternHeader}>
                  <span style={{ ...S.patternDot, background: PATTERN_COLORS[pattern] || "#a9b1d6" }} />
                  <span style={{ ...S.patternName, color: PATTERN_COLORS[pattern] || "#a9b1d6" }}>{pattern}</span>
                  <span style={S.patternCount}>{qs.length}</span>
                </div>
                {qs.map((q) => (
                  <div key={q.id}>
                    <div className="hover-row" onClick={() => setExpandedBrowse((p) => ({ ...p, [q.id]: !p[q.id] }))} style={S.patternQ}>
                      <span style={{ ...S.patternQDiff, color: DIFF_COLORS[q.difficulty] }}>●</span>
                      <span style={{ flex: 1 }}>{q.name}</span>
                      <span style={S.chevron}>{expandedBrowse[q.id] ? "▾" : "▸"}</span>
                    </div>
                    {expandedBrowse[q.id] && (
                      <div style={{ ...S.browseDescBox, animation: "descReveal 0.2s ease-out" }}>{q.desc}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#1a1b26", color: "#a9b1d6", fontFamily: "'JetBrains Mono', monospace", padding: "24px 16px", maxWidth: 640, margin: "0 auto" },
  menuContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 24 },
  logo: { fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: "#c0caf5", letterSpacing: "-0.5px" },
  logoAccent: { color: "#98c379" },
  logoDim: { color: "#565f89" },
  logoCursor: { color: "#98c379", animation: "pulse 1.2s step-end infinite", marginLeft: 2 },
  subtitle: { fontSize: 14, color: "#565f89", textAlign: "center", maxWidth: 320, lineHeight: 1.5 },
  configCard: { background: "#1f2031", borderRadius: 12, padding: "20px 24px", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16, border: "1px solid #2a2b3d" },
  configRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  configLabel: { fontSize: 13, color: "#565f89", minWidth: 80 },
  pillGroup: { display: "flex", gap: 6 },
  pill: { padding: "6px 14px", borderRadius: 20, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", transition: "all 0.15s ease" },
  pillSmall: { padding: "4px 10px", borderRadius: 16, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" },
  pillActive: { color: "#c0caf5", borderColor: "#565f89", background: "#2a2b3d" },
  startBtn: { padding: "14px 40px", borderRadius: 10, border: "none", background: "#98c379", color: "#1a1b26", fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", letterSpacing: "0.3px" },
  browseBtn: { padding: "10px 24px", borderRadius: 10, border: "1px solid #2a2b3d", background: "transparent", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" },
  playContainer: { display: "flex", flexDirection: "column", gap: 20 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "none", border: "none", color: "#565f89", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" },
  stats: { display: "flex", gap: 16, alignItems: "center" },
  statItem: { fontSize: 14, fontWeight: 500, color: "#c0caf5" },
  statDim: { color: "#565f89" },
  progressTrack: { height: 2, background: "#2a2b3d", borderRadius: 1, overflow: "hidden" },
  progressBar: { height: "100%", background: "linear-gradient(90deg, #98c379, #61afef)", borderRadius: 1, transition: "width 0.3s ease" },
  questionArea: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0 16px" },
  diffBadge: { fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 12, border: "1px solid", textTransform: "uppercase", letterSpacing: "0.5px" },
  questionName: { fontSize: 22, fontWeight: 600, color: "#c0caf5", textAlign: "center", lineHeight: 1.3, fontFamily: "'JetBrains Mono', monospace" },
  descToggle: { background: "none", border: "none", color: "#565f89", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 6, transition: "all 0.15s ease" },
  descHotkey: { fontSize: 10, padding: "1px 5px", borderRadius: 4, border: "1px solid #3b3d52", color: "#3b3d52", fontWeight: 600 },
  descBox: { background: "#1f2031", border: "1px solid #2a2b3d", borderRadius: 10, padding: "14px 18px", fontSize: 13, lineHeight: 1.6, color: "#7a7f9a", maxWidth: 520, textAlign: "left", overflow: "hidden" },
  questionPrompt: { fontSize: 13, color: "#565f89", marginTop: 4 },
  choicesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  choiceBtn: { padding: "16px 14px", borderRadius: 10, border: "1px solid", background: "transparent", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textAlign: "left", transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 10, lineHeight: 1.35 },
  choiceNum: { fontSize: 11, color: "#3b3d52", fontWeight: 600, flexShrink: 0, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "1px solid #3b3d52" },
  nextArea: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" },
  nextBtn: { padding: "10px 24px", borderRadius: 8, border: "none", background: "#2a2b3d", color: "#c0caf5", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", fontWeight: 500 },
  resultsContainer: { display: "flex", flexDirection: "column", gap: 24, alignItems: "center" },
  resultsHeader: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" },
  scoreCircle: { display: "flex", alignItems: "baseline", gap: 2 },
  scoreNum: { fontSize: 56, fontWeight: 700, color: "#c0caf5", lineHeight: 1 },
  scorePct: { fontSize: 24, fontWeight: 300, color: "#565f89" },
  scoreSummary: { fontSize: 14, color: "#565f89" },
  resultsList: { width: "100%", display: "flex", flexDirection: "column", gap: 4 },
  resultRowOuter: { borderRadius: 8, background: "#1f2031", overflow: "hidden" },
  resultRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", fontSize: 13, cursor: "pointer", borderRadius: 8, transition: "background 0.1s ease" },
  resultIcon: { fontSize: 14, fontWeight: 700, flexShrink: 0, width: 18 },
  resultName: { color: "#a9b1d6", flex: 1, fontSize: 12 },
  resultPattern: { fontSize: 12, fontWeight: 500, flexShrink: 0 },
  resultWrong: { fontSize: 11, color: "#565f89", flexShrink: 0 },
  chevron: { fontSize: 10, color: "#3b3d52", flexShrink: 0, marginLeft: 4 },
  inlineDesc: { padding: "0 12px 12px 40px", fontSize: 12, lineHeight: 1.55, color: "#565f89", overflow: "hidden" },
  resultsActions: { display: "flex", gap: 12, padding: "16px 0" },
  browseContainer: { display: "flex", flexDirection: "column", gap: 20 },
  browseTitle: { fontSize: 20, fontWeight: 600, color: "#c0caf5", fontFamily: "'JetBrains Mono', monospace" },
  browseGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  patternCard: { background: "#1f2031", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2b3d" },
  patternHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  patternDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  patternName: { fontSize: 14, fontWeight: 600, flex: 1 },
  patternCount: { fontSize: 12, color: "#565f89" },
  patternQ: { fontSize: 12, color: "#7a7f9a", padding: "6px 6px 6px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 6, transition: "background 0.1s ease" },
  patternQDiff: { fontSize: 8, flexShrink: 0 },
  browseDescBox: { padding: "4px 8px 10px 30px", fontSize: 11, lineHeight: 1.55, color: "#565f89", overflow: "hidden" },
};

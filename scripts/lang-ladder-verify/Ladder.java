// Ladder.java — every rung of the 40-rung language ladder, executed.
// java Ladder.java    (JDK 11 single-file source launcher)
import java.util.*;
import java.util.stream.*;

public class Ladder {

    // R19: JDK 11 has no `record` (that is Java 16+), so this is the pre-16 form.
    static final class P {
        final int a, b;
        P(int a, int b) { this.a = a; this.b = b; }
        @Override public boolean equals(Object o) {
            if (!(o instanceof P)) return false;
            P p = (P) o; return a == p.a && b == p.b;
        }
        @Override public int hashCode() { return Objects.hash(a, b); }
        @Override public String toString() { return "(" + a + "," + b + ")"; }
    }

    public static void main(String[] args) {

        // R01 declare, index, length
        {
            int[] arr = {5, 2, 9};
            List<Integer> li = new ArrayList<>(List.of(5, 2, 9));
            String s = "abc";
            System.out.println("R01 arr[0]=" + arr[0] + " arr.length=" + arr.length
                + " li.get(0)=" + li.get(0) + " li.size()=" + li.size()
                + " s.length()=" + s.length() + " li.isEmpty()=" + li.isEmpty()
                + "   <- .length / .size() / .length() are three spellings");
            int[] fresh = new int[3];
            System.out.println("R01init new int[3]=" + Arrays.toString(fresh)
                + " new String[2]=" + Arrays.toString(new String[2]) + " (objects default to null)");
        }

        // R02 iterate three ways
        {
            List<String> v = List.of("a", "b", "c");
            StringBuilder s1 = new StringBuilder(), s2 = new StringBuilder(), s3 = new StringBuilder();
            for (int i = 0; i < v.size(); i++) s1.append(v.get(i));
            for (String x : v) s2.append(x);
            for (int i = 0; i < v.size(); i++) s3.append(i).append(v.get(i));
            System.out.println("R02 index=" + s1 + " for-each=" + s2 + " with-index=" + s3
                + "  (no enumerate; you index by hand)");
        }

        // R03 initialize filled / sized
        {
            int[] a = new int[5];
            Arrays.fill(a, 7);
            int[] b = new int[5];
            List<Integer> c = new ArrayList<>(Collections.nCopies(5, 7));
            List<Integer> cap = new ArrayList<>(5);
            System.out.println("R03 Arrays.fill(new int[5],7)=" + Arrays.toString(a)
                + " new int[5]=" + Arrays.toString(b)
                + " nCopies(5,7)=" + c
                + " new ArrayList<>(5).size()=" + cap.size() + "  <- 5 is CAPACITY, not size");
        }

        // R04 grow and shrink
        {
            List<Integer> v = new ArrayList<>(List.of(1, 2, 3));
            v.add(4);
            v.add(1, 99);
            v.remove(0);                       // remove by INDEX
            int popped = v.remove(v.size() - 1);
            System.out.println("R04 after add/insert/remove=" + v + " popped=" + popped
                + "  (remove(int) is by index, remove(Object) is by value)");
            List<Integer> t = new ArrayList<>(List.of(10, 20, 30));
            t.remove(Integer.valueOf(20));
            System.out.println("R04trap remove(Integer.valueOf(20))=" + t + "  vs remove(1) would drop index 1");
        }

        // R05 copy vs alias
        {
            int[] a = {1, 2, 3};
            int[] alias = a;                   // same object
            int[] copy = a.clone();            // new array
            copy[0] = 42;
            alias[1] = 77;
            System.out.println("R05 a=" + Arrays.toString(a) + " copy=" + Arrays.toString(copy)
                + "  (= aliases, .clone()/Arrays.copyOf copies)");
        }

        // R06 2D grid
        {
            int[][] g = new int[2][3];
            g[1][2] = 7;
            System.out.println("R06 " + g.length + "x" + g[0].length + " " + Arrays.deepToString(g)
                + "  (deepToString, not toString)");
            System.out.println("R06trap Arrays.toString(g) starts with \"[[I@\" -> " + Arrays.toString(g).startsWith("[[I@")
                + "  <- identity hashcodes, not the numbers");
        }

        // R07 jagged
        {
            int[][] j = new int[3][];
            for (int i = 0; i < 3; i++) { j[i] = new int[i + 1]; Arrays.fill(j[i], i); }
            System.out.println("R07 jagged=" + Arrays.deepToString(j)
                + " rowlens=" + j[0].length + "," + j[1].length + "," + j[2].length);
        }

        // R08 reverse
        {
            List<Integer> v = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            Collections.reverse(v);
            int[] a = {1, 2, 3, 4, 5};
            for (int i = 1, k = 3; i < k; i++, k--) { int t = a[i]; a[i] = a[k]; a[k] = t; }
            System.out.println("R08 Collections.reverse=" + v + " manual range[1,4)=" + Arrays.toString(a)
                + "  (no Arrays.reverse exists)");
        }

        // R09 sum min max
        {
            int[] v = {4, 1, 9, 3};
            long sum = Arrays.stream(v).asLongStream().sum();
            int mn = Arrays.stream(v).min().getAsInt();
            int mx = Arrays.stream(v).max().getAsInt();
            IntSummaryStatistics st = Arrays.stream(v).summaryStatistics();
            System.out.println("R09 sum=" + sum + " min=" + mn + " max=" + mx
                + " summaryStatistics avg=" + st.getAverage() + " count=" + st.getCount());
            int[] big = {2000000000, 2000000000};
            System.out.println("R09trap Arrays.stream(big).sum() (int)=" + Arrays.stream(big).sum()
                + "  asLongStream().sum()=" + Arrays.stream(big).asLongStream().sum());
        }

        // R10 membership
        {
            List<Integer> v = new ArrayList<>(List.of(4, 1, 9));
            Set<Integer> s = new HashSet<>(v);
            System.out.println("R10 list.contains(9)=" + v.contains(9) + " (O(n))"
                + "   set.contains(9)=" + s.contains(9) + " (O(1))"
                + "   int[] has NO contains -> Arrays.stream(a).anyMatch");
        }

        // R11 index of a value / miss
        {
            List<Integer> v = new ArrayList<>(List.of(4, 1, 9));
            System.out.println("R11 indexOf(9)=" + v.indexOf(9) + " indexOf(8)=" + v.indexOf(8)
                + " lastIndexOf(9)=" + v.lastIndexOf(9) + "  (-1 means absent — a real sentinel, not an insertion point)");
        }

        // R12 array <-> list conversions
        {
            Integer[] boxed = {1, 2, 3};
            List<Integer> fromBoxed = new ArrayList<>(Arrays.asList(boxed));
            int[] prim = {1, 2, 3};
            List<Integer> fromPrim = Arrays.stream(prim).boxed().collect(Collectors.toList());
            int[] backToPrim = fromPrim.stream().mapToInt(Integer::intValue).toArray();
            Integer[] backToBoxed = fromBoxed.toArray(new Integer[0]);
            System.out.println("R12 fromBoxed=" + fromBoxed + " fromPrim(boxed())=" + fromPrim
                + " backToPrim=" + Arrays.toString(backToPrim) + " backToBoxed=" + Arrays.toString(backToBoxed));
            System.out.println("R12trap Arrays.asList(prim).size()=" + Arrays.asList(prim).size()
                + "  <- ONE element: the int[] itself, not 3");
        }

        // R13 in-place vs new
        {
            int[] a = {3, 1, 2};
            int[] b = a.clone();
            Arrays.sort(b);
            Arrays.sort(a);
            System.out.println("R13 sorted-in-place=" + Arrays.toString(a) + " copy-then-sort=" + Arrays.toString(b)
                + "  (Arrays.sort returns void)");
        }

        // R14 ascending / descending
        {
            Integer[] d = {3, 1, 2};
            Arrays.sort(d, Collections.reverseOrder());
            int[] p = {3, 1, 2};
            Arrays.sort(p);
            List<Integer> l = new ArrayList<>(List.of(3, 1, 2));
            l.sort(Comparator.reverseOrder());
            System.out.println("R14 asc(int[])=" + Arrays.toString(p)
                + " desc(Integer[] + reverseOrder)=" + Arrays.toString(d)
                + " list desc=" + l
                + "  <- int[] CANNOT sort descending directly: no comparator overload for primitives");
        }

        // R15 custom rule, second key
        {
            List<int[]> ps = new ArrayList<>(List.of(new int[]{1, 9}, new int[]{2, 1}, new int[]{1, 3}));
            ps.sort((x, y) -> x[1] != y[1] ? Integer.compare(x[1], y[1]) : Integer.compare(x[0], y[0]));
            StringBuilder o = new StringBuilder();
            for (int[] p : ps) o.append("(").append(p[0]).append(",").append(p[1]).append(")");
            System.out.println("R15 " + o);
            List<int[]> ps2 = new ArrayList<>(List.of(new int[]{1, 9}, new int[]{2, 1}, new int[]{1, 3}));
            ps2.sort(Comparator.<int[]>comparingInt(x -> x[1]).thenComparingInt(x -> x[0]));
            StringBuilder o2 = new StringBuilder();
            for (int[] p : ps2) o2.append("(").append(p[0]).append(",").append(p[1]).append(")");
            System.out.println("R15cmp comparingInt().thenComparingInt()=" + o2);
        }

        // R16 stable sort
        {
            List<Object[]> v = new ArrayList<>(List.of(
                new Object[]{"a", 1}, new Object[]{"b", 1}, new Object[]{"c", 0}));
            v.sort(Comparator.comparingInt(x -> (Integer) x[1]));
            StringBuilder o = new StringBuilder();
            for (Object[] p : v) o.append(p[0]);
            System.out.println("R16 List.sort is STABLE (TimSort) -> " + o + "  (a before b preserved)");
            System.out.println("R16note Arrays.sort(int[]) is dual-pivot quicksort, NOT stable — but primitives are indistinguishable so it cannot matter");
        }

        // R17 slices and views
        {
            List<Integer> base = new ArrayList<>(List.of(1, 2, 3, 4));
            List<Integer> sub = base.subList(0, 2);        // LIVE VIEW
            sub.set(0, 42);
            System.out.println("R17 subList is a VIEW: base=" + base + " sub=" + sub);
            Integer[] backing = {1, 2, 3};
            List<Integer> view = Arrays.asList(backing);
            view.set(0, 99);
            String addErr;
            try { view.add(4); addErr = "no throw"; }
            catch (UnsupportedOperationException e) { addErr = "UnsupportedOperationException"; }
            System.out.println("R17asList writes through: backing=" + Arrays.toString(backing) + " add -> " + addErr);
            int[] prim = {1, 2, 3, 4};
            System.out.println("R17copy Arrays.copyOfRange(prim,0,2)=" + Arrays.toString(Arrays.copyOfRange(prim, 0, 2)) + " (a real copy)");
        }

        // R18 pair / tuple
        {
            // Java has NO built-in pair type. Three substitutes, all shown:
            int[] p = {1, 9};
            Map.Entry<Integer, String> e = Map.entry(1, "a");
            List<Integer> lp = List.of(1, 9);
            Set<int[]> bad = new HashSet<>();
            bad.add(new int[]{1, 2}); bad.add(new int[]{1, 2});
            Set<List<Integer>> good = new HashSet<>();
            good.add(List.of(1, 2)); good.add(List.of(1, 2));
            System.out.println("R18 int[] pair=" + Arrays.toString(p)
                + " Map.entry=(" + e.getKey() + "," + e.getValue() + ")"
                + " List.of pair=" + lp);
            System.out.println("R18dedup HashSet<int[]> size=" + bad.size() + " (NO value equality!)"
                + "   HashSet<List<Integer>> size=" + good.size() + " (correct)");
        }

        // R19 record / class as element
        {
            List<P> v = new ArrayList<>(List.of(new P(2, 5), new P(1, 7)));
            v.sort(Comparator.comparingInt(x -> x.a));
            System.out.println("R19 sorted first=" + v.get(0)
                + " equals works=" + new P(1, 7).equals(new P(1, 7))
                + " usable as a key=" + new HashSet<>(List.of(new P(1, 1), new P(1, 1))).size()
                + "  (JDK 11: hand-written; Java 16+ `record P(int a,int b){}` generates all of this)");
        }

        // R20 hash map put/get/missing
        {
            Map<String, Integer> m = new HashMap<>();
            m.put("a", 1);
            Integer missing = m.get("b");                    // null, NOT 0
            int safe = m.getOrDefault("b", -1);
            int before = m.size();
            m.get("zz");                                     // get does NOT insert
            System.out.println("R20 get(\"a\")=" + m.get("a") + " get(\"b\")=" + missing
                + " getOrDefault(\"b\",-1)=" + safe
                + " size before=" + before + " after get(\"zz\")=" + m.size()
                + "  <- unlike C++ operator[], get never inserts");
            String npe;
            try { int x = m.get("b"); npe = "no throw " + x; }
            catch (NullPointerException ex) { npe = "NullPointerException on unboxing null"; }
            System.out.println("R20trap int x = m.get(\"b\") -> " + npe);
            m.putIfAbsent("c", 3);
            m.computeIfAbsent("d", k -> 4);
            m.merge("a", 10, Integer::sum);
            System.out.println("R20api putIfAbsent/computeIfAbsent/merge -> " + new TreeMap<>(m));
        }

        // R21 frequency counting
        {
            String s = "abracadabra";
            Map<Character, Integer> f = new HashMap<>();
            for (char c : s.toCharArray()) f.merge(c, 1, Integer::sum);
            Map<Character, Integer> f2 = new HashMap<>();
            for (char c : s.toCharArray()) f2.put(c, f2.getOrDefault(c, 0) + 1);
            System.out.println("R21 merge()=" + new TreeMap<>(f) + " getOrDefault()=" + new TreeMap<>(f2));
            int[] cnt = new int[26];
            for (char c : s.toCharArray()) cnt[c - 'a']++;
            System.out.println("R21fast int[26] counts a=" + cnt[0] + " b=" + cnt[1] + " r=" + cnt[17]
                + "  (the array beats the map when the alphabet is fixed)");
        }

        // R22 set / dedup
        {
            List<Integer> v = List.of(3, 1, 3, 2, 1);
            Set<Integer> hs = new HashSet<>(v);
            Set<Integer> ts = new TreeSet<>(v);
            Set<Integer> ls = new LinkedHashSet<>(v);
            System.out.println("R22 HashSet=" + hs + " TreeSet(sorted)=" + ts + " LinkedHashSet(insertion order)=" + ls);
        }

        // R23 iterating a map / ordering
        {
            Map<String, Integer> hm = new HashMap<>();
            hm.put("b", 2); hm.put("a", 1); hm.put("c", 3);
            StringBuilder h = new StringBuilder();
            for (Map.Entry<String, Integer> e : hm.entrySet()) h.append(e.getKey()).append(" ");
            StringBuilder t = new StringBuilder();
            for (Map.Entry<String, Integer> e : new TreeMap<>(hm).entrySet()) t.append(e.getKey()).append("=").append(e.getValue()).append(" ");
            System.out.println("R23 HashMap iteration order= " + h + " (unspecified)   TreeMap= " + t);
        }

        // R24 ordered map navigation
        {
            TreeMap<Integer, String> m = new TreeMap<>();
            m.put(10, "a"); m.put(20, "b"); m.put(30, "c");
            System.out.println("R24 ceilingKey(15)=" + m.ceilingKey(15) + " floorKey(15)=" + m.floorKey(15)
                + " higherKey(20)=" + m.higherKey(20) + " lowerKey(20)=" + m.lowerKey(20)
                + " firstKey=" + m.firstKey() + " lastKey=" + m.lastKey()
                + "  (named methods — no iterator arithmetic)");
        }

        // R25 binary search + miss
        {
            int[] s = {1, 3, 5, 7};
            int hit = Arrays.binarySearch(s, 5);
            int miss = Arrays.binarySearch(s, 4);
            int past = Arrays.binarySearch(s, 99);
            System.out.println("R25 binarySearch(5)=" + hit + " binarySearch(4)=" + miss
                + " -> insertionPoint = -(" + miss + ")-1 = " + (-miss - 1)
                + "   binarySearch(99)=" + past + " -> " + (-past - 1)
                + "  <- a NEGATIVE ENCODING, never an index");
        }

        // R26 counting duplicates without lower/upper bound
        {
            int[] s = {1, 3, 3, 3, 5};
            // Java ships no lowerBound/upperBound. You write them.
            int lo = lowerBound(s, 3), hi = upperBound(s, 3);
            System.out.println("R26 hand-written lowerBound=" + lo + " upperBound=" + hi + " count=" + (hi - lo)
                + "   Arrays.binarySearch(s,3)=" + Arrays.binarySearch(s, 3)
                + " <- lands on an ARBITRARY one of the equal keys");
        }

        // R27 prefix sums
        {
            int[] a = {2, 4, 6, 8};
            long[] p = new long[a.length + 1];
            for (int i = 0; i < a.length; i++) p[i + 1] = p[i] + a[i];
            System.out.println("R27 prefix=" + Arrays.toString(p) + " sum a[1..2]=" + (p[3] - p[1])
                + "  (long[] because int sums overflow at ~2.1e9)");
        }

        // R28 stack
        {
            Deque<Integer> st = new ArrayDeque<>();            // the RECOMMENDED stack
            st.push(1); st.push(2);
            int t = st.pop();
            String legacy;
            Stack<Integer> old = new Stack<>();                // synchronized, iterates BOTTOM-UP
            old.push(1); old.push(2);
            legacy = old.toString();
            System.out.println("R28 ArrayDeque push/pop -> popped=" + t + " peek=" + st.peek() + " size=" + st.size()
                + "   legacy Stack.toString()=" + legacy + " (bottom-first — reads backwards)");
            Deque<Integer> empty = new ArrayDeque<>();
            System.out.println("R28empty peek()=" + empty.peek() + " (null, no throw)  pop() would throw NoSuchElementException");
        }

        // R29 queue
        {
            Queue<Integer> q = new ArrayDeque<>();
            q.offer(1); q.offer(2);
            int f = q.poll();
            System.out.println("R29 poll=" + f + " peek=" + q.peek() + " size=" + q.size()
                + "   (LinkedList also implements Queue; ArrayDeque is faster)");
            System.out.println("R29trap ArrayList as a queue: remove(0) is O(n) — shifts every element");
        }

        // R30 deque both ends
        {
            Deque<Integer> d = new ArrayDeque<>(List.of(2, 3));
            d.addFirst(1); d.addLast(4);
            int a = d.pollFirst(), b = d.pollLast();
            System.out.println("R30 popped first=" + a + " back=" + b + " left=" + d
                + "  (ArrayDeque has NO index access — no d.get(0))");
        }

        // R31 priority queue defaults
        {
            PriorityQueue<Integer> mn = new PriorityQueue<>();                         // MIN-heap by default
            PriorityQueue<Integer> mx = new PriorityQueue<>(Comparator.reverseOrder());
            for (int x : new int[]{5, 1, 9}) { mn.offer(x); mx.offer(x); }
            System.out.println("R31 new PriorityQueue<>().peek()=" + mn.peek() + " (MIN by default — opposite of C++)"
                + "  reverseOrder().peek()=" + mx.peek() + " (max)");
            System.out.println("R31trap pq.toString()=" + mn + " <- HEAP ARRAY order, not sorted. Never print a heap.");
        }

        // R32 heap of pairs with comparator
        {
            PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(x -> x[0]));
            pq.offer(new int[]{3, 3}); pq.offer(new int[]{1, 1}); pq.offer(new int[]{2, 2});
            StringBuilder o = new StringBuilder();
            while (!pq.isEmpty()) o.append(pq.poll()[0]).append(" ");
            System.out.println("R32 drained= " + o + " (comparator reads NATURALLY, unlike C++)");
        }

        // R33 strings are sequences
        {
            String s = "hello";
            String up = s.substring(0, 1).toUpperCase() + s.substring(1);
            System.out.println("R33 charAt(0)=" + s.charAt(0) + " length()=" + s.length()
                + " substring(1,4)=" + s.substring(1, 4) + " (start,END-exclusive)"
                + " original unchanged=" + s + " new=" + up
                + "  <- String is IMMUTABLE; s.charAt(0)='H' does not compile");
            char[] cs = s.toCharArray();
            cs[0] = 'H';
            System.out.println("R33mut via toCharArray + new String(cs) = " + new String(cs));
        }

        // R34 building a string in a loop
        {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 5; i++) sb.append((char) ('a' + i));
            String bad = "";
            for (int i = 0; i < 5; i++) bad += (char) ('a' + i);      // O(n^2): new String each time
            System.out.println("R34 StringBuilder=" + sb + " (O(n))   += in a loop=" + bad
                + " (same answer, O(n^2) — this is the TLE)");
            System.out.println("R34join String.join(\"-\",...)=" + String.join("-", "a", "b", "c"));
        }

        // R35 char arithmetic
        {
            char c = 'c';
            int idx = c - 'a';
            char back = (char) ('a' + 2);
            System.out.println("R35 'c'-'a'=" + idx + " (char)('a'+2)=" + back
                + " (int)'A'=" + (int) 'A' + " Character.isLetter=" + Character.isLetter(c)
                + "  <- 'a'+2 is an int; the (char) cast is mandatory");
            System.out.println("R35trap \"\" + 'a' + 2 = " + ("" + 'a' + 2) + "   but ('a'+2) = " + ('a' + 2));
        }

        // R36 overflow widths
        {
            int lo = 2000000000, hi = 2100000000;
            int badMid = (lo + hi) / 2;                 // wraps silently, NO exception
            int goodMid = lo + (hi - lo) / 2;
            System.out.println("R36 Integer.MAX_VALUE=" + Integer.MAX_VALUE
                + " MAX+1=" + (Integer.MAX_VALUE + 1) + " (wraps, no error)"
                + " Long.MAX_VALUE=" + Long.MAX_VALUE);
            System.out.println("R36mid lo=" + lo + " hi=" + hi + " lo+hi wraps to " + (lo + hi)
                + " so (lo+hi)/2=" + badMid + "  but lo+(hi-lo)/2=" + goodMid);
            String ex;
            try { Math.addExact(lo, hi); ex = "no throw"; }
            catch (ArithmeticException e) { ex = "ArithmeticException: " + e.getMessage(); }
            System.out.println("R36exact Math.addExact(lo,hi) -> " + ex);
        }

        // R37 boxing and equality
        {
            Integer x = 127, y = 127;
            Integer p = 128, q = 128;
            String a = "hel", b = "lo";
            String cat = a + b, lit = "hello";
            System.out.println("R37 Integer 127==127 -> " + (x == y) + "   128==128 -> " + (p == q)
                + "   128.equals(128) -> " + p.equals(q)
                + "  <- the JLS caches -128..127, so the bug only appears past 127");
            System.out.println("R37str (\"hel\"+\"lo\")==\"hello\" -> " + (cat == lit)
                + "   .equals -> " + cat.equals(lit) + "  (== on String compares REFERENCES)");
            int[] r = {1, 2}, s = {1, 2};
            System.out.println("R37arr int[]{1,2}.equals -> " + r.equals(s)
                + "   Arrays.equals -> " + Arrays.equals(r, s) + "  (arrays have no value equality)");
        }

        // R38 mutating while iterating
        {
            List<Integer> v = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            String cme;
            try {
                for (Integer x : v) if (x % 2 == 0) v.remove(x);
                cme = "no throw";
            } catch (ConcurrentModificationException e) { cme = "ConcurrentModificationException"; }
            System.out.println("R38 for-each + remove -> " + cme);
            List<Integer> w = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            Iterator<Integer> it = w.iterator();
            while (it.hasNext()) if (it.next() % 2 == 0) it.remove();
            List<Integer> z = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            z.removeIf(n -> n % 2 == 0);
            System.out.println("R38fix Iterator.remove()=" + w + "   removeIf()=" + z);
        }

        // R39 loop variable semantics
        {
            int[] v = {1, 2, 3};
            for (int x : v) x *= 10;                      // copy — no effect
            System.out.print("R39 by value=" + Arrays.toString(v));
            for (int i = 0; i < v.length; i++) v[i] *= 10;
            System.out.println("  by index=" + Arrays.toString(v) + "  (Java has no reference loop variable)");
            List<int[]> objs = new ArrayList<>(List.of(new int[]{1}));
            for (int[] o : objs) o[0] = 99;               // object CONTENTS are shared
            System.out.println("R39obj mutating through an object loop var DOES stick: " + objs.get(0)[0]);
        }

        // R40 scale traps
        {
            List<Integer> big = new ArrayList<>();
            for (int i = 0; i < 1000; i++) big.add(i);
            System.out.println("R40 ArrayList grows 1.5x (10,15,22,33,...) — call new ArrayList<>(n) when n is known");
            long t0 = System.nanoTime();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 20000; i++) sb.append('x');
            long tSb = System.nanoTime() - t0;
            t0 = System.nanoTime();
            String bad = "";
            for (int i = 0; i < 20000; i++) bad += 'x';
            long tCat = System.nanoTime() - t0;
            long ratio = tCat / Math.max(tSb, 1);
            System.out.println("R40perf 20000 appends: StringBuilder faster than += by more than 10x -> " + (ratio > 10)
                + "  (measured in-run; the exact multiple varies, the order of magnitude does not)");
            System.out.println("R40box Integer boxing costs ~16 bytes/element: int[1_000_000] ~4MB vs List<Integer> ~20MB");
        }
    }

    static int lowerBound(int[] a, int t) {
        int lo = 0, hi = a.length;
        while (lo < hi) { int m = lo + (hi - lo) / 2; if (a[m] < t) lo = m + 1; else hi = m; }
        return lo;
    }

    static int upperBound(int[] a, int t) {
        int lo = 0, hi = a.length;
        while (lo < hi) { int m = lo + (hi - lo) / 2; if (a[m] <= t) lo = m + 1; else hi = m; }
        return lo;
    }
}

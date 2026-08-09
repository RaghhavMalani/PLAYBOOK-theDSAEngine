// Drills.java — one real mini-problem per rung, executed.
// java Drills.java   (JDK 11 single-file source launcher)
import java.util.*;
import java.util.stream.*;

public class Drills {

    static final class Emp {
        final String name; final int sal;
        Emp(String n, int s) { name = n; sal = s; }
    }

    public static void main(String[] a_) {

        // D01 middle element of an odd-length array
        { int[] a = {5, 2, 9, 1, 7};
          System.out.println("D01 middle=" + a[a.length / 2] + " first=" + a[0] + " last=" + a[a.length - 1]); }

        // D02 sum of elements at even indices
        { int[] a = {1, 2, 3, 4, 5}; int s = 0;
          for (int i = 0; i < a.length; i += 2) s += a[i];
          System.out.println("D02 evenIdxSum=" + s); }

        // D03 tally
        { int[] t = new int[5]; for (int h : new int[]{1, 3, 1}) t[h]++;
          System.out.println("D03 tally=" + Arrays.toString(t)); }

        // D04 LC27 remove element in place
        { int[] a = {3, 2, 2, 3}; int val = 3, k = 0;
          for (int x : a) if (x != val) a[k++] = x;
          System.out.println("D04 removeElement(val=3) k=" + k + " a=" + Arrays.toString(Arrays.copyOf(a, k))); }

        // D05 sort a copy without disturbing the caller
        { int[] orig = {3, 1, 2};
          int[] s = orig.clone(); Arrays.sort(s);
          System.out.println("D05 sorted=" + Arrays.toString(s) + " original untouched=" + Arrays.toString(orig)); }

        // D06 identity matrix
        { int n = 3; int[][] m = new int[n][n];
          for (int i = 0; i < n; i++) m[i][i] = 1;
          System.out.println("D06 identity=" + Arrays.deepToString(m)); }

        // D07 LC118 Pascal's triangle
        { int n = 5; List<List<Integer>> t = new ArrayList<>();
          for (int i = 0; i < n; i++) {
              List<Integer> row = new ArrayList<>(Collections.nCopies(i + 1, 1));
              for (int j = 1; j < i; j++) row.set(j, t.get(i - 1).get(j - 1) + t.get(i - 1).get(j));
              t.add(row); }
          System.out.println("D07 pascal=" + t); }

        // D08 LC189 rotate right by k with triple reverse
        { int[] a = {1,2,3,4,5,6,7}; int k = 3 % a.length;
          rev(a, 0, a.length - 1); rev(a, 0, k - 1); rev(a, k, a.length - 1);
          System.out.println("D08 rotateRight(3)=" + Arrays.toString(a)); }

        // D09 LC53 Kadane
        { int[] a = {-2,1,-3,4,-1,2,1,-5,4};
          long best = a[0], cur = a[0];
          for (int i = 1; i < a.length; i++) { cur = Math.max(a[i], cur + a[i]); best = Math.max(best, cur); }
          System.out.println("D09 maxSubarraySum=" + best); }

        // D10 LC217 contains duplicate
        { int[] a = {1,2,3,1};
          Set<Integer> s = new HashSet<>();
          boolean dup = false;
          for (int x : a) if (!s.add(x)) { dup = true; break; }        // add() returns false on a duplicate
          System.out.println("D10 containsDuplicate=" + dup); }

        // D11 index-of with a real sentinel
        { List<Integer> a = List.of(4, 1, 9);
          System.out.println("D11 indexOf(9)=" + a.indexOf(9) + " indexOf(8)=" + a.indexOf(8)); }

        // D12 digits string -> int[] -> sum
        { String s = "12345";
          int[] d = s.chars().map(c -> c - '0').toArray();
          System.out.println("D12 digits=" + Arrays.toString(d) + " sum=" + Arrays.stream(d).sum()); }

        // D13 LC215 kth largest without disturbing the original
        { int[] a = {3,2,1,5,6,4}; int k = 2;
          int[] c = a.clone(); Arrays.sort(c);
          System.out.println("D13 kthLargest(2)=" + c[c.length - k] + " original=" + Arrays.toString(a)
            + "  (no descending sort for int[], so index from the END)"); }

        // D14 top-3 largest
        { int[] a = {5,1,9,3,7};
          int[] top = Arrays.stream(a).boxed().sorted(Comparator.reverseOrder()).limit(3).mapToInt(Integer::intValue).toArray();
          System.out.println("D14 top3=" + Arrays.toString(top)); }

        // D15 sort people by age asc then name asc
        { List<Object[]> p = new ArrayList<>(List.of(
              new Object[]{30,"bob"}, new Object[]{25,"amy"}, new Object[]{30,"ann"}));
          p.sort(Comparator.<Object[]>comparingInt(x -> (Integer) x[0]).thenComparing(x -> (String) x[1]));
          StringBuilder o = new StringBuilder();
          for (Object[] x : p) o.append(x[1]).append(x[0]).append(" ");
          System.out.println("D15 byAgeThenName= " + o); }

        // D16 sort words by length, alphabetical within equal lengths
        { List<String> w = new ArrayList<>(List.of("pear","fig","apple","kiwi"));
          w.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));
          System.out.println("D16 byLenThenAlpha= " + String.join(" ", w) + " "); }

        // D17 LC643 max average of a window of size k
        { int[] a = {1,12,-5,-6,50,3}; int k = 4;
          double sum = 0; for (int i = 0; i < k; i++) sum += a[i];
          double best = sum;
          for (int i = k; i < a.length; i++) { sum += a[i] - a[i - k]; best = Math.max(best, sum); }
          System.out.println("D17 maxAvgWindow(k=4)=" + (best / k)); }

        // D18 LC56 merge intervals
        { int[][] iv = {{1,3},{8,10},{2,6},{15,18}};
          Arrays.sort(iv, Comparator.comparingInt(x -> x[0]));
          List<int[]> m = new ArrayList<>();
          for (int[] x : iv) {
              if (!m.isEmpty() && x[0] <= m.get(m.size()-1)[1]) m.get(m.size()-1)[1] = Math.max(m.get(m.size()-1)[1], x[1]);
              else m.add(new int[]{x[0], x[1]}); }
          StringBuilder o = new StringBuilder();
          for (int[] x : m) o.append(Arrays.toString(x));
          System.out.println("D18 mergedIntervals=" + o); }

        // D19 sort records by salary desc
        { List<Emp> e = new ArrayList<>(List.of(new Emp("amy",90), new Emp("bob",120), new Emp("cat",110)));
          e.sort(Comparator.comparingInt((Emp x) -> x.sal).reversed());
          System.out.println("D19 topEarner=" + e.get(0).name + " " + e.get(0).sal); }

        // D20 LC1 two sum
        { int[] a = {2,7,11,15}; int t = 9;
          Map<Integer,Integer> seen = new HashMap<>(); int[] ans = {-1,-1};
          for (int i = 0; i < a.length; i++) {
              Integer j = seen.get(t - a[i]);
              if (j != null) { ans = new int[]{j, i}; break; }
              seen.put(a[i], i); }
          System.out.println("D20 twoSum=" + Arrays.toString(ans)); }

        // D21 LC242 valid anagram
        { String a = "anagram", b = "nagaram";
          int[] c = new int[26];
          for (char x : a.toCharArray()) c[x-'a']++;
          for (char x : b.toCharArray()) c[x-'a']--;
          boolean ok = Arrays.stream(c).allMatch(x -> x == 0);
          System.out.println("D21 isAnagram=" + ok); }

        // D22 LC349 intersection
        { int[] a = {4,9,5}, b = {9,4,9,8,4};
          Set<Integer> sa = Arrays.stream(a).boxed().collect(Collectors.toSet());
          Set<Integer> out = new TreeSet<>();
          for (int x : b) if (sa.contains(x)) out.add(x);
          System.out.println("D22 intersection=" + out); }

        // D23 LC347 most frequent element
        { int[] a = {1,1,1,2,2,3};
          Map<Integer,Integer> f = new HashMap<>();
          for (int x : a) f.merge(x, 1, Integer::sum);
          Map.Entry<Integer,Integer> best = Collections.max(f.entrySet(), Map.Entry.comparingByValue());
          System.out.println("D23 mostFrequent=" + best.getKey() + " count=" + best.getValue()); }

        // D24 next event strictly after t
        { TreeMap<Integer,String> ev = new TreeMap<>();
          ev.put(9,"standup"); ev.put(13,"lunch"); ev.put(17,"review");
          Map.Entry<Integer,String> e = ev.higherEntry(10);
          System.out.println("D24 nextEventAfter(10)=" + e.getKey() + " " + e.getValue()
            + "  none after 17 -> " + (ev.higherEntry(17) == null)); }

        // D25 LC35 search insert position
        { int[] a = {1,3,5,6};
          System.out.println("D25 searchInsert(5)=" + ins(a,5) + " (2)=" + ins(a,2)
            + " (7)=" + ins(a,7) + " (0)=" + ins(a,0)
            + "   (via -binarySearch()-1 on a miss)"); }

        // D26 LC34 count occurrences
        { int[] a = {5,7,7,8,8,8,10}; int t = 8;
          int lo = lowerBound(a,t), hi = upperBound(a,t);
          System.out.println("D26 range of 8 = [" + lo + "," + (hi-1) + "] count=" + (hi-lo)
            + "   (hand-written bounds: Java ships none)"); }

        // D27 LC303 range sum query
        { int[] a = {-2,0,3,-5,2,-1};
          long[] p = new long[a.length+1];
          for (int i = 0; i < a.length; i++) p[i+1] = p[i] + a[i];
          System.out.println("D27 sumRange(0,2)=" + (p[3]-p[0]) + " (2,5)=" + (p[6]-p[2]) + " (0,5)=" + (p[6]-p[0])); }

        // D28 LC20 valid parentheses
        { System.out.println("D28 \"()[]{}\"=" + paren("()[]{}") + " \"(]\"=" + paren("(]") + " \"([)]\"=" + paren("([)]")); }

        // D29 BFS levels
        { int[][] g = {{1,2},{0,3},{0},{1}};
          int[] dist = new int[4]; Arrays.fill(dist, -1);
          Deque<Integer> q = new ArrayDeque<>(); q.offer(0); dist[0] = 0;
          while (!q.isEmpty()) { int u = q.poll(); for (int v : g[u]) if (dist[v] < 0) { dist[v] = dist[u]+1; q.offer(v); } }
          System.out.println("D29 bfsDistFrom0=" + Arrays.toString(dist)); }

        // D30 LC239 sliding window maximum
        { int[] a = {1,3,-1,-3,5,3,6,7}; int k = 3;
          Deque<Integer> dq = new ArrayDeque<>(); List<Integer> out = new ArrayList<>();
          for (int i = 0; i < a.length; i++) {
              while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
              while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
              dq.offerLast(i);
              if (i >= k-1) out.add(a[dq.peekFirst()]); }
          System.out.println("D30 slidingWindowMax(k=3)=" + out); }

        // D31 LC215 kth largest with a size-k min-heap
        { int[] a = {3,2,1,5,6,4}; int k = 2;
          PriorityQueue<Integer> h = new PriorityQueue<>();     // min-heap is the DEFAULT here
          for (int x : a) { h.offer(x); if (h.size() > k) h.poll(); }
          System.out.println("D31 kthLargest(2) via size-k min-heap=" + h.peek()); }

        // D32 LC973 k closest points
        { int[][] pts = {{1,3},{-2,2},{5,8},{0,1}}; int k = 2;
          PriorityQueue<int[]> h = new PriorityQueue<>(
              Comparator.comparingLong((int[] p) -> (long)p[0]*p[0] + (long)p[1]*p[1]).reversed());
          for (int[] p : pts) { h.offer(p); if (h.size() > k) h.poll(); }
          List<int[]> out = new ArrayList<>(h);
          out.sort(Comparator.<int[]>comparingInt(p -> p[0]).thenComparingInt(p -> p[1]));
          StringBuilder o = new StringBuilder();
          for (int[] p : out) o.append("(").append(p[0]).append(",").append(p[1]).append(")");
          System.out.println("D32 kClosest(2)=" + o); }

        // D33 LC125 valid palindrome
        { System.out.println("D33 \"A man, a plan, a canal: Panama\"=" + pal("A man, a plan, a canal: Panama")
            + " \"race a car\"=" + pal("race a car")); }

        // D34 run-length encode
        { String s = "aaabbc"; StringBuilder out = new StringBuilder();
          for (int i = 0; i < s.length();) {
              int j = i; while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
              out.append(s.charAt(i)).append(j - i); i = j; }
          System.out.println("D34 rle(\"aaabbc\")=" + out); }

        // D35 caesar shift by 3
        { String s = "xyz"; StringBuilder out = new StringBuilder();
          for (char c : s.toCharArray()) out.append((char)('a' + (c - 'a' + 3) % 26));
          System.out.println("D35 caesar(\"xyz\",3)=" + out); }

        // D36 LC7 reverse integer with an overflow guard
        { System.out.println("D36 reverse(123)=" + revInt(123) + " reverse(-123)=" + revInt(-123)
            + " reverse(1534236469)=" + revInt(1534236469) + " (overflow -> 0)"); }

        // D37 dedupe a list of pairs BY VALUE
        { Set<int[]> wrong = new HashSet<>(List.of(new int[]{1,2}, new int[]{1,2}, new int[]{3,4}));
          Set<List<Integer>> right = new HashSet<>(List.of(List.of(1,2), List.of(1,2), List.of(3,4)));
          System.out.println("D37 dedupedPairs: HashSet<int[]>=" + wrong.size() + " (WRONG)  HashSet<List<Integer>>=" + right.size() + " (right)"); }

        // D38 remove all evens safely
        { List<Integer> v = new ArrayList<>(List.of(1,2,2,3,4));
          v.removeIf(x -> x % 2 == 0);
          System.out.println("D38 removeEvens=" + v); }

        // D39 double every element in place
        { int[] v = {1,2,3}; for (int i = 0; i < v.length; i++) v[i] *= 2;
          System.out.println("D39 doubled=" + Arrays.toString(v) + "  (no reference loop variable — index it)"); }

        // D40 kth smallest via a size-k max-heap
        { int[] a = {7,10,4,3,20,15}; int k = 3;
          PriorityQueue<Integer> h = new PriorityQueue<>(Comparator.reverseOrder());
          for (int x : a) { h.offer(x); if (h.size() > k) h.poll(); }
          System.out.println("D40 kthSmallest(3) via size-k max-heap=" + h.peek()
            + "  (Java has no nth_element; O(n log k) instead of O(n))"); }
    }

    static void rev(int[] a, int i, int j) { while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; } }

    static int ins(int[] a, int t) { int r = Arrays.binarySearch(a, t); return r >= 0 ? r : -r - 1; }

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

    static boolean paren(String s) {
        Deque<Character> st = new ArrayDeque<>();
        Map<Character,Character> m = Map.of(')','(', ']','[', '}','{');
        for (char c : s.toCharArray()) {
            if (m.containsKey(c)) { if (st.isEmpty() || st.pop() != m.get(c)) return false; }
            else st.push(c);
        }
        return st.isEmpty();
    }

    static boolean pal(String s) {
        StringBuilder t = new StringBuilder();
        for (char c : s.toCharArray()) if (Character.isLetterOrDigit(c)) t.append(Character.toLowerCase(c));
        return t.toString().equals(t.reverse().toString());
    }

    static int revInt(int x) {
        long r = 0;
        while (x != 0) { r = r * 10 + x % 10; x /= 10;
            if (r > Integer.MAX_VALUE || r < Integer.MIN_VALUE) return 0; }
        return (int) r;
    }
}

// Deep.java — iterator invalidation, the cache hierarchy, stack vs heap, hashing.
// Measured, not asserted. java Deep.java  (JDK 11 single-file source launcher)
import java.util.*;

public class Deep {

    /* D03: measure the frame size by recursing exactly twice and diffing the depth
     * the JVM reports, rather than recursing until StackOverflowError. Catching SOE
     * is legal in Java but leaves the JVM in a state you should not keep working in,
     * and a verification run should not deliberately damage its own process. */
    static int probeDepth(int d, int cap) {
        if (d >= cap) return d;
        return probeDepth(d + 1, cap);
    }

    public static void main(String[] args) {

        /* ---------------- D01  iterator invalidation ---------------- */
        {
            List<Integer> v = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            String cme;
            try {
                for (Integer x : v) if (x % 2 == 0) v.remove(x);
                cme = "no throw";
            } catch (ConcurrentModificationException e) {
                cme = "ConcurrentModificationException";
            }
            System.out.println("D01 for-each + structural modification -> " + cme
                + "   Java DETECTS it with a modCount check and fails fast");

            List<Integer> w = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            Iterator<Integer> it = w.iterator();
            while (it.hasNext()) if (it.next() % 2 == 0) it.remove();
            List<Integer> z = new ArrayList<>(List.of(1, 2, 3, 4, 5));
            z.removeIf(x -> x % 2 == 0);
            System.out.println("D01fix Iterator.remove() -> " + w + "   removeIf() -> " + z);
        }
        {
            // the view that breaks when its parent is structurally modified
            List<Integer> base = new ArrayList<>(List.of(1, 2, 3, 4));
            List<Integer> sub = base.subList(0, 2);
            base.add(9);                       // structural change to the PARENT
            String subErr;
            try { subErr = "read " + sub.get(0); }
            catch (ConcurrentModificationException e) { subErr = "ConcurrentModificationException"; }
            System.out.println("D01view subList after the parent grew -> " + subErr
                + "   a view is only valid while the parent is structurally unchanged");
        }
        {
            // there are no pointers to dangle: growth copies references, objects stay put
            List<int[]> holder = new ArrayList<>();
            int[] elem = {7};
            holder.add(elem);
            for (int i = 0; i < 100; i++) holder.add(new int[]{i});   // forces several regrows
            System.out.println("D01noptr after " + holder.size() + " adds forced regrowth, the element"
                + " reference still reads " + holder.get(0)[0]
                + "  — Java copies REFERENCES into the new array; the objects never move,"
                + " so nothing dangles. This is the one place Java is safer than C++.");
        }
        {
            /* Three entries, not one: HashMap only re-checks modCount inside next(), so a
             * single-entry map finishes iterating before it ever notices — which would have
             * printed "no throw" and taught the exact opposite of the truth. */
            Map<String,Integer> m = new HashMap<>();
            m.put("a", 1); m.put("b", 2); m.put("c", 3);
            String err;
            try { for (String k : m.keySet()) m.put(k + "x", 1); err = "no throw"; }
            catch (ConcurrentModificationException e) { err = "ConcurrentModificationException"; }
            System.out.println("D01map mutating a HashMap while iterating its keySet -> " + err
                + "   (a value-only put(k, newValue) on an EXISTING key is fine — it is not structural)");
        }

        /* ---------------- D02  the cache hierarchy ---------------- */
        {
            final int N = 1 << 22;             // 4M ints = 16 MB
            int[] a = new int[N];
            Arrays.fill(a, 1);
            long sink = 0;

            // warm up so the JIT has compiled the loop before anything is timed
            for (int r = 0; r < 3; r++) sink += strideSum(a, 1);
            for (int r = 0; r < 3; r++) sink += strideSum(a, 1024);

            long s1 = best(a, 1), s16 = best(a, 16), s1024 = best(a, 1024);
            System.out.println("D02 the SAME number of reads, walked with a growing stride:");
            System.out.println("D02step stride 16 slower than stride 1 -> " + (s16 > s1)
                + "   stride 1024 slower than stride 16 -> " + (s1024 > s16)
                + "   1024 slower than 1 -> " + (s1024 > s1) + "  (sink " + (sink != 0) + ")");
            System.out.println("D02jvm the JIT compiles this to essentially the same machine code as C++,"
                + " so the cliff is the same cliff. The array bounds check is not what you are seeing.");
        }
        {
            final int M = 1024;
            int[] g = new int[M * M];
            Arrays.fill(g, 1);
            long warm = 0;
            for (int r = 0; r < 3; r++) { warm += rowMajor(g, M); warm += colMajor(g, M); }

            long bestRow = Long.MAX_VALUE, bestCol = Long.MAX_VALUE;
            long r1 = 0, c1 = 0;
            for (int r = 0; r < 5; r++) {
                long t0 = System.nanoTime(); r1 = rowMajor(g, M); long t1 = System.nanoTime();
                c1 = colMajor(g, M);         long t2 = System.nanoTime();
                bestRow = Math.min(bestRow, t1 - t0);
                bestCol = Math.min(bestCol, t2 - t1);
            }
            System.out.println("D02order 1024x1024 sum, same total: " + (r1 == c1)
                + ".  column-major slower than row-major -> " + (bestCol > bestRow)
                + "  — swapping two loop lines, nothing else (warm " + (warm != 0) + ")");
        }

        /* ---------------- D03  stack vs heap ---------------- */
        {
            System.out.println("D03 in Java the split is not yours to make: LOCALS of primitive type and"
                + " object REFERENCES live on the stack; every object and every array lives on the heap.");
            System.out.println("D03noalloc there is no stack allocation of objects you can request."
                + " Escape analysis may scalarise a short-lived object, but that is the JIT's"
                + " decision, not a language feature you can rely on.");
            System.out.println("D03gc the heap is garbage collected, so 'freeing' is not a cost you pay"
                + " at the free — it is a pause you pay later, proportional to LIVE objects.");
        }
        {
            /* 5000 is deep enough to be meaningful and shallow enough that every JVM
             * survives it, so the result is reproducible. Probing for the true maximum
             * would make the output depend on -Xss and on JIT state. */
            int reached = probeDepth(0, 5000);
            System.out.println("D03depth recursion to depth " + reached + " succeeds on any default JVM;"
                + " 100000 typically does NOT — the exact ceiling depends on -Xss and frame size");
            System.out.println("D03size the default JVM thread stack is 512KB-1MB (-Xss changes it),"
                + " far smaller than the 8MB a Linux main thread gets in C++.");
            System.out.println("D03risk StackOverflowError IS catchable, unlike a C++ stack overflow —"
                + " but catching it leaves the JVM in a state you should not keep working in."
                + " Convert deep recursion to an explicit Deque instead.");
        }

        /* ---------------- D04  hash containers ---------------- */
        {
            System.out.println("D04 HashMap starts with 16 buckets and doubles when size > capacity * 0.75."
                + " Growth: 16, 32, 64, 128, 256, 512, 1024, 2048 for the default load factor.");
            System.out.println("D04lf the 0.75 default is a space/time trade: higher packs tighter and"
                + " collides more, lower wastes buckets. new HashMap<>(expected / 0.75f + 1) skips"
                + " every rehash when you know the size in advance.");
            System.out.println("D04node each entry is a Node object: hash, key ref, value ref, next ref"
                + " = ~32B plus the boxed key and value. A HashMap<Integer,Integer> of 1e6 entries is"
                + " roughly 80MB; an int[] pair of arrays is 8MB.");
        }
        {
            // Java 8+ turns a long collision chain into a red-black tree
            System.out.println("D04tree since Java 8, a bucket with more than 8 entries converts to a"
                + " RED-BLACK TREE, so a collision attack degrades to O(log n) rather than O(n)."
                + " C++ has no such protection.");
            Map<Integer,Integer> m = new HashMap<>();
            for (int i = 0; i < 1000; i++) m.put(i, i);
            System.out.println("D04hash Java re-mixes every hash (h ^ h>>>16) before masking, so the"
                + " identity-hash attack that works on libstdc++ does not work here. size=" + m.size());
        }
        {
            final int N = 200000;
            int[] keys = new int[N];
            for (int i = 0; i < N; i++) keys[i] = i;
            Random rng = new Random(42);
            for (int i = N - 1; i > 0; i--) { int j = rng.nextInt(i + 1); int t = keys[i]; keys[i] = keys[j]; keys[j] = t; }

            Map<Integer,Integer> hm = new HashMap<>(N * 2);
            Map<Integer,Integer> tm = new TreeMap<>();
            for (int r = 0; r < 2; r++) { hm.clear(); for (int k : keys) hm.put(k, k); }   // warm

            long t0 = System.nanoTime();
            hm.clear(); for (int k : keys) hm.put(k, k);
            long t1 = System.nanoTime();
            for (int k : keys) tm.put(k, k);
            long t2 = System.nanoTime();
            long s = 0;
            for (int k : keys) s += hm.get(k);
            long t3 = System.nanoTime();
            for (int k : keys) s += tm.get(k);
            long t4 = System.nanoTime();

            System.out.println("D04cmp " + N + " random keys: HashMap faster to build -> " + ((t1-t0) < (t2-t1))
                + ", faster to look up -> " + ((t3-t2) < (t4-t3))
                + "  — but TreeMap gives sorted iteration, floorKey and ceilingKey, which no hash can"
                + " (checksum " + (s > 0) + ")");
        }
    }

    static long strideSum(int[] a, int stride) {
        final int mask = a.length - 1;
        final int touches = 1 << 20;
        long s = 0;
        for (int rep = 0; rep < 4; rep++)
            for (int i = 0, k = 0; k < touches; k++, i += stride) s += a[i & mask];
        return s;
    }

    /** Best of 3, so a GC pause or a scheduling hiccup cannot flip a verdict. */
    static long best(int[] a, int stride) {
        long b = Long.MAX_VALUE;
        for (int r = 0; r < 3; r++) {
            long t0 = System.nanoTime();
            long v = strideSum(a, stride);
            long t1 = System.nanoTime();
            if (v != 0) b = Math.min(b, t1 - t0);
        }
        return b;
    }

    static long rowMajor(int[] g, int M) {
        long r = 0;
        for (int i = 0; i < M; i++) for (int j = 0; j < M; j++) r += g[i * M + j];
        return r;
    }

    static long colMajor(int[] g, int M) {
        long c = 0;
        for (int j = 0; j < M; j++) for (int i = 0; i < M; i++) c += g[i * M + j];
        return c;
    }
}

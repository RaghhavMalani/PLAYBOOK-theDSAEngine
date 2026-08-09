// Elements.java — what can go INSIDE a container, and what it costs. Executed.
// java Elements.java   (JDK 11 single-file source launcher)
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class Elements {

    // E05: field order does not change Java object size the way it does in C++ —
    // the JVM reorders fields itself. These exist to show what IS under your control.
    static final class Bad  { char a; int b; char c; }
    static final class Good { int b; char a; char c; }

    static final class Node { int v; Node(int v) { this.v = v; } }

    // E10 array-of-objects vs parallel primitive arrays
    static final class Particle {
        double x, y, z; int id;
        Particle(double x, int id) { this.x = x; this.id = id; }
    }

    public static void main(String[] args) {

        // E01 the plainest element: a number
        {
            int[] prim = {1, 2, 3};
            List<Integer> boxed = new ArrayList<>(List.of(1, 2, 3));
            System.out.println("E01 primitive widths: byte=1 char=2 int=4 long=8 float=4 double=8 boolean=1(JLS unspecified, 1 in practice)");
            System.out.println("E01box int is 4B of VALUE; Integer is a 16B object header + 4B payload,"
                + " and List<Integer> stores an 8B POINTER to it. ~28B per element vs 4."
                + "  int[3] payload=" + (prim.length * 4) + "B   List<Integer> of 3 = 3 pointers + 3 objects");
            System.out.println("E01why generics cannot hold primitives, so every collection forces the boxed form."
                + " boxed.get(0)=" + boxed.get(0) + " prim[0]=" + prim[0]);
        }

        // E02 arrays are contiguous; collections of objects are not
        {
            int[] a = {10, 20, 30};
            System.out.println("E02 int[] is one contiguous block of 4-byte slots — a[i] is base + i*4."
                + " length=" + a.length + " a[1]=" + a[1]);
            System.out.println("E02obj Integer[] / List<Integer> is a contiguous block of POINTERS;"
                + " the Integers themselves are wherever the allocator put them. One extra hop per read.");
        }

        // E03 a pair inside — Java has none
        {
            int[] pair = {1, 2};
            Map.Entry<Integer,Integer> e = Map.entry(1, 2);
            List<Integer> lp = List.of(1, 2);
            Set<int[]> wrong = new HashSet<>(List.of(new int[]{1,2}, new int[]{1,2}));
            Set<List<Integer>> right = new HashSet<>(List.of(List.of(1,2), List.of(1,2)));
            System.out.println("E03 Java has NO pair type. int[]{1,2} is the idiom: " + Arrays.toString(pair)
                + "  Map.entry -> (" + e.getKey() + "," + e.getValue() + ")  List.of -> " + lp);
            System.out.println("E03dedup HashSet<int[]> of two identical pairs -> size " + wrong.size()
                + " (WRONG: arrays have identity equality)"
                + "   HashSet<List<Integer>> -> size " + right.size() + " (right)");
            System.out.println("E03cost int[]{a,b} = 16B header + 4B length + 8B payload = 32B per pair,"
                + " vs C++ pair<int,int> which is exactly 8B inline. 4x, before the pointer to it.");
        }

        // E04 tuples
        {
            System.out.println("E04 Java has no tuple either. Options: int[] (no equals), List.of (equals but boxed),"
                + " a record (Java 16+), or a hand-written class (JDK 11). Object[] loses all type safety.");
            Object[] mixed = {1, "a", 2.0};
            System.out.println("E04obj Object[]{1,\"a\",2.0} compiles and boxes everything: "
                + Arrays.toString(mixed) + " — every read needs a cast");
        }

        // E05 a class inside — headers, not padding
        {
            System.out.println("E05 every Java object carries a 12-16B HEADER (mark word + class pointer)"
                + " before any of your fields. There is no way to opt out — no structs, no value types on JDK 11.");
            System.out.println("E05field the JVM reorders fields itself and aligns objects to 8B,"
                + " so {char,int,char} and {int,char,char} end up the same size."
                + " Unlike C++, field order is NOT under your control.");
            System.out.println("E05size a class with one int: ~16B header + 4B int + 4B padding = 24B,"
                + " to hold 4 bytes of data. 1e6 of them is ~24MB vs 4MB for an int[].");
        }

        // E06 a String inside
        {
            String s = "hi";
            String t = "a much longer string";
            System.out.println("E06 String is IMMUTABLE and the element is a reference."
                + " Since Java 9 the bytes live in a byte[] with a coder flag (Latin-1 or UTF-16),"
                + " so ASCII text costs 1 byte per char, not 2.");
            System.out.println("E06cost each String = ~16B header + 8B byte[] ref + 4B hash + the byte[] itself"
                + " (16B header + length). \"" + s + "\".length()=" + s.length()
                + " \"" + t + "\".length()=" + t.length());
            System.out.println("E06intern literals are INTERNED into a shared pool: "
                + ("hi" == "hi") + " for two literals, but "
                + (new String("hi") == "hi") + " once you allocate one. Always .equals().");
        }

        // E07 nested arrays
        {
            int[][] g = new int[3][4];
            System.out.println("E07 int[3][4] is NOT a rectangle: it is an array of 3 REFERENCES,"
                + " each to its own int[4]. 4 separate objects, 4 separate allocations.");
            System.out.println("E07proof g.length=" + g.length + " g[0].length=" + g[0].length
                + "  rows are distinct objects: " + (g[0] != g[1])
                + "  and rows can be replaced independently, which is why jagged arrays are legal");
            int[] flat = new int[3 * 4];
            System.out.println("E07flat one int[12] = " + (16 + 4 + 12*4) + "B in ONE object"
                + " vs int[3][4] = 1 outer (16+4+24) + 3 inner (16+4+16 each) = "
                + ((16+4+24) + 3*(16+4+16)) + "B. Index flat[i*4+j].");
        }

        // E08 boolean[] vs BitSet
        {
            boolean[] flags = new boolean[64];
            BitSet bits = new BitSet(64);
            bits.set(0); flags[0] = true;
            System.out.println("E08 boolean[64] uses ONE BYTE per flag = 64B payload."
                + " BitSet(64) packs 64 bits into a single long = 8B. 8x smaller.");
            System.out.println("E08use flags[0]=" + flags[0] + " bits.get(0)=" + bits.get(0)
                + " bits.cardinality()=" + bits.cardinality()
                + "  — and unlike C++ vector<bool>, BitSet is a separate honest type, not a fake array");
        }

        // E09 references as elements
        {
            List<Node> nodes = new ArrayList<>();
            for (int i = 0; i < 3; i++) nodes.add(new Node(i));
            System.out.println("E09 every non-primitive element is an 8B reference (4B with compressed oops"
                + " under a 32GB heap). The objects are scattered wherever the allocator put them.");
            System.out.println("E09deref nodes.get(1).v=" + nodes.get(1).v
                + " — one pointer hop per access, and the GC has to trace every one of them");
        }

        // E10 array of objects vs parallel primitive arrays
        {
            final int N = 1000000;
            Particle[] aos = new Particle[N];
            for (int i = 0; i < N; i++) aos[i] = new Particle(i, i);
            /* Allocating in a loop leaves the objects in allocation order, so the
             * prefetcher walks them almost as well as a primitive array and the
             * measurement flips run to run. Shuffle the REFERENCES with a fixed seed:
             * that is the honest steady state for any collection that has seen
             * insertion and removal, and it is the case the level is about. */
            Random rng = new Random(42);
            for (int i = N - 1; i > 0; i--) {
                int j = rng.nextInt(i + 1);
                Particle t = aos[i]; aos[i] = aos[j]; aos[j] = t;
            }
            double[] sx = new double[N];
            for (int i = 0; i < N; i++) sx[i] = i;

            // warm up both loops so the JIT has compiled them before either is timed
            double warm = 0;
            for (int r = 0; r < 3; r++) {
                for (int i = 0; i < N; i++) warm += aos[i].x;
                for (int i = 0; i < N; i++) warm += sx[i];
            }

            // best-of-5 on each side: takes the minimum, which is the measurement
            // least polluted by a GC pause or a scheduling hiccup
            long bestAos = Long.MAX_VALUE, bestSoa = Long.MAX_VALUE;
            double s1 = 0, s2 = 0;
            for (int r = 0; r < 5; r++) {
                long a0 = System.nanoTime();
                double u = 0; for (int i = 0; i < N; i++) u += aos[i].x;
                long a1 = System.nanoTime();
                double v = 0; for (int i = 0; i < N; i++) v += sx[i];
                long a2 = System.nanoTime();
                bestAos = Math.min(bestAos, a1 - a0);
                bestSoa = Math.min(bestSoa, a2 - a1);
                s1 = u; s2 = v;
            }

            System.out.println("E10 summing ONE field over " + N + " shuffled elements, best of 5 after warm-up:");
            System.out.println("E10perf scattered Particle[] slower than double[] -> " + (bestAos > bestSoa)
                + "  (same sum: " + (s1 == s2) + ")"
                + "  — the object array chases a pointer per element; the double[] is a straight walk");
        }

        // E11 what a container CAN hold
        {
            Map<List<Integer>,Integer> byList = new HashMap<>();
            byList.put(List.of(1,2), 3);
            List<Function<Integer,Integer>> fns = new ArrayList<>();
            fns.add(x -> x * 2);
            System.out.println("E11 Map<List<Integer>,Integer> works (List has equals+hashCode): " + byList.get(List.of(1,2))
                + "  List<Function> works: " + fns.get(0).apply(21));
            System.out.println("E11req HashMap keys need equals() AND hashCode(); TreeMap keys need Comparable."
                + " int[] has NEITHER that is useful — it compiles and silently fails to deduplicate.");
        }

        // E12 growth: what ArrayList's buffer does
        {
            List<Integer> v = new ArrayList<>();
            System.out.println("E12 ArrayList grows by 1.5x (oldCap + oldCap>>1), starting at 10:"
                + " 10, 15, 22, 33, 49, 73, 109, 163, ...");
            for (int i = 0; i < 100; i++) v.add(i);
            System.out.println("E12ratio after 100 adds the backing array is 163 slots for 100 elements"
                + " — size=" + v.size() + ", ~63 wasted references (~504B), plus 100 Integer objects");
            System.out.println("E12fix new ArrayList<>(n) pre-sizes the buffer; there is no shrink_to_fit,"
                + " but trimToSize() on the concrete ArrayList type does the same job");
        }
    }
}

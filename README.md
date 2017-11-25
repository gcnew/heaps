
## TypeScript implementation of several heap data structures

### Implemented data structures

 - [Binary heap](src/mutable/bin_heap.ts)<sup>[[1]](#references)</sup> - mutable, array backed
 - [Pairing heap](src/persistent/pairing_heap.ts)<sup>[[2]](#references)</sup> - persistent, has very good real-world performance
 - [Leftist heap](src/persistent/leftist_heap.ts)<sup>[[3]](#references)</sup> - persistent, left biased tree
 - [Skew heap](src/persistent/skew_heap.ts)<sup>[[4]](#references)</sup> - persistent, reminiscent of Leftist Tree, but doesn't use ranks and has better merge performance
 - [Binomial heap](src/persistent/binomial_heap.ts)<sup>[[5]](#references)</sup> - persistent, uses array as subtree storage
 - [Finger Heap](src/persistent/finger_heap.ts) - persistent, uses Finger Tree as storage
 - [Finger Vector](src/persistent/finger_vector.ts) - persistent, uses Finger Tree as storage
 - [Finger Tree](src/persistent/finger_tree.ts) <sup>[[6]](#references)[[7]](#references)</sup> - persistent, amortised O(1) dequeue operations, efficient split/concatenation  
 Note: This implementation uses a strict spine. This means that the cost of the amortised operations is payed upfront and when that happens, the triggering operation pays the full O(log n) cost. However, the amortised complexities still hold, unless a bad data structure is purposefully reused multiple times.
 - [Weight-Balanced Tree](src/persistent/weight_balanced_tree.ts)<sup>[[8]](#references)[[9]](#references)[[10]](#references)</sup> - persistent, ordered, Map interface


### A note on implementation

All implementations assume a min heap. This is not a problem, however, because all heap constructors require a comparator to be provided.
To derive a max heap, simply invert the comparator.

### References

1. https://en.wikipedia.org/wiki/Binary_heap
2. https://en.wikipedia.org/wiki/Pairing_heap
3. https://en.wikipedia.org/wiki/Leftist_tree
4. https://en.wikipedia.org/wiki/Skew_heap
5. https://en.wikipedia.org/wiki/Binomial_heap
6. https://en.wikipedia.org/wiki/Finger_tree
7. http://www.staff.city.ac.uk/~ross/papers/FingerTree.html
8. http://www.mew.org/~kazu/proj/weight-balanced-tree/
9. https://hackage.haskell.org/package/containers-0.5.10.2/docs/Data-Map-Lazy.html
10. https://en.wikipedia.org/wiki/Weight-balanced_tree


## TypeScript implementation of several heap data structures

### Implemented data structures

 - [Binary heap](https://en.wikipedia.org/wiki/Binary_heap) - mutable, array backed
 - [Pairing heap](https://en.wikipedia.org/wiki/Pairing_heap) - persistent, has very good real-world performance
 - [Leftist heap](https://en.wikipedia.org/wiki/Leftist_tree) - persistent, left biased tree
 - [Skew heap](https://en.wikipedia.org/wiki/Skew_heap) - persistent, reminiscent of Leftist Tree, but doesn't use ranks and has better merge performance
 - [Binomial heap](https://en.wikipedia.org/wiki/Binomial_heap) - persistent, uses array as subtree storage
 - Finger Heap - persistent, uses Finger Tree as storage
 - Finger Vector - persistent, uses Finger Tree as storage
 - [Finger Tree](https://en.wikipedia.org/wiki/Finger_tree) [[1]](References) - persistent, amortised O(1) dequeue operations, efficient split/concatenation  
 Note: This implementation uses a strict spine. This means that the cost of the amortised operations is payed upfront and when that happens, the triggering operation pays the full O(log n) cost. However, the amortised complexities still hold, unless a bad data structure is purposefully reused multiple times.


### A note on implementation

All implementations assume a min heap. This is not a problem, however, because all heap constructors require a comparator to be provided.
To derive a max heap, simply invert the comparator.

### References

1. http://www.staff.city.ac.uk/~ross/papers/FingerTree.html

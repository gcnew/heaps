
## TypeScript implementation of several heap data structures

### Implemented data structures

 - [Binary heap](https://en.wikipedia.org/wiki/Binary_heap) - mutable, array backed
 - [Pairing heap](https://en.wikipedia.org/wiki/Pairing_heap) - persistent, has very good real-world performance
 - [Leftist heap](https://en.wikipedia.org/wiki/Leftist_tree) - persistent, left biased tree
 - [Skew heap](https://en.wikipedia.org/wiki/Skew_heap) - persistent, reminiscent of Leftist Tree, but doesn't use ranks and has better merge performance
 - [Binomial heap](https://en.wikipedia.org/wiki/Binomial_heap) - persistent, uses array as subtree storage


### A note on implementation

All implementations assume a min heap. This is not a problem, however, because all heap constructors require a comparator to be provided.
To derive a max heap, simply invert the comparator.

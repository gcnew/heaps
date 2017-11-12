
import { testHeap } from '../heap_suite'

import { BinomialHeap } from '../../src/persistent/binomial_heap'
import * as BinomialHeapDict from '../../src/persistent/binomial_heap'

testHeap<BinomialHeap<number>>('BinomialHeap', true, BinomialHeapDict);

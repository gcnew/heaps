
import { testHeap } from '../heap_suite'

import { SkewHeap } from '../../src/persistent/skew_heap'
import * as SkewHeapDict from '../../src/persistent/skew_heap'

testHeap<SkewHeap<number>>('SkewHeap', true, SkewHeapDict);

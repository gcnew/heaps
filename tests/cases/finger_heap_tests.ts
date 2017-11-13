
import { testHeap } from '../heap_suite'

import { FingerHeap } from '../../src/persistent/finger_heap'
import * as FingerHeapDict from '../../src/persistent/finger_heap'

testHeap<FingerHeap<number>>('FingerHeap', true, FingerHeapDict);

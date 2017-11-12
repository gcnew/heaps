
import { testHeap } from '../heap_suite'

import { LeftistHeap } from '../../src/persistent/leftist_heap'
import * as LeftistHeapDict from '../../src/persistent/leftist_heap'

testHeap<LeftistHeap<number>>('LeftistHeap', true, LeftistHeapDict);


import { testHeap } from '../heap_suite'

import { PairingHeap } from '../../src/persistent/pairing_heap'
import * as PairingHeapDict from '../../src/persistent/pairing_heap'

testHeap<PairingHeap<number>>('PairingHeap', true, PairingHeapDict);

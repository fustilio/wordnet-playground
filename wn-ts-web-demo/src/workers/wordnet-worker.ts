/**
 * WordNet Worker for wn-ts-web-demo
 * 
 * This worker simply imports and exposes the production worker from wn-ts-web
 * via Comlink for the main thread. No duplicate logic - everything comes from
 * the main library.
 */

import { expose } from 'comlink';
import * as wnWorker from '../../../wn-ts-web/dist/client/utils/worker-factory';

// Expose all the worker functions via Comlink
expose(wnWorker);

import type { Clock } from '../application';

export class SystemClock implements Clock {
  today(): Date {
    return new Date();
  }
}

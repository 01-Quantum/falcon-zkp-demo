import { TestBed } from '@angular/core/testing';

import { Zkp } from './zkp';

describe('Zkp', () => {
  let service: Zkp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Zkp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

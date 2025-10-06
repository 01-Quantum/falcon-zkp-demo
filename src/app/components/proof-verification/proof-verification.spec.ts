import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProofVerification } from './proof-verification';

describe('ProofVerification', () => {
  let component: ProofVerification;
  let fixture: ComponentFixture<ProofVerification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProofVerification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProofVerification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

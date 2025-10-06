import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProofGeneration } from './proof-generation';

describe('ProofGeneration', () => {
  let component: ProofGeneration;
  let fixture: ComponentFixture<ProofGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProofGeneration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProofGeneration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

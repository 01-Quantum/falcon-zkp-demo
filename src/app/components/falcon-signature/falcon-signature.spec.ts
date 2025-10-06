import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FalconSignatureComponent } from './falcon-signature';

describe('FalconSignatureComponent', () => {
  let component: FalconSignatureComponent;
  let fixture: ComponentFixture<FalconSignatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FalconSignatureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FalconSignatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


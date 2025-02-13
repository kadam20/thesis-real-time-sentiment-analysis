import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectionMapComponent } from './election-map.component';

describe('ElectionMapComponent', () => {
  let component: ElectionMapComponent;
  let fixture: ComponentFixture<ElectionMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectionMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElectionMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

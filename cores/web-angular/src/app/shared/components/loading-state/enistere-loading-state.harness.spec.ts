import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { EnistereLoadingStateComponent } from './enistere-loading-state.component';

describe('EnistereLoadingStateComponent MatProgressSpinnerHarness', () => {
  let fixture: ComponentFixture<EnistereLoadingStateComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnistereLoadingStateComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnistereLoadingStateComponent);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('MatProgressSpinnerHarness finds the spinner', async () => {
    const spinner = await loader.getHarness(MatProgressSpinnerHarness);
    expect(spinner).toBeTruthy();
  });

  it('spinner mode is indeterminate', async () => {
    const spinner = await loader.getHarness(MatProgressSpinnerHarness);
    expect(await spinner.getMode()).toBe('indeterminate');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent CDK harnesses', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('has exactly two MatFormField harnesses', async () => {
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(fields.length).toBe(2);
  });

  it('first form field label is "Adresse e-mail"', async () => {
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(await fields[0].getLabel()).toBe('Adresse e-mail');
  });

  it('second form field label is "Mot de passe"', async () => {
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(await fields[1].getLabel()).toBe('Mot de passe');
  });

  it('email MatInput has type "email"', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(await inputs[0].getType()).toBe('email');
  });

  it('password MatInput has type "password"', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(await inputs[1].getType()).toBe('password');
  });
});

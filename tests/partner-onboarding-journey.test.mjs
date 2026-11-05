import assert from 'node:assert/strict';
import { nextPartnerOnboardingAction, partnerJourneyMilestones, countPartnerOnboardingProgress } from '../dist/partner-onboarding-journey.js';
const invited={establishmentId:'h1',invitedAt:'2026-10-27'};
assert.equal(nextPartnerOnboardingAction(invited),'activate-account');
const activated={...invited,accountActivatedAt:'2026-10-28'};
assert.equal(nextPartnerOnboardingAction(activated),'confirm-profile');
const profile={...activated,profileConfirmedAt:'2026-10-28'};
assert.equal(nextPartnerOnboardingAction(profile),'create-widget');
const widget={...profile,widgetCreatedAt:'2026-10-28',widgetId:'widget1'};
assert.equal(nextPartnerOnboardingAction(widget),'install-widget');
assert.ok(!partnerJourneyMilestones(widget).includes('widget-installed-verified'));
const installed={...widget,widgetInstalledVerifiedAt:'2026-10-29',widgetVerifiedUrl:'https://example.org/widget'};
assert.equal(nextPartnerOnboardingAction(installed),'complete');
assert.deepEqual(countPartnerOnboardingProgress([invited,activated,profile,widget,installed]),{
 invited:5,activated:4,profilesConfirmed:3,widgetsCreated:2,widgetsInstalledVerified:1,
});
console.log('Partner widget-first onboarding assertions passed');

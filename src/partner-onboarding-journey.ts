/** DNS Partner Hub guided onboarding: shared UI/backend status contract (no persistence). */
export const PARTNER_ONBOARDING_JOURNEY_VERSION = 1 as const;
export type PartnerJourneyMilestone =
  | 'invited' | 'account-activated' | 'profile-confirmed'
  | 'widget-created' | 'widget-installed-verified';
export type LegacyAnswerReview = 'pending' | 'confirmed' | 'corrected' | 'not-applicable';
export interface PartnerImportedAnswer {
  sourceSystem: 'dns-self-evaluation';
  sourceResponseId: string;
  sourceTimestamp: string;
  establishmentId: string;
  criterionOrFieldId: string;
  historicalValue: unknown;
  review: LegacyAnswerReview;
  reviewedAt?: string;
}
export interface PartnerJourney {
  establishmentId: string;
  invitedAt?: string;
  accountActivatedAt?: string;
  profileConfirmedAt?: string;
  widgetCreatedAt?: string;
  widgetId?: string;
  widgetInstalledVerifiedAt?: string;
  widgetVerifiedUrl?: string;
}
export function partnerJourneyMilestones(journey: PartnerJourney): readonly PartnerJourneyMilestone[] {
  const steps: PartnerJourneyMilestone[] = [];
  if (journey.invitedAt) steps.push('invited');
  if (journey.accountActivatedAt) steps.push('account-activated');
  if (journey.profileConfirmedAt) steps.push('profile-confirmed');
  if (journey.widgetCreatedAt && journey.widgetId) steps.push('widget-created');
  if (journey.widgetInstalledVerifiedAt && journey.widgetId && journey.widgetVerifiedUrl) steps.push('widget-installed-verified');
  return steps;
}
export function nextPartnerOnboardingAction(journey: PartnerJourney):
  'activate-account' | 'confirm-profile' | 'create-widget' | 'install-widget' | 'complete' {
  if (!journey.accountActivatedAt) return 'activate-account';
  if (!journey.profileConfirmedAt) return 'confirm-profile';
  if (!journey.widgetCreatedAt || !journey.widgetId) return 'create-widget';
  if (!journey.widgetInstalledVerifiedAt || !journey.widgetVerifiedUrl) return 'install-widget';
  return 'complete';
}
export function countPartnerOnboardingProgress(journeys: readonly PartnerJourney[]) {
  return {
    invited: journeys.filter(j => !!j.invitedAt).length,
    activated: journeys.filter(j => !!j.accountActivatedAt).length,
    profilesConfirmed: journeys.filter(j => !!j.profileConfirmedAt).length,
    widgetsCreated: journeys.filter(j => !!j.widgetCreatedAt && !!j.widgetId).length,
    widgetsInstalledVerified: journeys.filter(j => !!j.widgetInstalledVerifiedAt && !!j.widgetId && !!j.widgetVerifiedUrl).length,
  };
}

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const TARGET_PROJECT_ID = 'dns-core';

function getArg(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value?.slice(prefix.length);
}

async function main() {
  const email = getArg('email')?.trim().toLowerCase();
  const preferredLanguage = getArg('preferred-language') ?? 'de';

  if (!email) {
    throw new Error('Missing --email=<existing Firebase Auth user email>.');
  }

  if (!['de', 'it', 'en'].includes(preferredLanguage)) {
    throw new Error('preferred-language must be de, it or en.');
  }

  const explicitProject =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID;

  if (explicitProject && explicitProject !== TARGET_PROJECT_ID) {
    throw new Error(
      `Refusing to bootstrap project "${explicitProject}". Expected "${TARGET_PROJECT_ID}".`,
    );
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: TARGET_PROJECT_ID,
  });

  const auth = getAuth();
  const db = getFirestore();

  const user = await auth.getUserByEmail(email);

  if (user.disabled) {
    throw new Error(`Firebase Auth user ${email} is disabled.`);
  }

  const ref = db.collection('users').doc(user.uid);
  const current = await ref.get();
  const existingRoles = current.exists
    ? ((current.data()?.globalRoles ?? []) as string[])
    : [];

  const globalRoles = Array.from(new Set([...existingRoles, 'dns-admin']));

  await ref.set(
    {
      id: user.uid,
      active: true,
      preferredLanguage,
      globalRoles,
      updatedAt: FieldValue.serverTimestamp(),
      ...(current.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  console.log(`✓ DNS admin bootstrap complete for ${email}`);
  console.log(`  uid: ${user.uid}`);
  console.log(`  profile: users/${user.uid}`);
  console.log('  globalRoles: dns-admin');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

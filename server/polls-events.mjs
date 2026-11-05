import { randomUUID } from 'node:crypto';

function validText(value, max, required = false) {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}
function validQuestion(q) {
  if (!q || typeof q !== 'object' || Array.isArray(q) ||
      Object.keys(q).some(k => !['id', 'label', 'type', 'required', 'options'].includes(k))) return false;
  if (!validText(q.id, 80, true) || !validText(q.label, 120, true) ||
      !['text', 'select', 'checkbox'].includes(q.type) || typeof q.required !== 'boolean') return false;
  if (q.type === 'select') return Array.isArray(q.options) && q.options.length >= 1 &&
    q.options.length <= 10 && q.options.every(v => validText(v, 120, true));
  return !('options' in q) || q.options === undefined;
}

export function validateNewEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  if (Object.keys(input).some(k => !['title', 'description', 'location', 'startsAt', 'questions'].includes(k)))
    return false;
  if (!validText(input.title, 160, true) || !validText(input.description, 2000) ||
      !validText(input.location, 200) || !validText(input.startsAt, 35, true) ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(input.startsAt) ||
      !Number.isFinite(Date.parse(input.startsAt)) ||
      !Array.isArray(input.questions) || input.questions.length > 8 ||
      !input.questions.every(validQuestion)) return false;
  return new Set(input.questions.map(q => q.id)).size === input.questions.length;
}

export async function listManagedEvents(pollsDb) {
  const snapshot = await pollsDb.collection('events').limit(100).get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Explicit projection: never forward unrecognized fields from Firestore.
    return {
      id: doc.id, title: data.title, description: data.description,
      location: data.location, startsAt: data.startsAt, status: data.status,
      questions: data.questions, createdAt: data.createdAt,
      schemaVersion: data.schemaVersion,
    };
  }).sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));
}

export async function createManagedEvent(pollsDb, data, now = new Date()) {
  if (!validateNewEvent(data)) throw new Error('INVALID_EVENT');
  const event = {
    title: data.title.trim(), description: data.description.trim(), location: data.location.trim(),
    startsAt: data.startsAt, questions: data.questions,
    // No anonymous attendee writes until the organizer explicitly opens the event.
    status: 'closed', schemaVersion: 1, createdAt: now.toISOString(), id: randomUUID(),
  };
  await pollsDb.collection('events').doc(event.id).create(event);
  return event;
}

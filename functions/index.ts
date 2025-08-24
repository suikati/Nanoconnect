import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Recalculate aggregates for a slide when any vote under that slide changes
export const onVoteWrite = functions.database
  .ref('/rooms/{roomId}/votes/{slideId}/{anonId}')
  .onWrite(async (change, context) => {
    const { roomId, slideId } = context.params as { roomId: string; slideId: string; anonId: string };
    const votesRef = admin.database().ref(`/rooms/${roomId}/votes/${slideId}`);
    const aggRef = admin.database().ref(`/rooms/${roomId}/aggregates/${slideId}`);

    const snap = await votesRef.once('value');
    const counts: Record<string, number> = {};
    snap.forEach(child => {
      const v = child.val();
      const choiceId = v?.choiceId;
      if (choiceId) counts[choiceId] = (counts[choiceId] || 0) + 1;
      return false;
    });

    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    await aggRef.set({ counts, total });
    return null;
  });

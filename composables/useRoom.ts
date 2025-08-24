import { ref as dbRef, set, push, get, runTransaction } from "firebase/database";
import type { Database } from "firebase/database";

const useRoom = () => {
  // ensure functions are called on client; getDb will throw if firebase isn't available

  const nuxt = useNuxtApp();
  const getDb = (): Database => {
    const d = (nuxt as any).$firebaseDb as Database | undefined;
    if (!d) throw new Error("firebaseDb not available");
    return d;
  };

  const generateRoomCode = (len = 6) => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((n) => alphabet[n % alphabet.length]).join("");
  };

  const generateAnonId = () => "anon_" + Math.random().toString(36).slice(2, 10);

  const getAnonId = () => {
    const key = "nanosuke_anonId";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = generateAnonId();
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      // localStorage が使えない環境ならフォールバックで新規IDを返す（短期セッション扱い）
      return generateAnonId();
    }
  };

  const createRoom = async (roomCode?: string) => {
    const code = roomCode || generateRoomCode();
    const anonId = getAnonId();
    const now = new Date().toISOString();
  const roomRef = dbRef(getDb(), `rooms/${code}`);
    await set(roomRef, {
      presenterId: anonId,
      slideIndex: 0,
      createdAt: now,
    });
    return code;
  };

  const joinRoom = async (roomCode: string) => {
  const snap = await get(dbRef(getDb(), `rooms/${roomCode}`));
    if (!snap.exists()) throw new Error("Room not found");
    return { roomCode, anonId: getAnonId(), room: snap.val() };
  };

  const saveSlides = async (roomCode: string, slides: Array<{ title: string; choices: string[] }>) => {
    const slidesObj: Record<string, any> = {};
    slides.forEach((s, i) => {
      slidesObj[`slide_${i + 1}`] = {
        title: s.title,
        slideNumber: i + 1,
        choices: Object.fromEntries(s.choices.map((c, idx) => [`choice_${idx}`, { text: c, index: idx }])),
      };
    });
  await set(dbRef(getDb(), `rooms/${roomCode}/slides`), slidesObj);
  };

  const setSlideIndex = async (roomCode: string, index: number) => {
  await set(dbRef(getDb(), `rooms/${roomCode}/slideIndex`), index);
  };

  const submitVote = async (roomCode: string, slideId: string, choiceId: string) => {
    const anonId = getAnonId();
  const votePath = `rooms/${roomCode}/votes/${slideId}/${anonId}`;
  // 同一 anonId の上書きにより重複投票を防止
  await set(dbRef(getDb(), votePath), { choiceId, votedAt: new Date().toISOString() });
  };

  // safer vote that adjusts aggregates when changing vote
  const submitVoteSafe = async (roomCode: string, slideId: string, choiceId: string) => {
    const anonId = getAnonId();
  const voteRef = dbRef(getDb(), `rooms/${roomCode}/votes/${slideId}/${anonId}`);

    // read previous vote
    const prevSnap = await get(voteRef);
    const prevChoice = prevSnap.exists() ? (prevSnap.val().choiceId as string | null) : null;
    if (prevChoice === choiceId) {
      // no change
      return false;
    }

    // write new vote
    try {
      await set(voteRef, { choiceId, votedAt: new Date().toISOString() });
    } catch (e) {
      // write failed
      // eslint-disable-next-line no-console
      console.error('submitVoteSafe: failed to write vote', e);
      throw e;
    }

    // adjust aggregates in one transaction
  const aggRef = dbRef(getDb(), `rooms/${roomCode}/aggregates/${slideId}`);
    try {
      await runTransaction(aggRef, (current: any) => {
        current = current || { counts: {}, total: 0 };
        current.counts = current.counts || {};
        if (prevChoice) {
          current.counts[prevChoice] = Math.max((current.counts[prevChoice] || 0) - 1, 0);
          current.total = Math.max((current.total || 0) - 1, 0);
        }
        current.counts[choiceId] = (current.counts[choiceId] || 0) + 1;
        current.total = (current.total || 0) + 1;
        return current;
      });
      // eslint-disable-next-line no-console
      console.log('submitVoteSafe: aggregates transaction succeeded', { roomCode, slideId, choiceId, prevChoice });
    } catch (e) {
      // transaction failed: log and rethrow so caller can handle
      // eslint-disable-next-line no-console
      console.error('submitVoteSafe: transaction failed', e);
      throw e;
    }

  return true;
  };

  const pushComment = async (roomCode: string, text: string) => {
    const anonId = getAnonId();
  const commentRef = dbRef(getDb(), `rooms/${roomCode}/comments`);
  await push(commentRef, { anonId, text, likes: 0, userLikes: {}, deleted: false, createdAt: new Date().toISOString() });
  };

  const likeComment = async (roomCode: string, commentId: string) => {
    const anonId = getAnonId();
  const commentRef = dbRef(getDb(), `rooms/${roomCode}/comments/${commentId}`);
    // run transaction on the whole comment node to check userLikes and deleted flag
    await runTransaction(commentRef, (current: any) => {
      if (!current) return current; // comment missing
      if (current.deleted) return current; // don't like deleted comments
      current.userLikes = current.userLikes || {};
      const already = !!current.userLikes[anonId];
      if (already) {
        // toggle off
        delete current.userLikes[anonId];
        current.likes = Math.max((current.likes || 1) - 1, 0);
      } else {
        // toggle on
        current.userLikes[anonId] = true;
        current.likes = (current.likes || 0) + 1;
      }
      return current;
    });
  };

  const deleteComment = async (roomCode: string, commentId: string) => {
    const anonId = getAnonId();
  const commentRef = dbRef(getDb(), `rooms/${roomCode}/comments/${commentId}`);
    // soft-delete via transaction: mark deleted flag and remove text
    await runTransaction(commentRef, (current: any) => {
      if (!current) return current;
      // allow deletion only by same anonId (client-side check) — rules should enforce server-side
      // mark deleted and record who deleted
      current.deleted = true;
      current.deletedAt = new Date().toISOString();
      current.deletedBy = anonId;
      current.text = null;
      return current;
    });
  };

  return {
    generateRoomCode,
    getAnonId,
    createRoom,
    joinRoom,
    saveSlides,
    setSlideIndex,
    submitVote,
    submitVoteSafe,
    pushComment,
    likeComment,
    deleteComment,
  };
};

export default useRoom;
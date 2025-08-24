import { ref as dbRef, set, push, get, runTransaction } from "firebase/database";
import type { Database } from "firebase/database";

export default function useRoom() {
  if (!process.client) {
    throw new Error("useRoom はクライアントサイドでのみ使用してください");
  }

  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb as Database | undefined;
  if (!db) throw new Error("firebaseDb not available");

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
    const roomRef = dbRef(db, `rooms/${code}`);
    await set(roomRef, {
      presenterId: anonId,
      slideIndex: 0,
      createdAt: now,
    });
    return code;
  };

  const joinRoom = async (roomCode: string) => {
    const snap = await get(dbRef(db, `rooms/${roomCode}`));
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
    await set(dbRef(db, `rooms/${roomCode}/slides`), slidesObj);
  };

  const setSlideIndex = async (roomCode: string, index: number) => {
    await set(dbRef(db, `rooms/${roomCode}/slideIndex`), index);
  };

  const submitVote = async (roomCode: string, slideId: string, choiceId: string) => {
    const anonId = getAnonId();
    const votePath = `rooms/${roomCode}/votes/${slideId}/${anonId}`;
    // 同一 anonId の上書きにより重複投票を防止
  await set(dbRef(db, votePath), { choiceId, votedAt: new Date().toISOString() });
  };

  // safer vote that adjusts aggregates when changing vote
  const submitVoteSafe = async (roomCode: string, slideId: string, choiceId: string) => {
    const anonId = getAnonId();
    const voteRef = dbRef(db, `rooms/${roomCode}/votes/${slideId}/${anonId}`);

    // read previous vote
    const prevSnap = await get(voteRef);
    const prevChoice = prevSnap.exists() ? (prevSnap.val().choiceId as string | null) : null;
    if (prevChoice === choiceId) {
      // no change
      return;
    }

  // write new vote only; functions will recalc aggregates
  await set(voteRef, { choiceId, votedAt: new Date().toISOString() });
  };

  const pushComment = async (roomCode: string, text: string) => {
    const anonId = getAnonId();
    const commentRef = dbRef(db, `rooms/${roomCode}/comments`);
    await push(commentRef, { anonId, text, likes: 0, createdAt: new Date().toISOString() });
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
  };
}
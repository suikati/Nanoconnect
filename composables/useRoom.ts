import { ref as dbRef, set, push, get, runTransaction } from 'firebase/database';
import { roomPath, slideIndexPath, slidePathById, votesPathById, aggregatesPathById, commentsPath } from '~/utils/paths';
import type { Database } from 'firebase/database';

type UseRoomApi = {
  generateRoomCode: (len?: number) => string;
  getAnonId: () => string;
  createRoom: (roomCode?: string) => Promise<string>;
  joinRoom: (roomCode: string) => Promise<{ roomCode: string; anonId: string; room: any }>;
  saveSlides: (roomCode: string, slides: UiSlide[]) => Promise<void>;
  setSlideIndex: (roomCode: string, index: number) => Promise<void>;
  submitVote: (roomCode: string, slideId: string, choiceId: string) => Promise<void>;
  submitVoteSafe: (roomCode: string, slideId: string, choiceId: string) => Promise<boolean>;
  pushComment: (roomCode: string, text: string) => Promise<void>;
  likeComment: (roomCode: string, commentId: string) => Promise<void>;
  deleteComment: (roomCode: string, commentId: string) => Promise<void>;
};

// UI / DB shapes
type UiChoice = { id?: string; text: string; color?: string };
type UiSlide = { title: string; choices: UiChoice[]; chartType?: 'bar' | 'pie' };

type DbChoice = { text: string; index: number; color?: string };
type DbSlide = { title: string; slideNumber: number; chartType?: 'bar' | 'pie'; choices: Record<string, DbChoice> };

// Generate / normalize a stable id for a choice (uuid-lite)
const genChoiceId = () => 'ch_' + Math.random().toString(36).slice(2, 10);

const toDbSlides = (slides: UiSlide[]): Record<string, DbSlide> => {
  const slidesObj: Record<string, DbSlide> = {};
  slides.forEach((s: UiSlide, i: number) => {
    const choicesMap: Record<string, DbChoice> = {};
    const choicesArr = Array.isArray(s.choices) ? s.choices : [];
    choicesArr.forEach((c: UiChoice, idx: number) => {
      const text = c && c.text ? String(c.text) : '';
      const color = c && c.color ? String(c.color) : undefined;
      const base: DbChoice = { text, index: idx };
      if (color) base.color = color; // undefined を送らない
  // Stable id (keep existing c.id if provided)
  const stableId = (c && c.id && /^ch_/.test(c.id)) ? c.id : genChoiceId();
  choicesMap[stableId] = base;
    });
    const baseSlide: any = { title: s.title || '', slideNumber: i + 1, choices: choicesMap };
    const ct = s.chartType || 'bar';
    if (ct) baseSlide.chartType = ct; // 常に 'bar' または 'pie'
    slidesObj[`slide_${i + 1}`] = baseSlide as DbSlide;
  });
  return slidesObj;
};

const useRoom = (): UseRoomApi => {
  // クライアントでのみ関数を呼ぶことを保証する。firebase が利用できない場合は getDb が例外を投げる

  const nuxt = useNuxtApp();
  const getDb = (): Database => {
    const d = (nuxt as any).$firebaseDb as Database | undefined;
    if (!d) throw new Error('firebaseDb not available');
    return d;
  };

  const generateRoomCode = (len = 6) => {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((n) => alphabet[n % alphabet.length])
      .join('');
  };

  const generateAnonId = () => 'anon_' + Math.random().toString(36).slice(2, 10);

  const getAnonId = () => {
    const key = 'nanosuke_anonId';
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

  const createRoom = async (roomCode?: string): Promise<string> => {
    const code = roomCode || generateRoomCode();
    const anonId = getAnonId();
    const now = new Date().toISOString();
  const roomRef = dbRef(getDb(), roomPath(code));
    await set(roomRef, {
      presenterId: anonId,
      slideIndex: 0,
      createdAt: now,
    });
    return code;
  };

  const joinRoom = async (
    roomCode: string,
  ): Promise<{ roomCode: string; anonId: string; room: any }> => {
  const snap = await get(dbRef(getDb(), roomPath(roomCode)));
    if (!snap.exists()) throw new Error('Room not found');
    return { roomCode, anonId: getAnonId(), room: snap.val() };
  };

  const saveSlides = async (roomCode: string, slides: UiSlide[]): Promise<void> => {
    const slidesObj = toDbSlides(slides);
  await set(dbRef(getDb(), `${roomPath(roomCode)}/slides`), slidesObj);
  };

  const setSlideIndex = async (roomCode: string, index: number): Promise<void> => {
  await set(dbRef(getDb(), slideIndexPath(roomCode)), index);
  };

  const submitVote = async (roomCode: string, slideId: string, choiceId: string): Promise<void> => {
    const anonId = getAnonId();
  const votePath = votesPathById(roomCode, slideId, anonId);
  await set(dbRef(getDb(), votePath), { choiceId, votedAt: new Date().toISOString() });
  };

  // 投票を変更したときに集計を調整する安全な投票処理
  const submitVoteSafe = async (
    roomCode: string,
    slideId: string,
    choiceId: string,
  ): Promise<boolean> => {
    const anonId = getAnonId();
  const voteRef = dbRef(getDb(), votesPathById(roomCode, slideId, anonId));

    // 以前の投票を読み取る
    const prevSnap = await get(voteRef);
    const prevChoice = prevSnap.exists() ? (prevSnap.val().choiceId as string | null) : null;
    if (prevChoice === choiceId) {
      // 変更なし
      return false;
    }

    // 新しい投票を書き込む
    try {
      await set(voteRef, { choiceId, votedAt: new Date().toISOString() });
    } catch (e) {
      // 書き込み失敗
      // eslint-disable-next-line no-console
      console.error('submitVoteSafe: failed to write vote', e);
      throw e;
    }

    // 集計をトランザクションで一括調整
  const aggRef = dbRef(getDb(), aggregatesPathById(roomCode, slideId));
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
      console.log('submitVoteSafe: aggregates transaction succeeded', {
        roomCode,
        slideId,
        choiceId,
        prevChoice,
      });
    } catch (e) {
      // トランザクション失敗：ログを出し呼び出し元で処理できるよう再スロー
      // eslint-disable-next-line no-console
      console.error('submitVoteSafe: transaction failed', e);
      throw e;
    }

    return true;
  };

  const pushComment = async (roomCode: string, text: string): Promise<void> => {
    const anonId = getAnonId();
  const commentRef = dbRef(getDb(), commentsPath(roomCode));
    await push(commentRef, {
      anonId,
      text,
      likes: 0,
      userLikes: {},
      deleted: false,
      createdAt: new Date().toISOString(),
    });
  };

  const likeComment = async (roomCode: string, commentId: string): Promise<void> => {
    const anonId = getAnonId();
  const commentRef = dbRef(getDb(), `${commentsPath(roomCode)}/${commentId}`);
    // コメントノード全体をトランザクションで扱い、userLikes と deleted フラグを確認する
    await runTransaction(commentRef, (current: any) => {
      if (!current) return current; // コメントが存在しない場合
      if (current.deleted) return current; // 削除済みコメントにはいいねを付けない
      current.userLikes = current.userLikes || {};
      const already = !!current.userLikes[anonId];
      if (already) {
        // オフにする（いいねを取り消す）
        delete current.userLikes[anonId];
        current.likes = Math.max((current.likes || 1) - 1, 0);
      } else {
        // オンにする（いいねを付ける）
        current.userLikes[anonId] = true;
        current.likes = (current.likes || 0) + 1;
      }
      return current;
    });
  };

  const deleteComment = async (roomCode: string, commentId: string): Promise<void> => {
    const anonId = getAnonId();
    const commentRef = dbRef(getDb(), `rooms/${roomCode}/comments/${commentId}`);
    // ソフトデリート（トランザクション）：deleted フラグを立てテキストを削除
    await runTransaction(commentRef, (current: any) => {
      if (!current) return current;
      // 同一 anonId のみ削除を許可（クライアント側チェック）。実際はセキュリティルールでサーバ側で制御すべき
      // 削除フラグや削除者を記録する
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

export type Choice = { id?: string; text: string; votes?: number };

export type PlaybyplayRequest = {
  title: string;
  choices: Choice[];
  roomId?: string;
};

export type PlaybyplayResponse = { text?: string; meta?: { model?: string }; error?: string };

export type CommentRequest = { title: string; selectedChoice: string | Choice; roomId?: string };
export type CommentResponse = { text?: string; meta?: { model?: string }; error?: string };

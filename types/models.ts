export type Choice = { key: string; text: string };

export type Slide = {
  title: string;
  slideNumber: number;
  choices: Record<string, { text: string; index: number }>;
};

export type Aggregate = {
  counts: Record<string, number>;
  total: number;
};

export type Comment = {
  anonId: string;
  text: string | null;
  likes: number;
  userLikes: Record<string, boolean>;
  deleted: boolean;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
};

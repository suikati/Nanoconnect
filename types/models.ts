export type Choice = { key: string; text: string; color?: string };

export type Slide = {
  title: string;
  slideNumber: number;
  // choices is stored in Firebase as an object map choice_0, choice_1 ... but in UI we may use an array of {text,color,index}
  choices: Record<string, { text: string; index: number; color?: string }>;
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

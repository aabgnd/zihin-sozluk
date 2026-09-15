export type FormState = {
  error?: string;
  message?: string;
  unconfirmedEmail?: string;
};

export type FormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

export type Role = "admin" | "mod" | "user";

export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: Role;
  generation: string | null;
  title: string | null;
  is_banned: boolean;
  is_frozen: boolean;
  allow_messages: boolean;
  created_at: string;
};

export type Author = Pick<
  PublicProfile,
  "id" | "username" | "avatar_url" | "generation" | "title" | "allow_messages"
>;

export type EntryRow = {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: Author | null;
  topic: { title: string; slug: string } | null;
  favorites: { count: number }[];
};

export type TopicListItem = {
  title: string;
  slug: string;
  entry_count: number;
};

export type MessageRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

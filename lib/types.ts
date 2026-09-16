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

export type UserStatus = "caylak" | "yazar";

export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
  generation: string | null;
  title: string | null;
  is_banned: boolean;
  is_frozen: boolean;
  allow_messages: boolean;
  created_at: string;
};

export type Viewer = PublicProfile & {
  mutedUntil: string | null;
  isMuted: boolean;
  isWriter: boolean;
  isStaff: boolean;
  reviewEntryCount: number;
  writerThreshold: number;
};

export type Author = Pick<
  PublicProfile,
  | "id"
  | "username"
  | "avatar_url"
  | "generation"
  | "title"
  | "allow_messages"
  | "status"
>;

export type EntryRow = {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  edited_at: string | null;
  author: Author | null;
  topic: { title: string; slug: string } | null;
  favorites: { count: number }[];
};

export type TopicListItem = {
  title: string;
  slug: string;
  entry_count: number;
  today_count?: number;
};

export type TopEntry = {
  entry_id: number;
  topic_title: string;
  topic_slug: string;
  snippet: string;
  upvotes: number;
};

export type MessageRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type ReportRow = {
  entry_id: number;
  topic_title: string;
  topic_slug: string;
  author_id: string;
  author_username: string;
  author_status: UserStatus;
  content: string;
  entry_deleted: boolean;
  report_count: number;
  reasons: string[];
  notes: string[];
  last_report_at: string;
};

export type PendingWriter = {
  id: string;
  username: string;
  entry_count: number;
  created_at: string;
};

export type ModUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  status: UserStatus;
  is_banned: boolean;
  is_frozen: boolean;
  muted_until: string | null;
  entry_count: number;
  created_at: string;
};

export type TrashRow = {
  kind: "baslik" | "entry";
  id: number;
  title: string;
  slug: string;
  content: string | null;
  author_username: string | null;
  deleted_at: string;
  deleted_by_username: string | null;
};

export type ModLogRow = {
  id: number;
  actor_username: string | null;
  action: string;
  target_username: string | null;
  target_entry_id: number | null;
  target_topic_id: number | null;
  detail: string | null;
  created_at: string;
};

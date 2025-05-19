export class UserSummaryDto {
  id!: number;
  username!: string;
  displayName?: string;
  avatarUrl?: string; // e.g. `/user/:id/avatar`
}

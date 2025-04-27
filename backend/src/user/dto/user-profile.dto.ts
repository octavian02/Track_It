export class UserProfileDto {
  id!: number;
  username!: string;
  displayName?: string;
  bio?: string;
  followersCount!: number;
  followingCount!: number;
  isFollowing!: boolean;
  avatarUrl?: string; // data-uri or HTTP URL
}

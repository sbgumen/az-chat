export function calcCompletion(profile: any): number {
  let filled = 0;
  if (profile?.nickname) filled += 20;
  if (profile?.avatar && profile.avatar !== '/default-avatar.png') filled += 20;
  if (profile?.gender && profile.gender !== 0) filled += 15;
  if (profile?.weight) filled += 10;
  if (profile?.height) filled += 10;
  if (profile?.birthday) filled += 10;
  if (profile?.signature) filled += 10;
  if (profile?.tags) {
    const tags = typeof profile.tags === 'string' ? JSON.parse(profile.tags) : profile.tags;
    if (Array.isArray(tags) && tags.length > 0) filled += 5;
  }
  return filled;
}

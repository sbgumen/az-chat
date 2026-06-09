import { NoticeListPage } from './NoticeListPage';

// GroupNoticePage now delegates to the new NoticeListPage component.
// Member-facing notices list (no management buttons) is handled by NoticeListPage
// since it checks user role internally.
export function GroupNoticePage() {
  return <NoticeListPage />;
}

export default GroupNoticePage;

import {
  doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  collectionGroup, serverTimestamp, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Member {
  uid: string;
  role: 'owner' | 'member';
  space_display_name: string | null;
  hidden_member_uids: string[];
  joined_at: unknown;
}

export interface JoinRequest {
  id: string;
  requester_uid: string;
  requester_email: string;
  requester_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: { toDate?: () => Date } | null;
}

export async function getMember(spaceId: string, uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'memorial_spaces', spaceId, 'members', uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as Member) : null;
}

export async function addMember(
  spaceId: string,
  uid: string,
  role: 'owner' | 'member',
  spaceDisplayName: string | null = null
): Promise<void> {
  await setDoc(doc(db, 'memorial_spaces', spaceId, 'members', uid), {
    uid,
    role,
    space_display_name: spaceDisplayName,
    hidden_member_uids: [],
    joined_at: serverTimestamp(),
  });
}

// uid로 내가 속한 모든 공간 ID 조회 (collectionGroup 활용)
export async function getMyMemberSpaceIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)));
  return snap.docs.map(d => d.ref.parent.parent!.id);
}

export async function updateMemberDisplayName(
  spaceId: string,
  uid: string,
  displayName: string
): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId, 'members', uid), {
    space_display_name: displayName,
  });
}

export async function getMyJoinRequest(spaceId: string, uid: string): Promise<JoinRequest | null> {
  const q = query(
    collection(db, 'memorial_spaces', spaceId, 'join_requests'),
    where('requester_uid', '==', uid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as JoinRequest;
}

export async function submitJoinRequest(
  spaceId: string,
  data: { requester_uid: string; requester_email: string; requester_name: string; message: string }
): Promise<void> {
  await addDoc(collection(db, 'memorial_spaces', spaceId, 'join_requests'), {
    ...data,
    status: 'pending',
    created_at: serverTimestamp(),
  });
}

export async function getPendingRequests(spaceId: string): Promise<JoinRequest[]> {
  const q = query(
    collection(db, 'memorial_spaces', spaceId, 'join_requests'),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest));
}

export async function approveJoinRequest(
  spaceId: string,
  requestId: string,
  requesterUid: string
): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId, 'join_requests', requestId), {
    status: 'approved',
    reviewed_at: serverTimestamp(),
  });
  await addMember(spaceId, requesterUid, 'member');
}

export async function rejectJoinRequest(spaceId: string, requestId: string): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId, 'join_requests', requestId), {
    status: 'rejected',
    reviewed_at: serverTimestamp(),
  });
}

// ---- 멤버 관리 ----

export async function getMembers(spaceId: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, 'memorial_spaces', spaceId, 'members'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member));
}

export async function getPendingRequestCount(spaceId: string): Promise<number> {
  const q = query(
    collection(db, 'memorial_spaces', spaceId, 'join_requests'),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function softDeleteSpace(spaceId: string): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId), {
    is_deleted: true,
    deleted_at: serverTimestamp(),
  });
}

export async function restoreSpace(spaceId: string): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId), {
    is_deleted: false,
    deleted_at: null,
  });
}

export async function kickMember(spaceId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'memorial_spaces', spaceId, 'members', uid));
}

export async function hideMember(spaceId: string, myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId, 'members', myUid), {
    hidden_member_uids: arrayUnion(targetUid),
  });
}

export async function unhideMember(spaceId: string, myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId, 'members', myUid), {
    hidden_member_uids: arrayRemove(targetUid),
  });
}

// ---- 초대 토큰 ----

export interface Invite {
  id: string;
  space_id: string;
  created_by: string;
  used: boolean;
  used_by: string | null;
  expires_at: { toDate?: () => Date } | null;
  created_at: { toDate?: () => Date } | null;
}

export async function createInviteToken(spaceId: string, createdByUid: string): Promise<string> {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7일
  await setDoc(doc(db, 'invites', token), {
    space_id: spaceId,
    created_by: createdByUid,
    used: false,
    used_by: null,
    expires_at: expiresAt,
    created_at: serverTimestamp(),
  });
  return token;
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, 'invites', token));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invite;
}

export async function markInviteUsed(token: string, usedByUid: string): Promise<void> {
  await updateDoc(doc(db, 'invites', token), {
    used: true,
    used_by: usedByUid,
  });
}

// ---- 공간 관리 ----

export async function updateSpace(
  spaceId: string,
  data: { name?: string; bio?: string | null; birth_year?: number | null; death_year?: number | null }
): Promise<void> {
  await updateDoc(doc(db, 'memorial_spaces', spaceId), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteMessage(spaceId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'memorial_spaces', spaceId, 'messages', messageId));
}

export async function deleteMediaItem(spaceId: string, mediaId: string): Promise<void> {
  await deleteDoc(doc(db, 'memorial_spaces', spaceId, 'media', mediaId));
}

async function deleteAllDocsInCollection(path: string): Promise<void> {
  const snap = await getDocs(collection(db, path));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function hardDeleteSpace(spaceId: string): Promise<void> {
  // 하위 컬렉션 전부 삭제
  await deleteAllDocsInCollection(`memorial_spaces/${spaceId}/members`);
  await deleteAllDocsInCollection(`memorial_spaces/${spaceId}/messages`);
  await deleteAllDocsInCollection(`memorial_spaces/${spaceId}/media`);
  await deleteAllDocsInCollection(`memorial_spaces/${spaceId}/join_requests`);

  // 관련 초대 토큰 삭제
  const inviteSnap = await getDocs(query(collection(db, 'invites'), where('space_id', '==', spaceId)));
  await Promise.all(inviteSnap.docs.map(d => deleteDoc(d.ref)));

  // 공간 문서 삭제
  await deleteDoc(doc(db, 'memorial_spaces', spaceId));
}

// ---- 댓글 ----

export interface Comment {
  id: string;
  author_name: string;
  author_uid: string;
  content: string;
  created_at: { toDate?: () => Date } | null;
}

export async function addComment(
  spaceId: string,
  parentCollection: 'messages' | 'media',
  parentId: string,
  data: { author_name: string; author_uid: string; content: string }
): Promise<Comment> {
  const ref = await addDoc(
    collection(db, 'memorial_spaces', spaceId, parentCollection, parentId, 'comments'),
    { ...data, created_at: serverTimestamp() }
  );
  return { id: ref.id, ...data, created_at: null };
}

export async function getComments(
  spaceId: string,
  parentCollection: 'messages' | 'media',
  parentId: string
): Promise<Comment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'memorial_spaces', spaceId, parentCollection, parentId, 'comments'),
      orderBy('created_at', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
}

export async function deleteComment(
  spaceId: string,
  parentCollection: 'messages' | 'media',
  parentId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(doc(db, 'memorial_spaces', spaceId, parentCollection, parentId, 'comments', commentId));
}

export async function deleteUserAccount(uid: string): Promise<void> {
  // 소유 공간 soft-delete
  const ownedSnap = await getDocs(query(collection(db, 'memorial_spaces'), where('created_by', '==', uid)));
  await Promise.all(ownedSnap.docs.map(d => updateDoc(d.ref, { is_deleted: true, deleted_at: serverTimestamp() })));

  // 모든 멤버십 삭제
  const memberSnap = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)));
  await Promise.all(memberSnap.docs.map(d => deleteDoc(d.ref)));
}

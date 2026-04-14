import {
  doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  serverTimestamp, Timestamp,
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
    role,
    space_display_name: spaceDisplayName,
    hidden_member_uids: [],
    joined_at: serverTimestamp(),
  });
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

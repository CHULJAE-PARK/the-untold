import {
  doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, updateDoc, serverTimestamp,
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

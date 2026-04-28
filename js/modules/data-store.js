import {
  auth,
  db,
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "../../config/config.js";
import { state } from "./state.js";

const COLLECTIONS = {
  tasks: "tasks",
  projects: "projects",
  members: "members",
  notes: "notes"
};

function requireUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No authenticated user");
  return uid;
}

function userCollection(name) {
  return collection(db, "users", requireUserId(), name);
}

function userDoc(name, id) {
  return doc(db, "users", requireUserId(), name, id);
}

function hydrateDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function sortByNewest(items) {
  return items.sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt || 0;
    const bTime = b.updatedAt || b.createdAt || 0;
    return bTime - aTime;
  });
}

async function fetchCollection(name) {
  const snapshot = await getDocs(userCollection(name));
  return sortByNewest(snapshot.docs.map(hydrateDoc));
}

// No local seeding: fetch notes directly from Firestore for the authenticated user.

export async function loadWorkspaceData() {
  const [tasks, projects, members, notes] = await Promise.all([
    fetchCollection(COLLECTIONS.tasks),
    fetchCollection(COLLECTIONS.projects),
    fetchCollection(COLLECTIONS.members),
    fetchCollection(COLLECTIONS.notes)
  ]);

  state.tasks = tasks;
  state.projects = projects;
  state.members = members;
  state.notes = notes;
}

export async function createTaskRecord(payload) {
  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.tasks), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateTaskRecord(id, payload) {
  const updatedAt = Date.now();
  await updateDoc(userDoc(COLLECTIONS.tasks, id), { ...payload, updatedAt });
  return { ...payload, updatedAt };
}

export async function deleteTaskRecord(id) {
  await deleteDoc(userDoc(COLLECTIONS.tasks, id));
}

export async function createProjectRecord(payload) {
  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.projects), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateProjectRecord(id, payload, previousName) {
  const updatedAt = Date.now();
  const batch = writeBatch(db);

  batch.update(userDoc(COLLECTIONS.projects, id), { ...payload, updatedAt });

  if (previousName && payload.name && previousName !== payload.name) {
    const tasksQuery = query(userCollection(COLLECTIONS.tasks), where("project", "==", previousName));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((taskDoc) => {
      batch.update(taskDoc.ref, { project: payload.name, updatedAt });
    });
  }

  await batch.commit();
  return { ...payload, updatedAt };
}

export async function deleteProjectRecord(id, projectName) {
  const batch = writeBatch(db);
  batch.delete(userDoc(COLLECTIONS.projects, id));

  const tasksQuery = query(userCollection(COLLECTIONS.tasks), where("project", "==", projectName));
  const tasksSnapshot = await getDocs(tasksQuery);
  tasksSnapshot.forEach((taskDoc) => {
    batch.update(taskDoc.ref, { project: "Unassigned", updatedAt: Date.now() });
  });

  await batch.commit();
}

export async function createMemberRecord(payload) {
  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.members), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateMemberRecord(id, payload) {
  const updatedAt = Date.now();
  await updateDoc(userDoc(COLLECTIONS.members, id), { ...payload, updatedAt });
  return { ...payload, updatedAt };
}

export async function deleteMemberRecord(id) {
  const currentUserUid = requireUserId();
  const memberRef = userDoc(COLLECTIONS.members, id);
  const memberSnap = await getDoc(memberRef);
  
  if (!memberSnap.exists()) return;
  const targetMemberUid = memberSnap.data().uid;

  const batch = writeBatch(db);

  // 1. Delete from current user's members
  batch.delete(memberRef);

  // 2. Remove from current user's projects
  const projectsQuery = query(userCollection(COLLECTIONS.projects), where("memberIds", "array-contains", id));
  const projectsSnapshot = await getDocs(projectsQuery);
  projectsSnapshot.forEach((projectDoc) => {
    const data = projectDoc.data();
    const memberIds = (data.memberIds || []).filter((mid) => mid !== id);
    batch.update(projectDoc.ref, { memberIds, updatedAt: Date.now() });
  });

  // 3. Reciprocal Deletion: Find current user in target user's workspace and delete
  if (targetMemberUid) {
    const reciprocalQuery = query(
      collection(db, "users", targetMemberUid, "members"),
      where("uid", "==", currentUserUid)
    );
    const reciprocalSnap = await getDocs(reciprocalQuery);
    
    reciprocalSnap.forEach((recipDoc) => {
      // Delete the member record
      batch.delete(recipDoc.ref);
      
      // Note: Cleaning up target user's projects is omitted here to avoid overly complex queries 
      // in a batch without knowing their project IDs, but the member will be gone from their Team page.
    });
  }

  await batch.commit();
}

export async function createNoteRecord(payload) {
  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.notes), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateNoteRecord(id, payload) {
  const updatedAt = Date.now();
  await updateDoc(userDoc(COLLECTIONS.notes, id), { ...payload, updatedAt });
  return { ...payload, updatedAt };
}

export async function deleteNoteRecord(id) {
  await deleteDoc(userDoc(COLLECTIONS.notes, id));
}

// ── User Profiles (shared collection for lookup) ──────────────
export async function ensureUserProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const profileRef = doc(db, "userProfiles", user.uid);
  const snap = await getDoc(profileRef);
  const existingData = snap.exists() ? snap.data() : {};

  await setDoc(profileRef, {
    uid: user.uid,
    displayName: user.displayName || user.email.split("@")[0],
    email: user.email,
    photoURL: user.photoURL || null,
    jobTitle: existingData.jobTitle || "Team Member",
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const profileRef = doc(db, "userProfiles", uid);
  const snap = await getDoc(profileRef);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  const profileRef = doc(db, "userProfiles", uid);
  await updateDoc(profileRef, { ...data, updatedAt: Date.now() });
}

export async function findUserByEmail(email) {
  const q = query(collection(db, "userProfiles"), where("email", "==", email.toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// ── Invitations (shared top-level collection) ─────────────────
export async function sendInvitation(targetUser, role) {
  const sender = auth.currentUser;
  if (!sender) throw new Error("Not authenticated");

  // Check for duplicate pending invitation
  const dupeQuery = query(
    collection(db, "invitations"),
    where("senderUid", "==", sender.uid),
    where("targetUid", "==", targetUser.uid),
    where("status", "==", "pending")
  );
  const dupeSnap = await getDocs(dupeQuery);
  if (!dupeSnap.empty) throw new Error("DUPLICATE_INVITE");

  const ref = await addDoc(collection(db, "invitations"), {
    senderUid: sender.uid,
    senderName: sender.displayName || sender.email.split("@")[0],
    senderEmail: sender.email,
    targetUid: targetUser.uid,
    targetName: targetUser.displayName,
    targetEmail: targetUser.email,
    role: role,
    status: "pending",
    createdAt: Date.now()
  });

  return { id: ref.id };
}

export async function fetchPendingInvitations() {
  const uid = requireUserId();
  const q = query(
    collection(db, "invitations"),
    where("targetUid", "==", uid),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function acceptInvitationRecord(invitationId) {
  const uid = requireUserId();
  const invRef = doc(db, "invitations", invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Invitation not found");

  const inv = invSnap.data();

  // Update invitation status
  await updateDoc(invRef, { status: "accepted", acceptedAt: Date.now() });

  // Create member record in the SENDER's workspace
  const senderMembersRef = collection(db, "users", inv.senderUid, "members");
  const memberPayload = {
    name: inv.targetName,
    email: inv.targetEmail,
    role: inv.role,
    status: "online",
    uid: inv.targetUid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const memberRef = await addDoc(senderMembersRef, memberPayload);

  // Also create a reciprocal member record in the TARGET's workspace (the sender becomes a member for the target too)
  const targetMembersRef = collection(db, "users", uid, "members");
  const reciprocalPayload = {
    name: inv.senderName,
    email: inv.senderEmail,
    role: "Team Lead",
    status: "online",
    uid: inv.senderUid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await addDoc(targetMembersRef, reciprocalPayload);

  return { id: memberRef.id, ...memberPayload };
}

export async function declineInvitationRecord(invitationId) {
  const invRef = doc(db, "invitations", invitationId);
  await updateDoc(invRef, { status: "declined", declinedAt: Date.now() });
}

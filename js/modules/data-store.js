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
  writeBatch,
  arrayUnion,
  arrayRemove
} from "../../config/config.js";
import { state } from "./state.js";

const COLLECTIONS = {
  tasks: "tasks",
  projects: "projects",
  members: "members",
  notes: "notes",
  invitations: "invitations"
};

const ONLINE_STALE_MS = 2 * 60 * 1000;

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

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function displayNameFromUser(user) {
  return user.displayName || user.email?.split("@")[0] || "User";
}

function getOnlineStatus(profile = {}) {
  const lastSeen = typeof profile.lastSeen === "object" && typeof profile.lastSeen?.seconds === "number"
    ? profile.lastSeen.seconds * 1000
    : Number(profile.lastSeen || 0);
  const isFresh = lastSeen && Date.now() - lastSeen < ONLINE_STALE_MS;
  return profile.onlineStatus === "online" && isFresh ? "online" : "offline";
}

function sortByNewest(items) {
  return items.sort((a, b) => {
    const getTime = (value) => typeof value === "object" && typeof value?.seconds === "number"
      ? value.seconds * 1000
      : Number(value || 0);
    const aTime = getTime(a.updatedAt || a.createdAt);
    const bTime = getTime(b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
}

async function fetchCollection(name) {
  const snapshot = await getDocs(userCollection(name));
  return sortByNewest(snapshot.docs.map(hydrateDoc));
}

async function enrichMembersWithProfiles(members) {
  return Promise.all(members.map(async (member) => {
    if (!member.uid) return member;

    const profile = await getUserProfile(member.uid);
    if (!profile) return member;

    return {
      ...member,
      name: profile.displayName || member.name,
      email: profile.email || member.email,
      photoURL: profile.photoURL || member.photoURL || null,
      jobTitle: profile.jobTitle || member.jobTitle,
      status: getOnlineStatus(profile)
    };
  }));
}

// No local seeding: fetch notes directly from Firestore for the authenticated user.

export async function loadWorkspaceData() {
  const [tasks, projects, members, notes, pendingInvitations] = await Promise.all([
    fetchCollection(COLLECTIONS.tasks),
    fetchCollection(COLLECTIONS.projects),
    fetchCollection(COLLECTIONS.members),
    fetchCollection(COLLECTIONS.notes),
    fetchPendingInvitations()
  ]);

  state.tasks = tasks;
  state.projects = projects;
  state.members = await enrichMembersWithProfiles(members);
  state.notes = notes;
  state.pendingInvitations = pendingInvitations;
}

export function subscribeToWorkspaceProjects(onChange, onError) {
  return onSnapshot(userCollection(COLLECTIONS.projects), (snapshot) => {
    onChange(sortByNewest(snapshot.docs.map(hydrateDoc)));
  }, onError);
}

export function subscribeToWorkspaceMembers(onChange, onError) {
  return onSnapshot(userCollection(COLLECTIONS.members), async (snapshot) => {
    const members = sortByNewest(snapshot.docs.map(hydrateDoc));
    onChange(await enrichMembersWithProfiles(members));
  }, onError);
}

export async function createTaskRecord(payload) {
  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.tasks), {
    ...payload,
    ownerUid: requireUserId(),
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, ownerUid: auth.currentUser.uid, createdAt: timestamp, updatedAt: timestamp };
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
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const timestamp = Date.now();
  const ref = await addDoc(userCollection(COLLECTIONS.projects), {
    ...payload,
    ownerUid: user.uid,
    ownerName: displayNameFromUser(user),
    ownerEmail: user.email,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return {
    id: ref.id,
    ...payload,
    ownerUid: user.uid,
    ownerName: displayNameFromUser(user),
    ownerEmail: user.email,
    createdAt: timestamp,
    updatedAt: timestamp
  };
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
    joinedAt: payload.joinedAt || timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, joinedAt: payload.joinedAt || timestamp, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateMemberRecord(id, payload) {
  const updatedAt = Date.now();
  await updateDoc(userDoc(COLLECTIONS.members, id), { ...payload, updatedAt });
  return { ...payload, updatedAt };
}

export async function deleteMemberRecord(id) {
  requireUserId();
  const memberRef = userDoc(COLLECTIONS.members, id);
  const memberSnap = await getDoc(memberRef);
  
  if (!memberSnap.exists()) return;
  const targetMemberUid = memberSnap.data().uid;
  const memberData = memberSnap.data();

  const batch = writeBatch(db);

  batch.delete(memberRef);

  const projectsQuery = query(userCollection(COLLECTIONS.projects), where("memberIds", "array-contains", id));
  const projectsSnapshot = await getDocs(projectsQuery);
  projectsSnapshot.forEach((projectDoc) => {
    batch.update(projectDoc.ref, {
      memberIds: arrayRemove(id),
      updatedAt: Date.now()
    });
  });

  if (targetMemberUid) {
    const projectIds = new Set(memberData.projectIds || []);
    projectsSnapshot.forEach((projectDoc) => projectIds.add(projectDoc.id));

    projectIds.forEach((projectId) => {
      batch.delete(doc(db, "users", targetMemberUid, COLLECTIONS.projects, `shared_${projectId}`));
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
    displayName: displayNameFromUser(user),
    email: normalizeEmail(user.email),
    photoURL: user.photoURL || null,
    jobTitle: existingData.jobTitle || "Team Member",
    onlineStatus: existingData.onlineStatus || "online",
    lastSeen: Date.now(),
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
  const q = query(collection(db, "userProfiles"), where("email", "==", normalizeEmail(email)));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function setUserPresence(status = "online") {
  const user = auth.currentUser;
  if (!user) return;

  const profileRef = doc(db, "userProfiles", user.uid);
  await setDoc(profileRef, {
    uid: user.uid,
    displayName: displayNameFromUser(user),
    email: normalizeEmail(user.email),
    photoURL: user.photoURL || null,
    onlineStatus: status,
    lastSeen: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });
}

// ── Invitations (shared top-level collection) ─────────────────
export async function sendProjectInvitation(targetUser, projectId, role) {
  const sender = auth.currentUser;
  if (!sender) throw new Error("Not authenticated");

  const targetEmail = normalizeEmail(targetUser?.email);
  const targetUid = targetUser?.uid || targetUser?.id || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) throw new Error("INVALID_EMAIL");
  if (targetUid === sender.uid || targetEmail === normalizeEmail(sender.email)) throw new Error("SELF_INVITE");

  const projectRef = userDoc(COLLECTIONS.projects, projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) throw new Error("PROJECT_NOT_FOUND");

  const project = { id: projectSnap.id, ...projectSnap.data() };
  if (project.ownerUid && project.ownerUid !== sender.uid) throw new Error("NOT_PROJECT_OWNER");

  const dupeQuery = query(
    collection(db, COLLECTIONS.invitations),
    where("senderUid", "==", sender.uid),
    where("targetEmail", "==", targetEmail),
    where("projectId", "==", projectId),
    where("status", "==", "pending")
  );
  const dupeSnap = await getDocs(dupeQuery);
  if (!dupeSnap.empty) throw new Error("DUPLICATE_INVITE");

  const ref = await addDoc(collection(db, COLLECTIONS.invitations), {
    senderUid: sender.uid,
    senderName: displayNameFromUser(sender),
    senderEmail: normalizeEmail(sender.email),
    targetUid,
    targetName: targetUser?.displayName || targetUser?.name || targetEmail.split("@")[0] || "User",
    targetEmail,
    targetPhotoURL: targetUser?.photoURL || null,
    projectId,
    projectName: project.name,
    projectColor: project.color || "#00d4c8",
    projectDesc: project.desc || "",
    role,
    status: "pending",
    createdAt: Date.now()
  });

  return { id: ref.id };
}

export async function sendInvitation(targetUser, role, projectId) {
  return sendProjectInvitation(targetUser, projectId, role);
}

export async function fetchPendingInvitations() {
  const uid = requireUserId();
  const email = normalizeEmail(auth.currentUser?.email);
  const queries = [
    query(
      collection(db, COLLECTIONS.invitations),
      where("targetUid", "==", uid),
      where("status", "==", "pending")
    )
  ];

  if (email) {
    queries.push(query(
      collection(db, COLLECTIONS.invitations),
      where("targetEmail", "==", email),
      where("status", "==", "pending")
    ));
  }

  const snapshots = await Promise.all(queries.map((pendingQuery) => getDocs(pendingQuery)));
  const byId = new Map();
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((pendingDoc) => {
      byId.set(pendingDoc.id, { id: pendingDoc.id, ...pendingDoc.data() });
    });
  });

  return sortByNewest([...byId.values()]);
}

export function subscribeToPendingInvitations(onChange, onError) {
  const uid = requireUserId();
  const email = normalizeEmail(auth.currentUser?.email);
  const latestByQuery = new Map();

  const emit = () => {
    const byId = new Map();
    latestByQuery.forEach((items) => {
      items.forEach((item) => byId.set(item.id, item));
    });
    onChange(sortByNewest([...byId.values()]));
  };

  const subscriptions = [];
  const queries = [
    ["uid", query(
      collection(db, COLLECTIONS.invitations),
      where("targetUid", "==", uid),
      where("status", "==", "pending")
    )]
  ];

  if (email) {
    queries.push(["email", query(
      collection(db, COLLECTIONS.invitations),
      where("targetEmail", "==", email),
      where("status", "==", "pending")
    )]);
  }

  queries.forEach(([key, pendingQuery]) => {
    const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      latestByQuery.set(key, snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      emit();
    }, onError);
    subscriptions.push(unsubscribe);
  });

  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export async function acceptInvitationRecord(invitationId) {
  const uid = requireUserId();
  const invRef = doc(db, COLLECTIONS.invitations, invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Invitation not found");

  const inv = invSnap.data();
  const currentEmail = normalizeEmail(auth.currentUser?.email);
  const targetEmail = normalizeEmail(inv.targetEmail);
  const targetMatchesCurrentUser = inv.targetUid === uid || targetEmail === currentEmail;
  if (!targetMatchesCurrentUser) throw new Error("NOT_INVITATION_TARGET");
  if (inv.status !== "pending") throw new Error("INVITATION_NOT_PENDING");

  const ownerProjectRef = doc(db, "users", inv.senderUid, COLLECTIONS.projects, inv.projectId);
  const ownerProjectSnap = await getDoc(ownerProjectRef);
  if (!ownerProjectSnap.exists()) throw new Error("PROJECT_NOT_FOUND");

  const timestamp = Date.now();
  const senderMembersRef = collection(db, "users", inv.senderUid, "members");
  const memberQuery = query(senderMembersRef, where("uid", "==", uid));
  const memberSnap = await getDocs(memberQuery);

  const memberPayload = {
    name: auth.currentUser?.displayName || inv.targetName || currentEmail.split("@")[0] || "User",
    email: currentEmail || targetEmail,
    role: inv.role,
    status: "offline",
    uid,
    photoURL: auth.currentUser?.photoURL || inv.targetPhotoURL || null,
    projectIds: [inv.projectId],
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const batch = writeBatch(db);
  let memberId;

  if (memberSnap.empty) {
    const memberRef = doc(senderMembersRef);
    memberId = memberRef.id;
    batch.set(memberRef, memberPayload);
  } else {
    const memberRef = memberSnap.docs[0].ref;
    memberId = memberSnap.docs[0].id;
    batch.update(memberRef, {
      name: memberPayload.name,
      email: memberPayload.email,
      role: inv.role,
      photoURL: memberPayload.photoURL,
      projectIds: arrayUnion(inv.projectId),
      updatedAt: timestamp
    });
  }

  batch.update(ownerProjectRef, {
    memberIds: arrayUnion(memberId),
    updatedAt: timestamp
  });

  batch.set(doc(db, "users", uid, COLLECTIONS.projects, `shared_${inv.projectId}`), {
    name: inv.projectName,
    desc: inv.projectDesc || `Shared by ${inv.senderName}`,
    color: inv.projectColor || "#00d4c8",
    status: "active",
    ownerUid: inv.senderUid,
    ownerName: inv.senderName,
    ownerEmail: inv.senderEmail,
    sourceProjectId: inv.projectId,
    memberRole: inv.role,
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    memberIds: []
  }, { merge: true });

  batch.update(invRef, {
    status: "accepted",
    targetUid: uid,
    targetName: memberPayload.name,
    targetEmail: memberPayload.email,
    targetPhotoURL: memberPayload.photoURL,
    acceptedAt: timestamp
  });
  await batch.commit();

  return { id: memberId, ...memberPayload };
}

export async function declineInvitationRecord(invitationId) {
  const uid = requireUserId();
  const invRef = doc(db, COLLECTIONS.invitations, invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Invitation not found");
  const inv = invSnap.data();
  const currentEmail = normalizeEmail(auth.currentUser?.email);
  const targetEmail = normalizeEmail(inv.targetEmail);
  if (inv.targetUid !== uid && targetEmail !== currentEmail) throw new Error("NOT_INVITATION_TARGET");

  await updateDoc(invRef, { status: "declined", declinedAt: Date.now() });
}

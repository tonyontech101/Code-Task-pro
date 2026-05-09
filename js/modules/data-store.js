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

export { arrayUnion, arrayRemove };

const COLLECTIONS = {
  tasks: "tasks",
  projects: "projects",
  members: "members",
  notes: "notes",
  teamNotes: "teamNotes",
  invitations: "invitations",
  messages: "messages",
  inbox: "inbox"
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

function currentUserMeta() {
  const user = auth.currentUser;
  return {
    uid: user?.uid || "",
    name: displayNameFromUser(user || {}),
    email: normalizeEmail(user?.email || "")
  };
}

function accessibleWorkspaceUids(projects = state.projects) {
  const uid = auth.currentUser?.uid;
  return [...new Set([
    uid,
    ...projects.map((project) => project.ownerUid).filter(Boolean)
  ].filter(Boolean))];
}

function noteParticipantUids(projects = state.projects, members = state.members) {
  const uid = auth.currentUser?.uid;
  return [...new Set([
    uid,
    ...projects.map((project) => project.ownerUid).filter(Boolean),
    ...members.map((member) => member.uid).filter(Boolean)
  ].filter(Boolean))];
}

function workspaceUidForCurrentUser(projects = state.projects) {
  return projects.find((project) => project.ownerUid && project.ownerUid !== auth.currentUser?.uid)?.ownerUid
    || auth.currentUser?.uid
    || "";
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

async function fetchTeamNotes(projects = state.projects) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snapshot = await getDocs(query(
    collection(db, COLLECTIONS.teamNotes),
    where("participantUids", "array-contains", uid)
  ));

  const workspaces = new Set(accessibleWorkspaceUids(projects));
  return snapshot.docs
    .map((noteDoc) => ({ id: noteDoc.id, teamNoteId: noteDoc.id, ...noteDoc.data(), scope: "team" }))
    .filter((note) => !note.workspaceUid || workspaces.has(note.workspaceUid));
}

export async function fetchVisibleNotes(projects = state.projects) {
  const [personalNotes, teamNotes] = await Promise.all([
    fetchCollection(COLLECTIONS.notes),
    fetchTeamNotes(projects)
  ]);

  return sortByNewest([
    ...personalNotes.map((note) => ({ ...note, scope: note.scope || "personal", storage: "personal" })),
    ...teamNotes.map((note) => ({ ...note, storage: "team" }))
  ]);
}

function uniqueByTaskOwner(items) {
  const byKey = new Map();
  const currentUid = auth.currentUser?.uid || "";
  items.forEach((item) => {
    const key = `${item.ownerUid || currentUid}:${item.id}`;
    const existing = byKey.get(key);
    byKey.set(key, { ...item, readOnly: existing?.readOnly && item.readOnly, sharedTask: existing?.sharedTask || item.sharedTask });
  });
  return sortByNewest([...byKey.values()]);
}

function sharedProjectSources(projects = []) {
  const currentUid = auth.currentUser?.uid;
  return projects.filter((project) => (
    project.ownerUid &&
    project.ownerUid !== currentUid &&
    project.sourceProjectId &&
    project.name
  ));
}

async function fetchSharedProjectTasks(projects = []) {
  const sources = sharedProjectSources(projects);
  const snapshots = await Promise.all(sources.flatMap((project) => [
    getDocs(query(
      collection(db, "users", project.ownerUid, COLLECTIONS.tasks),
      where("project", "==", project.name)
    )),
    getDocs(query(
      collection(db, "users", project.ownerUid, COLLECTIONS.tasks),
      where("projectId", "==", project.sourceProjectId)
    ))
  ]));

  return snapshots.flatMap((snapshot, index) => {
    const project = sources[Math.floor(index / 2)];
    return snapshot.docs.map((taskDoc) => ({
      id: taskDoc.id,
      ...taskDoc.data(),
      project: project.name,
      projectId: project.id,
      sourceProjectId: project.sourceProjectId,
      ownerUid: project.ownerUid,
      sharedProjectName: project.name,
      readOnly: false, // Allow editing shared tasks if you are a member
      sharedTask: true
    }));
  });
}

export async function fetchVisibleTasks(projects = state.projects) {
  const [localTasks, sharedTasks] = await Promise.all([
    fetchCollection(COLLECTIONS.tasks),
    fetchSharedProjectTasks(projects)
  ]);

  return uniqueByTaskOwner([
    ...localTasks.map((task) => ({ ...task, readOnly: false, sharedTask: false })),
    ...sharedTasks
  ]);
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
  const [projects, members, pendingInvitations, inboxItems] = await Promise.all([
    fetchCollection(COLLECTIONS.projects),
    fetchCollection(COLLECTIONS.members),
    fetchPendingInvitations(),
    fetchCollection(COLLECTIONS.inbox)
  ]);
  const tasks = await fetchVisibleTasks(projects);
  const notes = await fetchVisibleNotes(projects);

  state.tasks = tasks;
  state.projects = projects;
  state.members = await enrichMembersWithProfiles(members);
  state.notes = notes;
  state.pendingInvitations = pendingInvitations;
  state.inboxItems = inboxItems;
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

export function subscribeToVisibleTasks(projects = state.projects, onChange, onError) {
  const latestBySource = new Map();

  const emit = () => {
    onChange(uniqueByTaskOwner([...latestBySource.values()].flat()));
  };

  const subscriptions = [
    onSnapshot(userCollection(COLLECTIONS.tasks), (snapshot) => {
      latestBySource.set("local", snapshot.docs.map((taskDoc) => ({
        id: taskDoc.id,
        ...taskDoc.data(),
        readOnly: false,
        sharedTask: false
      })));
      emit();
    }, onError)
  ];

  sharedProjectSources(projects).forEach((project) => {
    const addSharedSnapshot = (key, snapshot) => {
      latestBySource.set(key, snapshot.docs.map((taskDoc) => ({
        id: taskDoc.id,
        ...taskDoc.data(),
        project: project.name,
        projectId: project.id,
        sourceProjectId: project.sourceProjectId,
        ownerUid: project.ownerUid,
        sharedProjectName: project.name,
        readOnly: true,
        sharedTask: true
      })));
      emit();
    };

    subscriptions.push(onSnapshot(query(
      collection(db, "users", project.ownerUid, COLLECTIONS.tasks),
      where("project", "==", project.name)
    ), (snapshot) => addSharedSnapshot(`${project.id}:name`, snapshot), onError));

    subscriptions.push(onSnapshot(query(
      collection(db, "users", project.ownerUid, COLLECTIONS.tasks),
      where("projectId", "==", project.sourceProjectId)
    ), (snapshot) => addSharedSnapshot(`${project.id}:source`, snapshot), onError));
  });

  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export function subscribeToVisibleNotes(projects = state.projects, onChange, onError) {
  const uid = requireUserId();
  const latestBySource = new Map();
  const workspaces = new Set(accessibleWorkspaceUids(projects));

  const emit = () => {
    onChange(sortByNewest([...latestBySource.values()].flat()));
  };

  const subscriptions = [
    onSnapshot(userCollection(COLLECTIONS.notes), (snapshot) => {
      latestBySource.set("personal", snapshot.docs.map((noteDoc) => ({
        id: noteDoc.id,
        ...noteDoc.data(),
        scope: noteDoc.data().scope || "personal",
        storage: "personal"
      })));
      emit();
    }, onError),
    onSnapshot(query(
      collection(db, COLLECTIONS.teamNotes),
      where("participantUids", "array-contains", uid)
    ), (snapshot) => {
      latestBySource.set("team", snapshot.docs
        .map((noteDoc) => ({ id: noteDoc.id, teamNoteId: noteDoc.id, ...noteDoc.data(), scope: "team", storage: "team" }))
        .filter((note) => !note.workspaceUid || workspaces.has(note.workspaceUid)));
      emit();
    }, onError)
  ];

  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export async function createTaskRecord(payload) {
  const timestamp = Date.now();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  // Determine which user's collection this task belongs to.
  // If it's part of a shared project, it should go to the project owner's collection.
  let targetOwnerUid = user.uid;
  if (payload.project && payload.project !== "Unassigned") {
    const proj = state.projects.find(p => p.name === payload.project);
    if (proj && proj.ownerUid && proj.ownerUid !== user.uid) {
      targetOwnerUid = proj.ownerUid;
    }
  }

  const ref = await addDoc(collection(db, "users", targetOwnerUid, COLLECTIONS.tasks), {
    ...payload,
    ownerUid: targetOwnerUid,
    creatorUid: user.uid,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { id: ref.id, ...payload, ownerUid: targetOwnerUid, creatorUid: user.uid, createdAt: timestamp, updatedAt: timestamp };
}

export async function updateTaskRecord(id, payload, ownerUid) {
  const updatedAt = Date.now();
  const docRef = doc(db, "users", ownerUid || requireUserId(), COLLECTIONS.tasks, id);
  await updateDoc(docRef, { ...payload, updatedAt });
  return { ...payload, updatedAt };
}

export async function deleteTaskRecord(id, ownerUid) {
  const docRef = doc(db, "users", ownerUid || requireUserId(), COLLECTIONS.tasks, id);
  await deleteDoc(docRef);
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

  await batch.commit();

  if (targetMemberUid) {
    try {
      // Reciprocal Disconnection: Best effort to remove the current user from the target friend's workspace
      const targetFriendMembersRef = collection(db, "users", targetMemberUid, "members");
      const reciprocalQuery = query(targetFriendMembersRef, where("uid", "==", requireUserId()));
      const reciprocalSnap = await getDocs(reciprocalQuery);
      
      if (!reciprocalSnap.empty) {
        const reciprocalBatch = writeBatch(db);
        reciprocalSnap.forEach((reciprocalDoc) => {
          reciprocalBatch.delete(reciprocalDoc.ref);
        });
        await reciprocalBatch.commit();
      }
    } catch (err) {
      console.warn("Reciprocal disconnection skipped or failed (permission denied):", err);
    }
  }
}

export async function createNoteRecord(payload) {
  const creator = currentUserMeta();
  const timestamp = Date.now();
  const basePayload = {
    ...payload,
    creatorUid: creator.uid,
    creatorName: creator.name,
    creatorEmail: creator.email,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (payload.scope === "team") {
    const ref = await addDoc(collection(db, COLLECTIONS.teamNotes), {
      ...basePayload,
      scope: "team",
      workspaceUid: workspaceUidForCurrentUser(),
      participantUids: noteParticipantUids()
    });

    return { id: ref.id, teamNoteId: ref.id, ...basePayload, scope: "team", storage: "team" };
  }

  const ref = await addDoc(userCollection(COLLECTIONS.notes), {
    ...basePayload,
    scope: "personal"
  });

  return { id: ref.id, ...basePayload, scope: "personal", storage: "personal" };
}

export async function updateNoteRecord(id, payload) {
  const updatedAt = Date.now();
  const existing = state.notes.find((note) => String(note.id) === String(id));

  if (existing?.storage === "team" || existing?.scope === "team") {
    const noteId = existing.teamNoteId || id;
    if (payload.scope === "personal") {
      const personalPayload = {
        ...existing,
        ...payload,
        scope: "personal",
        updatedAt,
        storage: "personal"
      };
      delete personalPayload.id;
      delete personalPayload.teamNoteId;
      delete personalPayload.storage;
      delete personalPayload.participantUids;
      delete personalPayload.workspaceUid;

      const batch = writeBatch(db);
      const personalRef = doc(userCollection(COLLECTIONS.notes));
      batch.set(personalRef, personalPayload);
      batch.delete(doc(db, COLLECTIONS.teamNotes, noteId));
      await batch.commit();
      return { ...personalPayload, id: personalRef.id, storage: "personal" };
    }

    await updateDoc(doc(db, COLLECTIONS.teamNotes, noteId), { ...payload, scope: "team", updatedAt });
    return { ...payload, scope: "team", updatedAt, storage: "team" };
  }

  if (payload.scope === "team") {
    const teamPayload = {
      ...existing,
      ...payload,
      scope: "team",
      updatedAt,
      workspaceUid: workspaceUidForCurrentUser(),
      participantUids: noteParticipantUids()
    };
    delete teamPayload.id;
    delete teamPayload.storage;

    const batch = writeBatch(db);
    const teamRef = doc(collection(db, COLLECTIONS.teamNotes));
    batch.set(teamRef, teamPayload);
    batch.delete(userDoc(COLLECTIONS.notes, id));
    await batch.commit();
    return { ...teamPayload, id: teamRef.id, teamNoteId: teamRef.id, storage: "team" };
  }

  await updateDoc(userDoc(COLLECTIONS.notes, id), { ...payload, updatedAt });
  return { ...payload, updatedAt, storage: "personal" };
}

export async function deleteNoteRecord(id) {
  const existing = state.notes.find((note) => String(note.id) === String(id));
  if (existing?.storage === "team" || existing?.scope === "team") {
    await deleteDoc(doc(db, COLLECTIONS.teamNotes, existing.teamNoteId || id));
    return;
  }
  await deleteDoc(userDoc(COLLECTIONS.notes, id));
}

// ── User Profiles (shared collection for lookup) ──────────────
export async function ensureUserProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const profileRef = doc(db, "userProfiles", user.uid);
  const snap = await getDoc(profileRef);
  const existingData = snap.exists() ? snap.data() : {};

  const isNew = !snap.exists();

  await setDoc(profileRef, {
    uid: user.uid,
    displayName: displayNameFromUser(user),
    email: normalizeEmail(user.email),
    photoURL: user.photoURL || existingData.photoURL || null,
    jobTitle: existingData.jobTitle || "Friend",
    onlineStatus: existingData.onlineStatus || "online",
    lastSeen: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });

  if (isNew) {
    await createInboxItem(user.uid, {
      type: "system",
      icon: "system",
      title: "Welcome to CodeTask!",
      body: "We're glad to have you here. Start by creating a project or inviting your team.",
      project: null,
      time: "Just now"
    });
  }
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

  let project = { name: "Workspace", color: "#94a3b8", desc: "Friend-wide access" };
  if (projectId) {
    const projectRef = userDoc(COLLECTIONS.projects, projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error("PROJECT_NOT_FOUND");
    project = { id: projectSnap.id, ...projectSnap.data() };
    if (project.ownerUid && project.ownerUid !== sender.uid) throw new Error("NOT_PROJECT_OWNER");
  }

  const dupeQuery = query(
    collection(db, COLLECTIONS.invitations),
    where("senderUid", "==", sender.uid),
    where("targetEmail", "==", targetEmail),
    where("projectId", "==", projectId || ""),
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
    projectId: projectId || "",
    projectName: project.name,
    projectColor: project.color || "#00d4c8",
    projectDesc: project.desc || "",
    role,
    senderPhotoURL: sender.photoURL || null,
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
  if (!invitationId) throw new Error("Missing invitation ID");
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
    projectIds: inv.projectId ? [inv.projectId] : [],
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
    const updates = {
      name: memberPayload.name,
      email: memberPayload.email,
      role: inv.role,
      photoURL: memberPayload.photoURL,
      updatedAt: timestamp
    };
    if (inv.projectId) updates.projectIds = arrayUnion(inv.projectId);
    batch.update(memberRef, updates);
  }

  if (inv.projectId) {
    const ownerProjectRef = doc(db, "users", inv.senderUid, COLLECTIONS.projects, inv.projectId);
    batch.update(ownerProjectRef, {
      memberIds: arrayUnion(memberId),
      updatedAt: timestamp
    });
  }

  const teamNotesQuery = query(
    collection(db, COLLECTIONS.teamNotes),
    where("workspaceUid", "==", inv.senderUid)
  );
  const teamNotesSnapshot = await getDocs(teamNotesQuery);
  teamNotesSnapshot.forEach((noteDoc) => {
    batch.update(noteDoc.ref, {
      participantUids: arrayUnion(uid),
      updatedAt: timestamp
    });
  });

  if (inv.projectId) {
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
  }

  // Reciprocal Friendship: Add the sender as a member in the target user's workspace
  const targetMembersRef = collection(db, "users", uid, "members");
  const senderAsMemberQuery = query(targetMembersRef, where("uid", "==", inv.senderUid));
  const senderAsMemberSnap = await getDocs(senderAsMemberQuery);

  const senderAsMemberPayload = {
    name: inv.senderName || inv.senderEmail.split("@")[0] || "Friend",
    email: inv.senderEmail,
    role: "Friend", // Default role for mutual friendship
    status: "offline",
    uid: inv.senderUid,
    photoURL: inv.senderPhotoURL || null,
    projectIds: [], // Workspace-only for the reciprocal link unless it's a mutual project
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (senderAsMemberSnap.empty) {
    batch.set(doc(targetMembersRef), senderAsMemberPayload);
  } else {
    batch.update(senderAsMemberSnap.docs[0].ref, {
      name: senderAsMemberPayload.name,
      email: senderAsMemberPayload.email,
      photoURL: senderAsMemberPayload.photoURL,
      updatedAt: timestamp
    });
  }

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
  if (!invitationId) throw new Error("Missing invitation ID");
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

// ── Messaging (Direct Messages) ───────────────────────────────
export async function sendChatMessageRecord(receiverUid, text) {
  const senderUid = requireUserId();
  const timestamp = Date.now();
  const chatId = [senderUid, receiverUid].sort().join('_');
  
  const ref = await addDoc(collection(db, COLLECTIONS.messages), {
    chatId,
    senderUid,
    receiverUid,
    text,
    timestamp,
    read: false,
    createdAt: serverTimestamp()
  });

  return { id: ref.id, senderUid, receiverUid, text, timestamp };
}

export function subscribeToChatMessages(otherUid, onUpdate, onError) {
  const myUid = requireUserId();
  const chatId = [myUid, otherUid].sort().join('_');
  
  // Query for messages in this specific chat
  const q = query(
    collection(db, COLLECTIONS.messages),
    where("chatId", "==", chatId)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    onUpdate(messages);
  }, onError);
}

// ── Inbox / Notifications ─────────────────────────────────────
export function subscribeToIncomingMessages(onUpdate, onError) {
  const myUid = requireUserId();
  const q = query(
    collection(db, COLLECTIONS.messages),
    where("receiverUid", "==", myUid)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    onUpdate(messages);
  }, onError);
}

export async function markChatMessagesReadRecord(senderUid) {
  const myUid = requireUserId();
  const q = query(
    collection(db, COLLECTIONS.messages),
    where("receiverUid", "==", myUid),
    where("senderUid", "==", senderUid),
    where("read", "==", false)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(message => {
    batch.update(message.ref, { read: true });
  });
  await batch.commit();
}

export function subscribeToInboxItems(onChange, onError) {
  return onSnapshot(userCollection(COLLECTIONS.inbox), (snapshot) => {
    onChange(sortByNewest(snapshot.docs.map(hydrateDoc)));
  }, onError);
}

export async function createInboxItem(targetUid, payload) {
  const timestamp = Date.now();
  const data = {
    ...payload,
    createdAt: timestamp,
    read: false
  };
  
  // If targetUid is provided, we write to THAT user's inbox collection
  const ref = targetUid 
    ? collection(db, "users", targetUid, COLLECTIONS.inbox)
    : userCollection(COLLECTIONS.inbox);
    
  await addDoc(ref, data);
}

export async function updateInboxItemRecord(id, payload) {
  await updateDoc(userDoc(COLLECTIONS.inbox, id), { ...payload, updatedAt: Date.now() });
}

export async function deleteInboxItemRecord(id) {
  await deleteDoc(userDoc(COLLECTIONS.inbox, id));
}

export async function markAllInboxReadRecord() {
  const q = query(userCollection(COLLECTIONS.inbox), where("read", "==", false));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach(d => {
    batch.update(d.ref, { read: true, updatedAt: Date.now() });
  });
  await batch.commit();
}

export async function clearInboxCollection() {
  const snapshot = await getDocs(userCollection(COLLECTIONS.inbox));
  const batch = writeBatch(db);
  snapshot.forEach(d => {
    batch.delete(d.ref);
  });
  await batch.commit();
}

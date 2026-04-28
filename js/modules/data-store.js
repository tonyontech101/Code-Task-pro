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
  notes: "notes",
  messages: "messages"
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

  // Deduplicate members by UID
  const uniqueMembers = [];
  const seenUids = new Set();
  members.forEach(m => {
    if (m.uid && !seenUids.has(m.uid)) {
      seenUids.add(m.uid);
      uniqueMembers.push(m);
    } else if (!m.uid) {
      // Keep records without UID (though there shouldn't be any now)
      uniqueMembers.push(m);
    }
  });
  state.members = uniqueMembers;

  // Load personal notes
  let allNotes = notes;

  // Load team-scoped notes from teammates
  try {
    const teamNotes = await loadTeamNotes(state.members);
    allNotes = [...allNotes, ...teamNotes];
  } catch (err) {
    console.error("Failed to load team notes:", err);
  }

  state.notes = allNotes;
}

export async function loadTeamNotes(members) {
  const teamNotes = [];

  for (const member of members) {
    if (!member.uid) continue;

    try {
      // Query team-scoped notes from teammate's workspace
      const teamNotesQuery = query(
        collection(db, "users", member.uid, "notes"),
        where("scope", "==", "team")
      );
      const snapshot = await getDocs(teamNotesQuery);

      snapshot.docs.forEach(doc => {
        const noteData = hydrateDoc(doc);
        // Add metadata to indicate this is a team note from a teammate
        noteData.sharedBy = member.id;
        noteData.sharedByName = member.name;
        teamNotes.push(noteData);
      });
    } catch (err) {
      console.error(`Failed to load team notes from ${member.name}:`, err);
    }
  }

  return teamNotes;
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
  const currentUserUid = requireUserId();
  const invRef = doc(db, "invitations", invitationId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Invitation not found");

  const inv = invSnap.data();
  if (inv.targetUid !== currentUserUid) throw new Error("This invitation is not for you.");

  // Fetch full profiles for both users to get the latest data
  const [senderProfile, targetProfile] = await Promise.all([
    getUserProfile(inv.senderUid),
    getUserProfile(inv.targetUid)
  ]);

  if (!senderProfile || !targetProfile) {
    throw new Error("Could not find user profiles for team members.");
  }

  // Update invitation status
  await updateDoc(invRef, { status: "accepted", acceptedAt: Date.now() });

  // --- Create/Update member record in the SENDER's workspace (target becomes a member for sender) ---
  const senderMembersRef = collection(db, "users", inv.senderUid, "members");
  const senderCheckQuery = query(senderMembersRef, where("uid", "==", inv.targetUid));
  const senderCheckSnap = await getDocs(senderCheckQuery);

  const memberPayload = {
    name: targetProfile.displayName,
    email: targetProfile.email,
    jobTitle: targetProfile.jobTitle || "Team Member",
    photoURL: targetProfile.photoURL || null,
    role: inv.role,
    status: "online", // Assuming user is online when they accept
    uid: inv.targetUid,
    updatedAt: Date.now()
  };

  if (senderCheckSnap.empty) {
    await addDoc(senderMembersRef, { ...memberPayload, createdAt: Date.now() });
  } else {
    const memberDocId = senderCheckSnap.docs[0].id;
    await updateDoc(doc(db, "users", inv.senderUid, "members", memberDocId), memberPayload);
  }

  // --- Create/Update reciprocal member record in the TARGET's workspace (sender becomes a member for target) ---
  const targetMembersRef = collection(db, "users", currentUserUid, "members");
  const targetCheckQuery = query(targetMembersRef, where("uid", "==", inv.senderUid));
  const targetCheckSnap = await getDocs(targetCheckQuery);

  const reciprocalPayload = {
    name: senderProfile.displayName,
    email: senderProfile.email,
    jobTitle: senderProfile.jobTitle || "Team Lead",
    photoURL: senderProfile.photoURL || null,
    role: "Team Lead", // The person who invites is the lead in this context
    status: "online", // We don't know their real status, but 'online' is a safe default
    uid: inv.senderUid,
    updatedAt: Date.now()
  };

  if (targetCheckSnap.empty) {
    await addDoc(targetMembersRef, { ...reciprocalPayload, createdAt: Date.now() });
  } else {
    const reciprocalDocId = targetCheckSnap.docs[0].id;
    await updateDoc(doc(db, "users", currentUserUid, "members", reciprocalDocId), reciprocalPayload);
  }

  return { success: true };
}

export async function declineInvitationRecord(invitationId) {
  const invRef = doc(db, "invitations", invitationId);
  await updateDoc(invRef, { status: "declined", declinedAt: Date.now() });
}

// ── Messaging ─────────────────────────────────────────────────
export async function sendChatMessageRecord(receiverUid, text) {
  const senderUid = requireUserId();
  const participants = [senderUid, receiverUid].sort();
  
  const ref = await addDoc(collection(db, COLLECTIONS.messages), {
    senderUid,
    receiverUid,
    participants,
    text,
    timestamp: serverTimestamp()
  });

  // Increment recipient's chat meta unread count and update preview
  try {
    await incrementChatMeta(receiverUid, senderUid, text);
  } catch (err) {
    console.error('Failed to update recipient chat meta after sending message', err);
  }
  return ref.id;
}

// Chat meta — per-user metadata for conversations (unread counts, last message)
export async function incrementChatMeta(targetUid, otherUid, preview) {
  try {
    const ref = doc(db, "users", targetUid, "chatMeta", otherUid);
    const snap = await getDoc(ref);
    const now = Date.now();
    if (!snap.exists()) {
      await setDoc(ref, {
        unreadCount: 1,
        lastMessageAt: now,
        lastMessagePreview: preview || '',
        updatedAt: now
      });
    } else {
      const data = snap.data();
      const next = (data.unreadCount || 0) + 1;
      await updateDoc(ref, {
        unreadCount: next,
        lastMessageAt: now,
        lastMessagePreview: preview || '',
        updatedAt: now
      });
    }
  } catch (err) {
    console.error('Failed to increment chat meta:', err);
  }
}

export async function markChatMetaSeen(otherUid) {
  try {
    const uid = requireUserId();
    const ref = doc(db, "users", uid, "chatMeta", otherUid);
    const now = Date.now();
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // create with zero unread
      await setDoc(ref, { unreadCount: 0, lastSeenAt: now, updatedAt: now });
    } else {
      await updateDoc(ref, { unreadCount: 0, lastSeenAt: now, updatedAt: now });
    }
  } catch (err) {
    console.error('Failed to mark chat meta seen:', err);
  }
}

export function subscribeToChatMeta(callback) {
  try {
    const uid = requireUserId();
    const q = query(collection(db, "users", uid, "chatMeta"), orderBy("lastMessageAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.error("Chat meta subscription error:", err);
    });
  } catch (err) {
    console.error('Failed to subscribe to chat meta:', err);
    return () => {};
  }
}

export function subscribeToChat(otherUid, callback) {
  const currentUserUid = requireUserId();
  const participants = [currentUserUid, otherUid].sort();
  
  const q = query(
    collection(db, COLLECTIONS.messages),
    where("participants", "==", participants)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      const tsMs = data.timestamp ? data.timestamp.toMillis() : Date.now();
      return {
        id: doc.id,
        ...data,
        // numeric timestamp for reconciliation
        timestampMs: tsMs,
        // Handle potential null timestamp during local update
        time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        date: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
        from: data.senderUid === currentUserUid ? 'me' : 'them'
      };
    }).sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || Date.now();
      const timeB = b.timestamp?.toMillis() || Date.now();
      return timeA - timeB;
    });
    callback(messages);
  }, (error) => {
    console.error("Chat subscription error:", error);
  });
}

export function subscribeToAllMessages(callback) {
  const currentUserUid = requireUserId();
  
  // Use array-contains to find any message where the user is a participant
  const q = query(
    collection(db, COLLECTIONS.messages),
    where("participants", "array-contains", currentUserUid)
  );
  
  return onSnapshot(q, (snapshot) => {
    const allMessages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        date: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
        from: data.senderUid === currentUserUid ? 'me' : 'them'
      };
    });
    
    // Group messages by the OTHER participant's UID
    const conversations = {};
    allMessages.forEach(msg => {
      const otherUid = msg.participants.find(uid => uid !== currentUserUid);
      if (!otherUid) return;
      
      if (!conversations[otherUid]) conversations[otherUid] = [];
      conversations[otherUid].push(msg);
    });
    
    // Sort each conversation by timestamp
    Object.keys(conversations).forEach(uid => {
      conversations[uid].sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
    });
    
    callback(conversations);
  }, (error) => {
    console.error("Global messages subscription error:", error);
  });
}

// ── Inbox Notifications ─────────────────────────────────────────
export async function createNotificationRecord(targetUid, payload) {
  const ref = collection(db, "users", targetUid, "notifications");
  await addDoc(ref, {
    ...payload,
    createdAt: Date.now(),
    read: false
  });
}

export function subscribeToNotifications(callback) {
  const uid = requireUserId();
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtRaw = data.createdAt;
      const createdAt = typeof createdAtRaw === 'number'
        ? createdAtRaw
        : (createdAtRaw && typeof createdAtRaw.toMillis === 'function' ? createdAtRaw.toMillis() : Date.now());
      return { id: doc.id, ...data, createdAt };
    });
    callback(notifications);
  }, (error) => {
    console.error("Notifications subscription error:", error);
  });
}

export async function updateNotificationRead(id, readStatus) {
  const uid = requireUserId();
  const ref = doc(db, "users", uid, "notifications", id);
  await updateDoc(ref, { read: readStatus });
}

export async function deleteNotificationRecord(id) {
  const uid = requireUserId();
  const ref = doc(db, "users", uid, "notifications", id);
  await deleteDoc(ref);
}

export async function clearAllNotificationsRecord() {
  const uid = requireUserId();
  const q = query(collection(db, "users", uid, "notifications"));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

export async function markAllNotificationsReadRecord() {
  const uid = requireUserId();
  const q = query(collection(db, "users", uid, "notifications"), where("read", "==", false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
  await batch.commit();
}

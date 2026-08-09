import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseServices } from "./client";

export async function registerWithOrganization(input: {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}) {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  const credential = await createUserWithEmailAndPassword(
    services.auth,
    input.email,
    input.password,
  );

  try {
    await updateProfile(credential.user, { displayName: input.fullName });
    const organizationRef = doc(collection(services.db, "organizations"));
    const userRef = doc(services.db, "users", credential.user.uid);
    const batch = writeBatch(services.db);
    batch.set(organizationRef, {
      name: input.organizationName.trim(),
      ownerId: credential.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(userRef, {
      uid: credential.user.uid,
      organizationId: organizationRef.id,
      fullName: input.fullName.trim(),
      email: input.email.toLocaleLowerCase("tr-TR"),
      role: "owner",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return credential.user;
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string) {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  return signInWithEmailAndPassword(services.auth, email, password);
}

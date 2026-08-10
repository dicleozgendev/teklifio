import {
  createUserWithEmailAndPassword,
  deleteUser,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
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
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(userRef, {
      uid: credential.user.uid,
      organizationId: organizationRef.id,
      fullName: input.fullName.trim(),
      email: input.email.toLocaleLowerCase("tr-TR"),
      role: "owner",
      emailVerificationRequired: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    await sendEmailVerification(credential.user, {
      url: window.location.origin,
      handleCodeInApp: false,
    }).catch(() => undefined);
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

export async function requestPasswordReset(email: string) {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase yapılandırılmadı.");
  await sendPasswordResetEmail(services.auth, email.trim(), {
    url: window.location.origin,
    handleCodeInApp: false,
  });
}

export async function resendVerificationEmail() {
  const services = getFirebaseServices();
  const user = services?.auth.currentUser;
  if (!user) throw new Error("Firebase oturumu bulunamadı.");
  await sendEmailVerification(user, {
    url: window.location.origin,
    handleCodeInApp: false,
  });
}

export async function refreshEmailVerification() {
  const services = getFirebaseServices();
  const user = services?.auth.currentUser;
  if (!user) throw new Error("Firebase oturumu bulunamadı.");
  await reload(user);
  return user.emailVerified;
}

export async function updateAccountName(fullName: string) {
  const services = getFirebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Firebase oturumu bulunamadı.");
  const normalizedName = fullName.trim();
  if (!normalizedName) throw new Error("Ad soyad boş bırakılamaz.");
  await updateProfile(user, { displayName: normalizedName });
  await setDoc(doc(services.db, "users", user.uid), {
    fullName: normalizedName,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

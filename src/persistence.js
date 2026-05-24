import { db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection, writeBatch } from 'firebase/firestore';

// Save a single order
export const saveOrder = async (orderId, orderData) => {
  // Strip synced property before saving to DB
  const { synced, ...dbPayload } = orderData;
  await setDoc(doc(db, 'orders', orderId), dbPayload);
  return true;
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus) => {
  await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  return true;
};

// Delete order
export const deleteOrder = async (orderId) => {
  await deleteDoc(doc(db, 'orders', orderId));
  return true;
};

// Reset database
export const resetDatabase = async () => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  const batch = writeBatch(db);
  querySnapshot.forEach((document) => {
    batch.delete(doc(db, 'orders', document.id));
  });
  await batch.commit();
  return true;
};

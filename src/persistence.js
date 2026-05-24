import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

// Save a single order directly to Firestore
export const saveOrder = async (orderId, orderData) => {
  try {
    await setDoc(doc(db, 'orders', orderId), orderData);
    return true;
  } catch (err) {
    console.error("Could not save order to Firestore:", err);
    throw err;
  }
};

// Update order status in Firestore
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    return true;
  } catch (err) {
    console.error("Could not update order status in Firestore:", err);
    throw err;
  }
};

// Delete order from Firestore
export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    return true;
  } catch (err) {
    console.error("Could not delete order from Firestore:", err);
    throw err;
  }
};

// Reset database completely (batch delete all orders in Firestore)
export const resetDatabase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const batch = writeBatch(db);
    querySnapshot.forEach((document) => {
      batch.delete(doc(db, 'orders', document.id));
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error("Could not reset Firestore database:", err);
    throw err;
  }
};

import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

// Resilient promise timeout helper to prevent hanging on Firestore queries
const withTimeout = (promise, ms = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out')), ms))
  ]);
};

// Get all orders from localStorage safely
export const getLocalOrders = () => {
  try {
    const saved = localStorage.getItem('biriyani_orders');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Error reading from localStorage:", e);
    return [];
  }
};

// Save all orders to localStorage safely
export const saveLocalOrders = (orders) => {
  try {
    localStorage.setItem('biriyani_orders', JSON.stringify(orders));
  } catch (e) {
    console.error("Error writing to localStorage:", e);
  }
};

// Save a single order
export const saveOrder = async (orderId, orderData) => {
  const localOrders = getLocalOrders();
  const existingIndex = localOrders.findIndex(o => o._id === orderId);
  
  const orderToSave = {
    ...orderData,
    _id: orderId,
    synced: false
  };

  if (existingIndex > -1) {
    localOrders[existingIndex] = { ...localOrders[existingIndex], ...orderToSave };
  } else {
    localOrders.unshift(orderToSave);
  }
  
  saveLocalOrders(localOrders);

  // Sync to Cloud Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const { synced, ...dbPayload } = orderToSave;
      await withTimeout(setDoc(doc(db, 'orders', orderId), dbPayload), 2000);
      
      // Update synced status in localStorage
      const updatedOrders = getLocalOrders();
      const updatedIndex = updatedOrders.findIndex(o => o._id === orderId);
      if (updatedIndex > -1) {
        updatedOrders[updatedIndex].synced = true;
        saveLocalOrders(updatedOrders);
      }
      return true;
    } catch (err) {
      console.warn("Cloud Firestore save bypassed or timed out, saved locally:", err);
    }
  }
  return false;
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus) => {
  const localOrders = getLocalOrders();
  const index = localOrders.findIndex(o => o._id === orderId);
  
  if (index > -1) {
    localOrders[index].status = newStatus;
    localOrders[index].synced = false;
    saveLocalOrders(localOrders);
  }

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(updateDoc(doc(db, 'orders', orderId), { status: newStatus }), 2000);
      
      const updatedOrders = getLocalOrders();
      const updatedIndex = updatedOrders.findIndex(o => o._id === orderId);
      if (updatedIndex > -1) {
        updatedOrders[updatedIndex].synced = true;
        saveLocalOrders(updatedOrders);
      }
      return true;
    } catch (err) {
      console.warn("Cloud Firestore status update bypassed or timed out:", err);
    }
  }
  return false;
};

// Delete order
export const deleteOrder = async (orderId) => {
  const localOrders = getLocalOrders();
  const filtered = localOrders.filter(o => o._id !== orderId);
  saveLocalOrders(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'orders', orderId)), 2000);
      return true;
    } catch (err) {
      console.warn("Cloud Firestore delete bypassed or timed out:", err);
    }
  }
  return false;
};

// Reset database
export const resetDatabase = async () => {
  saveLocalOrders([]);

  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'orders')), 2000);
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await withTimeout(batch.commit(), 2000);
      return true;
    } catch (err) {
      console.warn("Cloud Firestore database reset bypassed or timed out:", err);
    }
  }
  return false;
};

// Non-destructive merge logic
export const mergeLocalAndRemoteOrders = (local, remote) => {
  const mergedMap = new Map();

  // 1. Load all local orders (serves as absolute history baseline)
  local.forEach(order => {
    if (order && order._id) {
      mergedMap.set(order._id, order);
    }
  });

  // 2. Overlay remote Firestore orders
  remote.forEach(order => {
    if (order && order._id) {
      const existing = mergedMap.get(order._id);
      mergedMap.set(order._id, {
        ...existing,
        ...order,
        synced: true
      });
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

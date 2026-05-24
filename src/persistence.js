import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

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

// Save a single order locally and try syncing to Firestore
export const saveOrder = async (orderId, orderData) => {
  const localOrders = getLocalOrders();
  const existingIndex = localOrders.findIndex(o => o._id === orderId);
  
  const orderToSave = {
    ...orderData,
    _id: orderId,
    synced: false // Default to false, will set to true if firestore write succeeds
  };

  if (existingIndex > -1) {
    localOrders[existingIndex] = { ...localOrders[existingIndex], ...orderToSave };
  } else {
    localOrders.unshift(orderToSave);
  }
  
  saveLocalOrders(localOrders);

  // Attempt Firestore sync
  if (db && typeof db.app !== 'undefined') {
    try {
      // Omit helper properties like 'synced' from the database payload
      const { synced, ...dbPayload } = orderToSave;
      await setDoc(doc(db, 'orders', orderId), dbPayload);
      
      // Mark as synced locally
      const updatedOrders = getLocalOrders();
      const updatedIndex = updatedOrders.findIndex(o => o._id === orderId);
      if (updatedIndex > -1) {
        updatedOrders[updatedIndex].synced = true;
        saveLocalOrders(updatedOrders);
      }
      return true;
    } catch (err) {
      console.warn("Could not sync order to Firestore:", err);
    }
  }
  return false;
};

// Update order status locally and try syncing to Firestore
export const updateOrderStatus = async (orderId, newStatus) => {
  const localOrders = getLocalOrders();
  const index = localOrders.findIndex(o => o._id === orderId);
  
  if (index > -1) {
    localOrders[index].status = newStatus;
    localOrders[index].synced = false;
    saveLocalOrders(localOrders);
  }

  if (db && typeof db.app !== 'undefined') {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      // Mark as synced locally
      const updatedOrders = getLocalOrders();
      const updatedIndex = updatedOrders.findIndex(o => o._id === orderId);
      if (updatedIndex > -1) {
        updatedOrders[updatedIndex].synced = true;
        saveLocalOrders(updatedOrders);
      }
      return true;
    } catch (err) {
      console.warn("Could not sync status update to Firestore:", err);
    }
  }
  return false;
};

// Delete order locally and try syncing to Firestore
export const deleteOrder = async (orderId) => {
  const localOrders = getLocalOrders();
  const filtered = localOrders.filter(o => o._id !== orderId);
  saveLocalOrders(filtered);

  if (db && typeof db.app !== 'undefined') {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      return true;
    } catch (err) {
      console.warn("Could not sync deletion to Firestore:", err);
    }
  }
  return false;
};

// Reset database locally and try syncing to Firestore
export const resetDatabase = async () => {
  saveLocalOrders([]);

  if (db && typeof db.app !== 'undefined') {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.warn("Could not sync database reset to Firestore:", err);
    }
  }
  return false;
};

// Merge local and remote orders intelligently
export const mergeLocalAndRemoteOrders = (local, remote) => {
  const mergedMap = new Map();

  // 1. Keep local orders that are NOT synced yet (offline created/updated)
  local.forEach(order => {
    if (order && order._id && order.synced === false) {
      mergedMap.set(order._id, order);
    }
  });

  // 2. Add remote orders (source of truth for synced ones)
  remote.forEach(order => {
    if (order && order._id) {
      mergedMap.set(order._id, {
        ...order,
        synced: true // Since it came from Firestore
      });
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

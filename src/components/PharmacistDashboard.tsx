import React, { useState, useEffect } from 'react';
import { useAuth, sanitizeFirestoreDoc } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { PharmacistProfile, PharmacyOrder, PharmacyInventoryItem } from '../types';
import { mockMedicines } from '../data/catalog';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ShoppingBag, CheckCircle2, XCircle, AlertTriangle, Truck, 
  FileText, Clock, LogOut, Package, ArrowRight, ShieldCheck, Eye, X, AlertCircle, Loader2, Plus,
  Edit3, Trash2, DollarSign, Filter, Search
} from 'lucide-react';

export const PharmacistDashboard: React.FC = () => {
  const { currentUser, logout, pharmacyOrders, dataLoading, updatePharmacyOrder } = useAuth();
  const pharma = currentUser as PharmacistProfile;

  const [inventory, setInventory] = useState<PharmacyInventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);

  const [selectedRxOrder, setSelectedRxOrder] = useState<PharmacyOrder | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<PharmacyOrder | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('Prescription image is blurry or expired.');

  // Inventory Modal State
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PharmacyInventoryItem | null>(null);

  // Form fields for Add/Edit Medicine
  const [formSelectedCatalogId, setFormSelectedCatalogId] = useState<string>('custom');
  const [formMedicineName, setFormMedicineName] = useState<string>('');
  const [formSalt, setFormSalt] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formMrp, setFormMrp] = useState<string>('150');
  const [formPrice, setFormPrice] = useState<string>('120');
  const [formStock, setFormStock] = useState<string>('100');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('12/2028');
  const [formRequiresRx, setFormRequiresRx] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time pharmacy inventory from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    const q = query(collection(db, 'pharmacyInventory'), where('pharmacyId', '==', currentUser.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: PharmacyInventoryItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          ...data,
          id: docSnap.id,
          medicineName: data.medicineName || data.name || 'Medicine',
          stock: data.stock ?? data.stockCount ?? 0,
          stockCount: data.stockCount ?? data.stock ?? 0,
        } as PharmacyInventoryItem);
      });
      setInventory(items);
      setInventoryLoading(false);
    }, (err) => {
      console.warn('pharmacyInventory subscription error:', err);
      setInventoryLoading(false);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormSelectedCatalogId('custom');
    setFormMedicineName('');
    setFormSalt('');
    setFormCategory('General');
    setFormMrp('150');
    setFormPrice('120');
    setFormStock('100');
    setFormExpiryDate('12/2028');
    setFormRequiresRx(false);
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item: PharmacyInventoryItem) => {
    setEditingItem(item);
    setFormSelectedCatalogId('custom');
    setFormMedicineName(item.medicineName || item.name || '');
    setFormSalt(item.salt || '');
    setFormCategory(item.category || 'General');
    setFormMrp(String(item.mrp || item.price || 100));
    setFormPrice(String(item.price || 100));
    setFormStock(String(item.stock ?? item.stockCount ?? 0));
    setFormExpiryDate(item.expiryDate || '12/2028');
    setFormRequiresRx(!!item.requiresRx);
    setShowItemModal(true);
  };

  const handleSelectCatalogItem = (catalogId: string) => {
    setFormSelectedCatalogId(catalogId);
    if (catalogId === 'custom') return;
    const catMed = mockMedicines.find(m => m.id === catalogId);
    if (catMed) {
      setFormMedicineName(catMed.name);
      setFormSalt(catMed.salt);
      setFormCategory(catMed.category);
      setFormMrp(String(catMed.price));
      setFormPrice(String(catMed.discountPrice));
      setFormStock(String(catMed.stockCount));
      setFormRequiresRx(catMed.requiresRx);
      setFormExpiryDate(catMed.expiryDate || '12/2028');
    }
  };

  const handleSaveInventoryItem = async () => {
    if (!currentUser?.id) return;
    if (!formMedicineName.trim()) {
      showToast('Medicine name is required.', true);
      return;
    }

    const stockNum = parseInt(formStock, 10) || 0;
    const priceNum = parseFloat(formPrice) || 0;
    const mrpNum = parseFloat(formMrp) || priceNum;

    const docId = editingItem ? editingItem.id : `INV-${currentUser.id}-${Date.now().toString().slice(-6)}`;

    const itemData = {
      id: docId,
      pharmacyId: currentUser.id,
      medicineName: formMedicineName.trim(),
      name: formMedicineName.trim(),
      salt: formSalt.trim(),
      category: formCategory,
      mrp: mrpNum,
      price: priceNum,
      stock: stockNum,
      stockCount: stockNum,
      expiryDate: formExpiryDate.trim() || '12/2028',
      requiresRx: formRequiresRx,
      lastUpdated: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'pharmacyInventory', docId), sanitizeFirestoreDoc(itemData));
      showToast(editingItem ? 'Inventory item updated!' : 'Medicine added to inventory!');
      setShowItemModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save inventory item.', true);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'pharmacyInventory', itemId));
      showToast('Medicine removed from inventory.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete item.', true);
    }
  };

  const handleSeedInventory = async () => {
    if (!currentUser?.id) return;
    setInventoryLoading(true);
    try {
      for (const item of mockMedicines) {
        const docId = `INV-${currentUser.id}-${item.id}`;
        await setDoc(doc(db, 'pharmacyInventory', docId), sanitizeFirestoreDoc({
          id: docId,
          pharmacyId: currentUser.id,
          medicineName: item.name,
          name: item.name,
          salt: item.salt,
          category: item.category,
          mrp: item.price,
          price: item.discountPrice,
          stock: item.stockCount,
          stockCount: item.stockCount,
          expiryDate: item.expiryDate || '12/2028',
          requiresRx: item.requiresRx,
          lastUpdated: new Date().toISOString()
        }));
      }
      showToast('Full catalog initialized into pharmacy inventory!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to initialize inventory.', true);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleApproveRx = async (orderId: string) => {
    if (isProcessingOrder) return;
    const targetOrder = pharmacyOrders.find(o => o.id === orderId);
    if (!targetOrder) return;

    setIsProcessingOrder(true);
    try {
      // Transaction to check stock & decrement
      await runTransaction(db, async (transaction) => {
        // Step 1: Check stock sufficiency
        for (const item of targetOrder.items) {
          const matchedInv = inventory.find(
            inv => inv.id === item.medicineId || inv.medicineName === item.medicineName
          );
          if (matchedInv) {
            const itemRef = doc(db, 'pharmacyInventory', matchedInv.id);
            const itemSnap = await transaction.get(itemRef);
            if (itemSnap.exists()) {
              const d = itemSnap.data();
              const avail = d.stock ?? d.stockCount ?? 0;
              if (avail < item.quantity) {
                throw new Error(`Insufficient stock for "${item.medicineName}". Available: ${avail}, Ordered: ${item.quantity}`);
              }
            }
          }
        }

        // Step 2: Decrement stock
        for (const item of targetOrder.items) {
          const matchedInv = inventory.find(
            inv => inv.id === item.medicineId || inv.medicineName === item.medicineName
          );
          if (matchedInv) {
            const itemRef = doc(db, 'pharmacyInventory', matchedInv.id);
            const itemSnap = await transaction.get(itemRef);
            if (itemSnap.exists()) {
              const d = itemSnap.data();
              const avail = d.stock ?? d.stockCount ?? 0;
              const updatedStock = Math.max(0, avail - item.quantity);
              transaction.update(itemRef, { stock: updatedStock, stockCount: updatedStock });
            }
          }
        }

        // Step 3: Update order status to Packed
        const orderRef = doc(db, 'pharmacyOrders', orderId);
        transaction.update(orderRef, { status: 'Packed' });
      });

      setSelectedRxOrder(null);
      showToast(`Order ${orderId} verified & marked as PACKED. Stock decremented!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve order.', true);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRejectRx = async () => {
    if (!rejectReasonModal || isProcessingOrder) return;
    setIsProcessingOrder(true);
    try {
      await updatePharmacyOrder(rejectReasonModal.id, { status: 'Rejected', rejectionReason: rejectReasonText });
      setRejectReasonModal(null);
      showToast(`Order ${rejectReasonModal.id} rejected.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject order.', true);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    try {
      await updatePharmacyOrder(orderId, { status: 'Out for delivery', deliveryPartner: 'Express Delivery (+91 98110 55443)' });
      showToast(`Order ${orderId} dispatched with delivery partner!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to dispatch order.', true);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleMarkPaymentReceived = async (orderId: string) => {
    try {
      await updatePharmacyOrder(orderId, { paymentStatus: 'Paid' });
      showToast(`Payment marked as Received for order ${orderId}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment status.', true);
    }
  };

  return (
    <div className="min-h-screen mesh-bg-light dark:mesh-bg-dark flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 ${toastMessage.isError ? 'bg-red-600 border-red-400' : 'bg-[#10B981] border-emerald-300'} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border`}>
          {toastMessage.isError ? <AlertCircle className="w-5 h-5 text-white shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="glass-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm bg-white/95 dark:bg-slate-950/95 border-b border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <HealthPilotLogo size="sm" />
          <span className="text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-[#10B981] px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> Pharmacy Dispensation Hub
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-extrabold text-[#0A1A45] dark:text-white block leading-none">{pharma.pharmacyName || 'Apollo Medicos'}</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">DL: {pharma.drugLicenceNumber || 'DL-20B-99120'}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Pharmacy Top Banner */}
        <div className="bg-gradient-to-r from-[#10B981] via-emerald-600 to-[#0B2A6F] text-white p-6 rounded-[32px] shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25">
                GSTIN: {pharma.gstNumber || '09AAACA1234F1Z5'}
              </span>
              <span className="text-xs text-emerald-100 font-extrabold">Active Dispensing Partner</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{pharma.pharmacyName || 'Apollo Medicos & Healthcare Hub'}</h2>
            <p className="text-xs text-emerald-100 mt-1 font-medium">
              {pharma.pharmacyAddress || 'Sector 63, Noida, Uttar Pradesh'}
            </p>
          </div>
          <div className="flex gap-3 relative z-10">
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/25 text-center shadow-inner">
              <span className="text-[10px] text-emerald-100 uppercase block font-semibold">Rx Pending Verification</span>
              <strong className="text-xl font-extrabold">{pharmacyOrders.filter(o => o.status === 'Placed').length} Orders</strong>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/25 text-center shadow-inner">
              <span className="text-[10px] text-emerald-100 uppercase block font-semibold">Ready for Dispatch</span>
              <strong className="text-xl font-extrabold">{pharmacyOrders.filter(o => o.status === 'Packed').length} Orders</strong>
            </div>
          </div>
        </div>

        {/* Prescription Verification & Orders Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-[32px] p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0A1A45] dark:text-white">
                Prescription (Rx) Verification Queue
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Verify doctor signature & matching medicine stock before approving and packing.</p>
            </div>
            <span className="text-xs font-bold text-emerald-900 dark:text-[#10B981] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl">
              Mandatory Pharmacist Sign-Off
            </span>
          </div>

          <div className="space-y-3">
            {dataLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
                <span className="text-xs font-semibold">Syncing pharmacy orders...</span>
              </div>
            ) : pharmacyOrders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No medicine orders yet</h4>
                <p className="text-xs text-slate-500 mt-1">When patients place medicine orders with your pharmacy, they will appear here in real time.</p>
              </div>
            ) : (
              pharmacyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{ord.id}</span>
                    <span className="text-xs font-bold text-slate-500">• {ord.patientName}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      ord.status === 'Placed' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                      ord.status === 'Packed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300' :
                      ord.status === 'Out for delivery' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300' :
                      ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                    }`}>
                      {ord.status}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ord.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {ord.paymentStatus === 'Paid' ? `Paid (${ord.paymentMethod || 'COD'})` : `Pending (${ord.paymentMethod || 'Cash on Delivery'})`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Items: {ord.items.map(i => `${i.medicineName} (x${i.quantity})`).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Delivery Address: {ord.deliveryAddress} • Amount: <strong>₹{ord.totalAmount}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => handleMarkPaymentReceived(ord.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  )}
                  {ord.status === 'Placed' && (
                    <>
                      {ord.rxAttached && (
                        <button
                          onClick={() => setSelectedRxOrder(ord)}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Rx
                        </button>
                      )}
                      <button
                        disabled={isProcessingOrder}
                        onClick={() => handleApproveRx(ord.id)}
                        className="px-3.5 py-2 bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Pack
                      </button>
                      <button
                        disabled={isProcessingOrder}
                        onClick={() => setRejectReasonModal(ord)}
                        className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {ord.status === 'Packed' && (
                    <button
                      disabled={isProcessingOrder}
                      onClick={() => handleDispatchOrder(ord.id)}
                      className="px-4 py-2 bg-gradient-to-r from-[#1769E0] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" /> Dispatch Order
                    </button>
                  )}
                  {ord.status === 'Out for delivery' && (
                    <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                      <Truck className="w-4 h-4" /> En route ({ord.deliveryPartner})
                    </span>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Pharmacy Inventory Manager (Firestore pharmacyInventory) */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-[32px] p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#10B981]" /> Pharmacy Inventory Manager ({inventory.length} Items)
              </h3>
              <p className="text-xs text-slate-500">Add, edit stock, price, and prescription requirements for your pharmacy's live catalog.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
              {inventory.length === 0 && !inventoryLoading && (
                <button
                  onClick={handleSeedInventory}
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-900"
                >
                  Import Catalog
                </button>
              )}
            </div>
          </div>

          {inventoryLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
              <span className="text-xs">Loading pharmacy stock...</span>
            </div>
          ) : inventory.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No stock tracked in pharmacyInventory yet.</p>
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-[#10B981] text-white text-xs font-bold rounded-xl"
                >
                  Add Custom Medicine
                </button>
                <button
                  onClick={handleSeedInventory}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Import Standard Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inventory.map((med) => {
                const stockVal = med.stock ?? med.stockCount ?? 0;
                const isLowStock = stockVal <= 10;
                return (
                  <div 
                    key={med.id} 
                    className={`p-4 bg-white/70 dark:bg-slate-800/60 rounded-2xl border transition-all ${
                      isLowStock 
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20' 
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {med.category || 'General'}
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          LOW STOCK (≤10)
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">{med.medicineName || med.name}</h4>
                    {med.salt && <p className="text-[10px] text-slate-400 truncate mt-0.5">{med.salt}</p>}

                    <div className="mt-2 text-xs flex justify-between">
                      <span className="text-slate-400">Stock:</span>
                      <strong className={isLowStock ? 'text-amber-600 font-extrabold' : 'text-slate-900 dark:text-white'}>
                        {stockVal} Units
                      </strong>
                    </div>
                    <div className="text-xs flex justify-between mt-1">
                      <span className="text-slate-400">Selling Price:</span>
                      <span className="text-emerald-600 font-bold text-[11px]">₹{med.price} {med.mrp ? <span className="line-through text-slate-400 text-[10px]">₹{med.mrp}</span> : ''}</span>
                    </div>
                    <div className="text-xs flex justify-between mt-1">
                      <span className="text-slate-400">Prescription Req:</span>
                      <span className={`text-[10px] font-bold ${med.requiresRx ? 'text-red-500' : 'text-slate-500'}`}>
                        {med.requiresRx ? 'Rx Required' : 'OTC'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenEditModal(med)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteInventoryItem(med.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Inventory Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Edit Medicine Inventory' : 'Add Medicine to Inventory'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingItem && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select from Standard Catalog (or choose Custom)
                </label>
                <select
                  value={formSelectedCatalogId}
                  onChange={e => handleSelectCatalogItem(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="custom">-- Custom Medicine Entry --</option>
                  {mockMedicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.salt}) - ₹{m.discountPrice}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={formMedicineName}
                  onChange={e => setFormMedicineName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Composition / Salt</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol Hydrochloride"
                  value={formSalt}
                  onChange={e => setFormSalt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="Diabetes">Diabetes</option>
                    <option value="Heart">Heart</option>
                    <option value="Ayurveda">Ayurveda</option>
                    <option value="Baby care">Baby care</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Devices">Devices</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="12/2028"
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={formMrp}
                    onChange={e => setFormMrp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reqRxToggle"
                  checked={formRequiresRx}
                  onChange={e => setFormRequiresRx(e.target.checked)}
                  className="rounded accent-emerald-600 cursor-pointer w-4 h-4"
                />
                <label htmlFor="reqRxToggle" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Requires Doctor Prescription (Rx)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleSaveInventoryItem}
                className="flex-1 py-3 bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                {editingItem ? 'Save Changes' : 'Add to Inventory'}
              </button>
              <button
                onClick={() => setShowItemModal(false)}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Inspection Modal */}
      {selectedRxOrder && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[36px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base">Prescription Verification #{selectedRxOrder.id}</h3>
              <button onClick={() => setSelectedRxOrder(null)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl mb-4 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Prescribed Clinical Verification</span>
              <p className="text-slate-600 dark:text-slate-300">
                Patient: <strong>{selectedRxOrder.patientName}</strong> • Phone: <strong>{selectedRxOrder.patientPhone}</strong>
              </p>
              {selectedRxOrder.rxImageUrl && selectedRxOrder.rxImageUrl !== '#' ? (
                <div className="mt-3">
                  {selectedRxOrder.rxImageUrl.endsWith('.pdf') ? (
                    <a href={selectedRxOrder.rxImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">
                      View Uploaded Prescription PDF
                    </a>
                  ) : (
                    <img src={selectedRxOrder.rxImageUrl} alt="Prescription" className="max-h-60 object-contain rounded-xl border mx-auto" />
                  )}
                </div>
              ) : (
                <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-emerald-300 text-center">
                  <FileText className="w-10 h-10 text-[#10B981] mx-auto mb-1" />
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200 block font-bold">Saved Patient Prescription Selected</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Verified via HealthPilot Patient Health Records</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                disabled={isProcessingOrder}
                onClick={() => handleApproveRx(selectedRxOrder.id)}
                className="flex-1 py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                Approve & Pack Medicines
              </button>
              <button
                onClick={() => {
                  const ord = selectedRxOrder;
                  setSelectedRxOrder(null);
                  setRejectReasonModal(ord);
                }}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Reject Rx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-red-600 mb-2">Reject Prescription</h3>
            <p className="text-xs text-slate-500 mb-4">Please provide a clinical reason so the patient can re-upload:</p>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRejectRx}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

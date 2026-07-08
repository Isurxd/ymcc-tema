"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function BulkPrintLabelPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const storedIds = localStorage.getItem("bulkPrintOrderIds");
        if (!storedIds) {
          setLoading(false);
          return;
        }
        const ids = JSON.parse(storedIds);
        const fetchedOrders = [];
        for (const id of ids) {
          const docRef = doc(db, "merch_orders", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            fetchedOrders.push({ id: snap.id, ...snap.data() });
          }
        }
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0 && !loading) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [orders, loading]);

  if (loading) return <div className="p-10 font-bold">Loading...</div>;
  if (orders.length === 0) return <div className="p-10 font-bold text-red-500">No orders selected for bulk print.</div>;

  return (
    <div className="bg-gray-100 min-h-screen print:bg-white flex flex-col items-center py-10 print:py-0 print-wrapper">
      {orders.map((order, idx) => (
        <div key={order.id} className="w-[10cm] h-[15cm] bg-white text-black p-4 border-2 border-black mb-8 print:mb-0 print:border-none print:w-[10cm] print:h-[15cm] mx-auto print-page" style={{ pageBreakAfter: idx === orders.length - 1 ? 'auto' : 'always' }}>
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
            <div>
              <h1 className="font-anton text-3xl uppercase leading-none">YMCC VII</h1>
              <p className="text-xs font-bold uppercase mt-1">Official Merchandise</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-500">Order ID</p>
              <p className="font-mono font-bold">{order.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Sender & Receiver */}
          <div className="space-y-4 text-sm">
            <div className="border-2 border-black p-3 rounded">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">To (Penerima):</p>
              <p className="font-bold text-lg">{order.userDetails?.name || order.customerInfo?.fullName || "Customer"}</p>
              <p className="font-mono">{order.userDetails?.phone || order.customerInfo?.phone}</p>
              <p className="mt-2 leading-relaxed">
                {order.shippingDetails?.address}<br />
                {order.shippingDetails?.village}, {order.shippingDetails?.district}<br />
                {order.shippingDetails?.city}, {order.shippingDetails?.province} {order.shippingDetails?.postalCode}
              </p>
            </div>

            <div className="border-2 border-black p-3 rounded bg-gray-50">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">From (Pengirim):</p>
              <p className="font-bold">Panitia YMCC VII</p>
              <p className="font-mono">081234567890</p>
              <p className="mt-1">
                Kampus UPN Veteran Yogyakarta<br />
                Condongcatur, Sleman, DIY 55283
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4 border-t-2 border-black pt-4">
            <p className="text-xs font-bold uppercase text-gray-500 mb-2">Isi Paket:</p>
            <ul className="list-disc list-inside text-sm font-bold">
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.name} {item.size ? `(Size: ${item.size})` : ''} x{item.quantity}
                </li>
              ))}
            </ul>
          </div>

          {/* Courier */}
          <div className="mt-6 text-center border-2 border-black py-2 rounded-full font-bold uppercase">
            {order.shippingDetails?.courier || "REGULER"}
          </div>
        </div>
      ))}

      {/* Custom Styles for Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-wrapper, .print-wrapper * {
            visibility: visible;
          }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}

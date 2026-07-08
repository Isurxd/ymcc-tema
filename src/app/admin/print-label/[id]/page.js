"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PrintLabelPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "merch_orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && !loading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order, loading]);

  if (loading) return <div className="p-10 font-bold">Loading...</div>;
  if (!order) return <div className="p-10 font-bold text-red-500">Order not found.</div>;

  return (
    <div className="w-[10cm] h-[15cm] bg-white text-black p-4 border-2 border-black mx-auto mt-10 print:mt-0 print:border-none print:w-full">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
        <div>
          <h1 className="font-anton text-3xl uppercase leading-none">YMCC VII</h1>
          <p className="text-xs font-bold uppercase mt-1">Official Merchandise</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-gray-500">Order ID</p>
          <p className="font-mono font-bold">{order.orderId}</p>
        </div>
      </div>

      {/* Sender & Receiver */}
      <div className="space-y-4 text-sm">
        <div className="border-2 border-black p-3 rounded">
          <p className="text-xs font-bold uppercase text-gray-500 mb-1">To (Penerima):</p>
          <p className="font-bold text-lg">{order.userDetails?.name}</p>
          <p className="font-mono">{order.userDetails?.phone}</p>
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
          {order.items?.map((item, idx) => (
            <li key={idx}>
              {item.name} {item.size ? `(Size: ${item.size})` : ''} x{item.quantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Courier */}
      <div className="mt-6 text-center border-2 border-black py-2 rounded-full font-bold uppercase">
        {order.shippingDetails?.courier || "REGULER"}
      </div>

      {/* Custom Styles for Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:mt-0, .print\\:mt-0 * {
            visibility: visible;
          }
          .print\\:mt-0 {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
}

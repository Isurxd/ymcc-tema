"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import FadeInImage from "@/components/FadeInImage";
import { toast } from "sonner";
import { FaBoxOpen, FaTruck, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No Order ID provided.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found.");
        }
      } catch (err) {
        setError("Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleResumePayment = () => {
    if (window.snap && order?.token) {
      window.snap.pay(order.token, {
        onSuccess: function () {
          toast.success("Payment successful!");
          window.location.reload();
        },
        onPending: function () {
          toast.success("Please complete your payment.");
        },
        onError: function () {
          toast.error("Payment failed.");
        },
        onClose: function () {
          toast.error("Payment window closed.");
        }
      });
    } else if (order?.checkoutUrl) {
      window.location.href = order.checkoutUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-[#c1ff00] rounded-full animate-spin"></div>
          <p className="mt-4 font-bold uppercase tracking-widest text-sm">Searching for your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_#000] text-center max-w-md w-full">
          <FaExclamationCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="font-anton text-3xl uppercase mb-2">Order Not Found</h1>
          <p className="font-bold text-gray-500 mb-6">{error}</p>
          <Link href="/merch">
            <button className="bg-black text-[#c1ff00] font-bold uppercase tracking-widest px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition-transform shadow-brutal-sm w-full">
              Back to Shop
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-EWKZ34tGlzjdynzr"
        strategy="beforeInteractive"
      />
      <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-anton text-4xl uppercase">Order Status</h1>
            <span className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-xl border-2 border-black shadow-brutal-sm ${
              order.status === 'PAID' ? 'bg-[#c1ff00] text-black' : 
              order.status === 'PENDING_PAYMENT' ? 'bg-orange-400 text-black' : 
              'bg-red-500 text-white'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_0_#000] mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FaBoxOpen className="text-9xl" />
            </div>
            
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt Number</p>
              <h2 className="font-bold text-xl md:text-2xl mb-6">{order.id}</h2>

              {order.status === 'PENDING_PAYMENT' && (
                <div className="bg-yellow-100 border-2 border-yellow-400 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-yellow-800 mb-1">Awaiting Payment</h3>
                    <p className="font-bold text-sm text-yellow-700">Please complete your payment before the timer expires.</p>
                  </div>
                  <button onClick={handleResumePayment} className="bg-black text-[#c1ff00] font-bold uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-black hover:scale-105 transition-transform shadow-[4px_4px_0_0_rgba(193,255,0,0.5)] whitespace-nowrap w-full md:w-auto">
                    Pay Now
                  </button>
                </div>
              )}

              {order.status === 'PAID' && (
                <div className="bg-green-100 border-2 border-green-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaCheckCircle className="text-green-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-green-800 mb-1">Payment Received</h3>
                    <p className="font-bold text-sm text-green-700">Your order is being processed by our team.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h3 className="font-anton text-xl uppercase border-b-2 border-gray-200 pb-2">Order Items</h3>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 border-2 border-black relative shrink-0 rounded-xl overflow-hidden">
                      <FadeInImage src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold uppercase text-sm leading-tight">{item.name}</h4>
                      <p className="text-xs text-gray-500 font-bold">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                    <div className="font-bold whitespace-nowrap">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-gray-200 pt-8">
                <div>
                  <h3 className="font-anton text-xl uppercase mb-4 flex items-center gap-2"><FaTruck /> Shipping Details</h3>
                  {order.shippingDetails ? (
                    <div className="text-sm font-bold text-gray-600 space-y-1">
                      <p className="text-black text-base">{order.customerName}</p>
                      <p>{order.shippingDetails.address}</p>
                      <p>{order.shippingDetails.village}, {order.shippingDetails.district}</p>
                      <p>{order.shippingDetails.city}, {order.shippingDetails.province}</p>
                      <p className="mt-2 uppercase text-[#c1ff00] bg-black inline-block px-2 py-1 rounded">Courier: {order.shippingDetails.courier || "Standard"}</p>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-600 bg-gray-100 p-4 rounded-xl border border-gray-300">
                      <p>Self Pickup at Pendopo FTME UPNV YK.</p>
                      <p className="mt-1">Please contact Admin via WhatsApp to arrange timing.</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-anton text-xl uppercase mb-4 flex items-center gap-2"><FaClock /> Order Summary</h3>
                  <div className="space-y-2 text-sm font-bold border-2 border-black p-4 rounded-xl bg-gray-50">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="text-xl font-anton text-black">Rp {order.totalAmount?.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="text-center font-bold text-gray-400 text-xs">
            Save this link to track your order anytime. Need help? <Link href="/contact" className="text-black underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-bold uppercase">Loading...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}

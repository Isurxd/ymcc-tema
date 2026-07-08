"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import FadeInImage from "@/components/FadeInImage";
import { toast } from "sonner";
import { FaBoxOpen, FaTruck, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const hub = searchParams.get("hub");
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trackingNumber, setTrackingNumber] = useState("");
  const [logisticsStatus, setLogisticsStatus] = useState(null);
  const [isLogisticsLoading, setIsLogisticsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // If user explicitly wants the hub (e.g. from Track Another Order button)
    if (hub === "true") {
      setOrder(null);
      setError("");
      setLoading(false);
      return;
    }

    let activeOrderId = orderId;
    if (!activeOrderId) {
      activeOrderId = localStorage.getItem("lastOrderId");
    }

    if (!activeOrderId) {
      setLoading(false);
      return; // Show tracking hub
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrderId}`);
        const data = await res.json();
        if (data.success) {
          // If auto-loaded and dead, clear localStorage AND don't render it (go to hub)
          if (!orderId && (data.order.status === 'CANCELLED' || data.order.status === 'EXPIRED')) {
            localStorage.removeItem("lastOrderId");
            setOrder(null);
            setLoading(false);
            return;
          }
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
  }, [orderId, hub]);

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

  const handleCancelOrderClick = () => {
    setShowCancelModal(true);
  };

  const executeCancelOrder = async () => {
    if (!order?.id) return;
    setIsCancelling(true);
    
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Order cancelled successfully.");
        localStorage.removeItem("lastOrderId");
        
        // If we are on the auto-loaded page, this will reset to hub
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to cancel order.");
        setIsCancelling(false);
        setShowCancelModal(false);
      }
    } catch (err) {
      toast.error("An error occurred while cancelling.");
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackingNumber) return;
    
    setError("");
    setLogisticsStatus(null);
    
    if (trackingNumber.toUpperCase().startsWith("YMCC-") || trackingNumber.toUpperCase().startsWith("AWB")) {
      // Simulate logistics tracking
      setIsLogisticsLoading(true);
      setTimeout(() => {
        setIsLogisticsLoading(false);
        setLogisticsStatus("IN_TRANSIT");
      }, 1000);
    } else {
      // Navigate to order ID
      setIsLogisticsLoading(true);
      router.push(`/order-status?id=${trackingNumber}`);
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

  if (!order) {
    // UNIFIED TRACKING HUB
    return (
      <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans">
        <div className="max-w-3xl mx-auto">
          <Link href="/merch">
            <button className="flex items-center gap-2 border-2 border-black rounded-full px-6 py-2 font-poppins font-bold text-sm uppercase mb-8 hover:bg-[#111] hover:text-white transition-colors bg-white shadow-brutal-sm">
              ← BACK TO SHOP
            </button>
          </Link>

          <div className="bg-white border-2 border-black rounded-[2rem] p-8 md:p-12 shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-[#c1ff00] border-2 border-black px-4 py-1 rounded-full text-sm font-bold uppercase">
                Order Hub
              </span>
            </div>

            <h1 className="font-anton text-5xl md:text-6xl uppercase tracking-wide mb-4">
              TRACK YOUR GEAR
            </h1>
            <p className="font-poppins text-gray-600 mb-8 leading-relaxed">
              Enter your <span className="font-bold text-black">Order ID</span> (for Payment Status) or <span className="font-bold text-black">AWB / Waybill Number</span> (for Logistics Tracking).
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-600 font-bold p-4 rounded-xl mb-6 flex items-center gap-2">
                <FaExclamationCircle /> {error}
              </div>
            )}

            <form onSubmit={handleTrackSubmit} className="flex flex-col md:flex-row gap-4 mb-12">
              <input 
                type="text" 
                placeholder="e.g. 7CigOAo8... or YMCC-123" 
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-grow border-2 border-black rounded-full py-4 px-6 font-poppins text-lg outline-none focus:bg-gray-50 uppercase placeholder-gray-400"
              />
              <button 
                type="submit"
                disabled={isLogisticsLoading || !trackingNumber}
                className="bg-black text-[#c1ff00] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-lg hover:bg-[#c1ff00] hover:text-black hover:border-2 hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
              >
                {isLogisticsLoading ? "TRACKING..." : "TRACK"}
              </button>
            </form>

            {/* MOCK TRACKING STATUS */}
            {logisticsStatus && (
              <div className="border-2 border-black rounded-2xl p-8 bg-gray-50 animate-fade-in">
                <h3 className="font-anton text-3xl uppercase mb-6">Shipment Status</h3>
                
                <div className="relative border-l-2 border-black ml-4 space-y-8 pb-4">
                  <div className="relative">
                    <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-[#c1ff00]" />
                    <div className="pl-8">
                      <h4 className="font-bold text-lg uppercase">Manifested (Warehouse)</h4>
                      <p className="text-sm text-gray-500 font-semibold mb-1">Today - 14:00 WIB</p>
                      <p className="text-gray-700">Package has been scanned and SLA fulfilled within 24 hours.</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-[#c1ff00]" />
                    <div className="pl-8">
                      <h4 className="font-bold text-lg uppercase">In Transit (Logistics Hub)</h4>
                      <p className="text-sm text-gray-500 font-semibold mb-1">Now</p>
                      <p className="text-gray-700">Package is en route to the destination sorting center.</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full border-2 border-black bg-white" />
                    <div className="pl-8">
                      <h4 className="font-bold text-lg uppercase text-gray-400">Delivered</h4>
                      <p className="text-gray-400">Waiting for receiver confirmation.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ORDER DETAILS VIEW
  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-EWKZ34tGlzjdynzr"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans flex flex-col items-center">
        <div className="max-w-3xl w-full">
          
          <Link href="/order-status?hub=true">
            <button className="flex items-center gap-2 border-2 border-black rounded-full px-6 py-2 font-poppins font-bold text-sm uppercase mb-8 hover:bg-[#111] hover:text-white transition-colors bg-white shadow-brutal-sm">
              ← TRACK ANOTHER ORDER
            </button>
          </Link>

          <div className="flex justify-between items-center mb-8">
            <h1 className="font-anton text-4xl uppercase">Order Status</h1>
            <span className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-xl border-2 border-black shadow-brutal-sm ${
              order.orderStatus === 'SHIPPED' || order.orderStatus === 'COMPLETED' ? 'bg-[#c1ff00] text-black' : 
              order.status === 'PAID' ? 'bg-[#c1ff00] text-black' : 
              order.status === 'PENDING_PAYMENT' ? 'bg-orange-400 text-black' : 
              'bg-red-500 text-white'
            }`}>
              {order.orderStatus && order.orderStatus !== 'PENDING' && order.orderStatus !== 'PROCESSING' ? order.orderStatus : order.status}
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
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button onClick={handleResumePayment} className="bg-black text-[#c1ff00] font-bold uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-black hover:scale-105 transition-transform shadow-[4px_4px_0_0_rgba(193,255,0,0.5)] whitespace-nowrap w-full">
                      Pay Now
                    </button>
                    <button onClick={handleCancelOrderClick} className="bg-white text-red-500 font-bold uppercase tracking-widest px-8 py-3 rounded-xl border-2 border-red-500 hover:bg-red-50 transition-colors whitespace-nowrap w-full">
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}

              {order.status === 'PAID' && (order.orderStatus === 'PENDING' || order.orderStatus === 'PROCESSING' || !order.orderStatus) && (
                <div className="bg-green-100 border-2 border-green-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaCheckCircle className="text-green-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-green-800 mb-1">Payment Received</h3>
                    <p className="font-bold text-sm text-green-700">Your order is being processed by our team.</p>
                  </div>
                </div>
              )}

              {order.orderStatus === 'SHIPPED' && order.deliveryMethod !== 'pickup' && (
                <div className="bg-blue-100 border-2 border-blue-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaTruck className="text-blue-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-blue-800 mb-1">Order Shipped</h3>
                    <p className="font-bold text-sm text-blue-700">Your order is on the way. Tracking: <span className="bg-white px-2 py-1 rounded border border-blue-300 font-mono text-black">{order.trackingNumber || "-"}</span> ({order.courier || "-"})</p>
                  </div>
                </div>
              )}

              {order.orderStatus === 'READY_FOR_PICKUP' && order.deliveryMethod === 'pickup' && (
                <div className="bg-blue-100 border-2 border-blue-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaBoxOpen className="text-blue-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-blue-800 mb-1">Ready for Pickup</h3>
                    <p className="font-bold text-sm text-blue-700">Your order is ready to be picked up at Pendopo FTME UPNV YK.</p>
                  </div>
                </div>
              )}

              {order.orderStatus === 'COMPLETED' && (
                <div className="bg-purple-100 border-2 border-purple-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaCheckCircle className="text-purple-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-purple-800 mb-1">Order Completed</h3>
                    <p className="font-bold text-sm text-purple-700">Thank you for shopping with us!</p>
                  </div>
                </div>
              )}

              {(order.status === 'CANCELLED' || order.status === 'cancel' || order.status === 'expire' || order.status === 'EXPIRED') && (
                <div className="bg-red-100 border-2 border-red-500 p-6 rounded-2xl mb-8 flex items-center gap-4">
                  <FaExclamationCircle className="text-red-600 text-4xl" />
                  <div>
                    <h3 className="font-anton text-2xl uppercase text-red-800 mb-1">Order Cancelled</h3>
                    <p className="font-bold text-sm text-red-700">This order has been cancelled. The items have been released.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h3 className="font-anton text-xl uppercase border-b-2 border-gray-200 pb-2">Order Items</h3>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 border-2 border-black relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      {item.image ? (
                        <FadeInImage src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        "NO IMAGE"
                      )}
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

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-black p-8 rounded-[2rem] max-w-md w-full shadow-[8px_8px_0_0_#000] relative">
            <h3 className="font-anton text-3xl uppercase mb-2">Cancel Order?</h3>
            <p className="font-poppins text-gray-600 mb-8 font-bold">
              Are you sure you want to cancel this order? This action cannot be undone and your items will be released back to the stock.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 bg-white text-black border-2 border-black rounded-xl px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button 
                onClick={executeCancelOrder}
                disabled={isCancelling}
                className="flex-1 bg-red-500 text-white border-2 border-black rounded-xl px-6 py-3 font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-brutal-sm disabled:opacity-50"
              >
                {isCancelling ? "CANCELLING..." : "YES, CANCEL"}
              </button>
            </div>
          </div>
        </div>
      )}
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

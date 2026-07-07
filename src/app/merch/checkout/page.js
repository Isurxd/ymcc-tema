"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import FadeInImage from "@/components/FadeInImage";
import dynamic from "next/dynamic";
import Script from "next/script";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("shipping"); // "shipping" | "pickup"
  
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const PLATFORM_FEE = 5000;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    city: "",
    district: "",
    village: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    courier: ""
  });

  // State for Region APIs
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // Shipping Cost from Biteship
  const [shippingCost, setShippingCost] = useState(0);
  const [availableRates, setAvailableRates] = useState([]);
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  const fetchRates = async () => {
    setIsFetchingRates(true);
    try {
      const res = await fetch("/api/biteship/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationPostalCode: formData.postalCode,
          items: cartItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setAvailableRates(data.rates);
        // Reset selected courier if new rates are fetched
        setFormData(prev => ({ ...prev, courier: "" }));
        setShippingCost(0);
      } else {
        setAvailableRates([]);
      }
    } catch (err) {
      console.error(err);
      setAvailableRates([]);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleApplyPromo = async () => {
    setPromoError("");
    setIsApplyingPromo(true);
    setAppliedPromo(null);
    if (!promoCodeInput) {
      setIsApplyingPromo(false);
      return;
    }

    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(promoCodeInput.toUpperCase())}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to validate");
      }
      
      if (!json.promo) {
        setPromoError("Invalid Promo Code");
        setIsApplyingPromo(false);
        return;
      }
      
      const promoData = json.promo;
      setAppliedPromo(promoData);
    } catch (err) {
      setPromoError("Failed to validate code.");
    }
    setIsApplyingPromo(false);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "province") {
      const selectedProv = provinces.find(p => p.name === value);
      setFormData({ ...formData, province: value, city: "", district: "", village: "" });
      setCities([]); setDistricts([]); setVillages([]); setShippingCost(0);
      if (selectedProv) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv.id}.json`)
          .then(res => res.json())
          .then(data => setCities(data));
      }
    } else if (name === "city") {
      const selectedCity = cities.find(c => c.name === value);
      setFormData({ ...formData, city: value, district: "", village: "" });
      setDistricts([]); setVillages([]); setShippingCost(0);
      if (selectedCity) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
          .then(res => res.json())
          .then(data => setDistricts(data));
      }
    } else if (name === "district") {
      const selectedDist = districts.find(d => d.name === value);
      setFormData({ ...formData, district: value, village: "" });
      setVillages([]); setShippingCost(0);
      if (selectedDist) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDist.id}.json`)
          .then(res => res.json())
          .then(data => setVillages(data));
      }
    } else if (name === "village") {
      setFormData({ ...formData, village: value });
    } else if (name === "courier") {
      // Find the selected rate to set the cost
      const selectedRate = availableRates.find(r => `${r.courier} - ${r.service}` === value);
      if (selectedRate) {
        setShippingCost(selectedRate.price);
        setFormData({ ...formData, courier: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-white text-black px-6">
        <h1 className="font-anton text-5xl uppercase mb-4 text-center">Your Cart is Empty</h1>
        <button onClick={() => router.push("/merch")} className="mt-4 border-2 border-black bg-[#c1ff00] px-8 py-3 rounded-full font-bold uppercase shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-none transition-all">
          Return to Shop
        </button>
      </div>
    );
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          deliveryMethod,
          shippingCost: deliveryMethod === "pickup" ? 0 : shippingCost,
          platformFee: PLATFORM_FEE,
          promo: appliedPromo ? {
             id: appliedPromo.id,
             code: appliedPromo.code,
             type: appliedPromo.type,
             discountAmount: appliedPromo.discountType === "PERCENT" ? Math.min(cartTotal, cartTotal * (Number(appliedPromo.discount) / 100)) : Math.min(cartTotal, Number(appliedPromo.discount)),
             affiliateEmail: appliedPromo.affiliateEmail || null,
             commission: appliedPromo.commission || 0
          } : null,
          userDetails: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone
          },
          shippingDetails: deliveryMethod === "shipping" ? {
            address: formData.address,
            province: formData.province,
            city: formData.city,
            district: formData.district,
            village: formData.village,
            postalCode: formData.postalCode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            courier: formData.courier
          } : null
        })
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        if (window.snap && data.token) {
          window.snap.pay(data.token, {
            onSuccess: function () {
              clearCart();
              toast.success("Payment successful!");
              router.push(`/order-status?id=${data.orderId}`);
            },
            onPending: function () {
              clearCart();
              toast.success("Order created! Please complete payment.");
              router.push(`/order-status?id=${data.orderId}`);
            },
            onError: function () {
              toast.error("Payment failed!");
              router.push(`/order-status?id=${data.orderId}`);
            },
            onClose: function () {
              clearCart();
              toast.error("Payment cancelled. You can resume it from your order status page.");
              router.push(`/order-status?id=${data.orderId}`);
            }
          });
        } else {
          clearCart(); 
          router.push(data.checkoutUrl); 
        }
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error("Something went wrong during checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  let discountAmount = 0;
  if (appliedPromo) {
     if (appliedPromo.discountType === "PERCENT") {
         discountAmount = cartTotal * (Number(appliedPromo.discount) / 100);
     } else {
         discountAmount = Number(appliedPromo.discount);
     }
     if (discountAmount > cartTotal) discountAmount = cartTotal; // Max discount is subtotal
  }

  const finalTotal = cartTotal - discountAmount + (deliveryMethod === "shipping" ? shippingCost : 0) + PLATFORM_FEE;

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-EWKZ34tGlzjdynzr"
        strategy="beforeInteractive"
      />
      <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6 md:px-12 font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Col: Form */}
        <div>
          <h1 className="font-anton text-5xl uppercase mb-8">Checkout</h1>
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm mb-2">First Name</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Last Name</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-sm mb-2">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50" />
            </div>

            <div>
              <label className="block font-bold text-sm mb-2">Phone Number (WhatsApp)</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50" />
            </div>

            <hr className="border-t-2 border-black my-8" />
            
            <h2 className="font-anton text-3xl uppercase mb-4">Delivery Method</h2>
            <div className="flex gap-4 mb-8">
              <label className={`flex-1 cursor-pointer border-2 border-black rounded-xl p-4 flex items-center justify-center font-bold uppercase transition-all ${deliveryMethod === "shipping" ? "bg-black text-[#c1ff00]" : "bg-white hover:bg-gray-100"}`}>
                <input type="radio" name="deliveryMethod" value="shipping" checked={deliveryMethod === "shipping"} onChange={() => setDeliveryMethod("shipping")} className="hidden" />
                Courier Delivery
              </label>
              <label className={`flex-1 cursor-pointer border-2 border-black rounded-xl p-4 flex items-center justify-center font-bold uppercase transition-all ${deliveryMethod === "pickup" ? "bg-black text-[#c1ff00]" : "bg-white hover:bg-gray-100"}`}>
                <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="hidden" />
                Self Pickup
              </label>
            </div>

            {deliveryMethod === "pickup" ? (
              <div className="bg-gray-100 border-2 border-black rounded-xl p-6 mb-6 shadow-[4px_4px_0_0_#000]">
                <h3 className="font-anton text-2xl text-black uppercase mb-2">Pickup Location</h3>
                <p className="font-bold text-black mb-2">Pendopo FTME Kampus 1 UPN &quot;Veteran&quot; Yogyakarta</p>
                <a href="https://share.google/jH8WqKI3ekUcVwogb" target="_blank" rel="noreferrer" className="text-sm font-bold text-black underline hover:text-[#c1ff00] hover:bg-black px-1 transition-colors">
                  View on Google Maps →
                </a>
                <p className="text-sm mt-4 font-bold text-gray-700">For pickup timing, please contact our Admin via WhatsApp after completing your payment.</p>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="inline-block mt-4 bg-black text-[#c1ff00] font-bold uppercase tracking-widest px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition-transform shadow-brutal-sm">
                  💬 Chat Admin
                </a>
              </div>
            ) : (
              <>
                <h2 className="font-anton text-3xl uppercase mb-6">Shipping Address</h2>

                <div>
                  <label className="block font-bold text-sm mb-2">Full Address</label>
                  <textarea required name="address" rows="3" value={formData.address} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block font-bold text-sm mb-2">Province</label>
                    <select required name="province" value={formData.province} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 bg-white">
                      <option value="" disabled>Select Province</option>
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.name}>{prov.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-2">City / Regency</label>
                    <select required name="city" value={formData.city} onChange={handleChange} disabled={!formData.province} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 bg-white disabled:opacity-50">
                      <option value="" disabled>Select City</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block font-bold text-sm mb-2">District (Kecamatan)</label>
                    <select required name="district" value={formData.district} onChange={handleChange} disabled={!formData.city} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 bg-white disabled:opacity-50">
                      <option value="" disabled>Select District</option>
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.name}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-2">Village (Desa/Kelurahan)</label>
                    <select required name="village" value={formData.village} onChange={handleChange} disabled={!formData.district} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 bg-white disabled:opacity-50">
                      <option value="" disabled>Select Village</option>
                      {villages.map((vil) => (
                        <option key={vil.id} value={vil.name}>{vil.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 w-1/2">
                  <label className="block font-bold text-sm mb-2">Postal Code</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50" placeholder="e.g. 55281" />
                </div>

                <div className="mt-4 border-t-2 border-black pt-4">
                  <label className="block font-bold text-sm mb-2">Select Courier</label>
                  {isFetchingRates ? (
                    <div className="w-full border-2 border-black rounded-lg p-3 bg-gray-50 text-gray-500 font-bold animate-pulse">
                      Fetching Rates from Biteship...
                    </div>
                  ) : (
                    <select required name="courier" value={formData.courier} onChange={handleChange} className="w-full border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 bg-white">
                      <option value="" disabled>Choose your courier</option>
                      {availableRates.map((rate, idx) => (
                        <option key={idx} value={`${rate.courier} - ${rate.service}`}>
                          {rate.courier.toUpperCase()} {rate.service} - Rp {rate.price.toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableRates.length === 0 && formData.postalCode.length >= 5 && !isFetchingRates && (
                    <p className="text-red-500 text-xs mt-2 font-bold">No couriers available for this postal code.</p>
                  )}
                </div>
                
                <div className="mt-8 border-t-2 border-dashed border-black pt-6">
                  <label className="block font-bold text-sm mb-2">Pin Coordinates (For Instant Couriers)</label>
                  <MapPicker 
                    latitude={formData.latitude} 
                    longitude={formData.longitude} 
                    setCoordinates={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                    searchAddress={`${formData.village ? formData.village + ', ' : ''}${formData.city ? formData.city + ', ' : ''}${formData.province ? formData.province + ', ' : ''}Indonesia`}
                  />
                  <div className="flex gap-2 mt-4">
                    <input type="text" name="latitude" value={formData.latitude} readOnly className="w-1/2 border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 text-sm bg-gray-100 font-mono" placeholder="Latitude" />
                    <input type="text" name="longitude" value={formData.longitude} readOnly className="w-1/2 border-2 border-black rounded-lg p-3 outline-none focus:bg-gray-50 text-sm bg-gray-100 font-mono" placeholder="Longitude" />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => setFormData(prev => ({ ...prev, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
                          (err) => toast.error("Failed to get location. Please allow browser location access.")
                        );
                      } else {
                        toast.error("Geolocation not supported by browser.");
                      }
                    }}
                    className="mt-4 text-sm font-bold bg-[#c1ff00] border-2 border-black px-6 py-3 rounded-full hover:bg-black hover:text-[#c1ff00] transition-colors shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-none w-max"
                  >
                    📍 Use My Current Location
                  </button>
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={isLoading || (deliveryMethod === "shipping" && (!formData.village || !formData.courier))}
              className="w-full mt-8 bg-black text-[#c1ff00] font-bold uppercase tracking-widest text-xl py-4 rounded-full border-2 border-black hover:bg-[#c1ff00] hover:text-black transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-y-1 disabled:opacity-50"
            >
              {isLoading ? "PROCESSING..." : "PAY SECURELY"}
            </button>
          </form>
        </div>

        {/* Right Col: Order Summary */}
        <div>
          <div className="bg-white border-2 border-black rounded-[2rem] p-8 shadow-[4px_4px_0_0_#000] sticky top-32">
            <h2 className="font-anton text-3xl uppercase mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-100 border-2 border-black relative shrink-0">
                    <FadeInImage src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold uppercase text-sm leading-tight line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 font-semibold">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold whitespace-nowrap">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-black pt-4 mb-4">
              <label className="block font-bold text-xs uppercase mb-2">Promo / Referral Code</label>
              <div className="flex gap-2">
                <input type="text" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value)} disabled={appliedPromo} className="w-full border-2 border-black rounded-lg p-2 outline-none uppercase font-bold text-sm" placeholder="ENTER CODE" />
                {!appliedPromo ? (
                  <button type="button" onClick={handleApplyPromo} disabled={isApplyingPromo || cartItems.length===0} className="bg-black text-[#c1ff00] font-bold px-4 rounded-lg uppercase text-sm border-2 border-black hover:bg-[#c1ff00] hover:text-black transition-colors shadow-[2px_2px_0_0_#000] disabled:opacity-50">
                    {isApplyingPromo ? "..." : "Apply"}
                  </button>
                ) : (
                  <button type="button" onClick={() => { setAppliedPromo(null); setPromoCodeInput(""); }} className="bg-red-500 text-white font-bold px-4 rounded-lg uppercase text-sm border-2 border-black hover:bg-red-600 transition-colors shadow-[2px_2px_0_0_#000]">
                    Remove
                  </button>
                )}
              </div>
              {promoError && <p className="text-red-500 text-xs font-bold mt-1">{promoError}</p>}
              {appliedPromo && <p className="text-green-600 text-xs font-bold mt-1">Code applied! You got {appliedPromo.discountType === 'PERCENT' ? `${appliedPromo.discount}%` : `Rp ${Number(appliedPromo.discount).toLocaleString()}`} off.</p>}
            </div>

            <div className="border-t-2 border-black pt-4 space-y-2 font-bold mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping Fee</span>
                <span>
                  {deliveryMethod === "pickup" 
                    ? "Rp 0" 
                    : shippingCost > 0 
                      ? `Rp ${shippingCost.toLocaleString("id-ID")}` 
                      : <span className="text-xs italic font-normal text-gray-500 mt-1">Select Village to calculate</span>
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Fee</span>
                <span>Rp {PLATFORM_FEE.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="border-t-2 border-black pt-4 flex justify-between items-center">
              <span className="font-anton text-2xl uppercase">Total</span>
              <span className="font-anton text-3xl">Rp {finalTotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              SECURE CHECKOUT BY MIDTRANS
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}


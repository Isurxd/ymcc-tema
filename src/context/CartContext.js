"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount (simulated persistent state)
  useEffect(() => {
    const savedCart = localStorage.getItem("ymcc_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setTimeout(() => {
          setCartItems(parsed);
        }, 0);
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    localStorage.setItem("ymcc_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.size === product.size);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prev, product];
    });
    setIsCartOpen(true); // Auto open cart when adding
  };

  const removeFromCart = (id, size) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
      
      {/* GLOBAL CART SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={toggleCart}
          />
          
          {/* Sidebar */}
          <div className="relative w-full max-w-md bg-white h-full border-l-[3px] border-black shadow-[-8px_0_0_0_#000] flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b-[3px] border-black bg-[#c1ff00]">
              <h2 className="font-anton text-3xl uppercase">Your Cart ({cartCount})</h2>
              <button onClick={toggleCart} className="p-2 border-2 border-black rounded-full bg-white hover:bg-black hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="text-xl font-bold">Your cart is empty</p>
                  <button onClick={toggleCart} className="mt-6 border-2 border-black px-6 py-2 rounded-full font-bold hover:bg-[#c1ff00] transition-colors">
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 border-2 border-black p-3 bg-white shadow-[4px_4px_0_0_#000]">
                    <div className="w-24 h-24 relative border-2 border-black bg-gray-100 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col flex-grow justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold uppercase text-lg leading-tight">{item.name}</h4>
                          <p className="text-sm font-semibold text-gray-500">Size: {item.size}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 hover:text-red-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border-2 border-black rounded-full overflow-hidden">
                          <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-200 font-bold">-</button>
                          <span className="px-3 py-1 font-bold border-l-2 border-r-2 border-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-200 font-bold">+</button>
                        </div>
                        <p className="font-bold text-lg">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t-[3px] border-black bg-white">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold uppercase">Total</span>
                  <span className="text-3xl font-anton">Rp {cartTotal.toLocaleString("id-ID")}</span>
                </div>
                <Link href="/merch/checkout" onClick={() => setIsCartOpen(false)}>
                  <button className="w-full bg-black text-white py-4 rounded-full font-bold uppercase text-xl border-2 border-black shadow-[4px_4px_0_0_#c1ff00] hover:bg-[#c1ff00] hover:text-black hover:shadow-[4px_4px_0_0_#000] transition-all">
                    PROCEED TO CHECKOUT
                  </button>
                </Link>
                <p className="text-xs text-center font-semibold text-gray-500 mt-4">
                  * Shipping and taxes calculated at checkout. Soft-lock inventory applied.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);


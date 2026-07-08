"use client";

import Image from "next/image";
import FadeInImage from "@/components/FadeInImage";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

export default function MerchClient({ initialProduct }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState("ALL GEAR");
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sortBy, setSortBy] = useState("POPULAR");
  const { addToCart, toggleCart, cartCount } = useCart();
  
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Firestore data
  useEffect(() => {
    const q = query(collection(db, "merchandise"), orderBy("createdAt", "desc"));
    
    const unsubMerch = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBanners = onSnapshot(collection(db, "merch_banners"), (bannerSnap) => {
      setBanners(bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    
    return () => {
      unsubMerch();
      unsubBanners();
    };
  }, []);

  // Sync selectedProduct with URL search params
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && products.length > 0) {
      const p = products.find(prod => prod.id === id);
      if (p) setSelectedProduct(p);
    } else if (!id) {
      setSelectedProduct(null);
    }
  }, [searchParams, products]);

  const handleProductClick = (product) => {
    if (product) {
      router.push(`/merch?id=${product.id}`, { scroll: false });
    } else {
      router.push(`/merch`, { scroll: false });
    }
  };

  const featuredSlides = banners.length > 0 
    ? banners.map((b, idx) => {
        let linkedProduct = null;
        if (b.linkUrl && b.linkUrl.includes("id=")) {
          const pid = b.linkUrl.split("id=")[1].split("&")[0];
          linkedProduct = products.find(p => p.id === pid) || null;
        } else {
          linkedProduct = null;
        }
        return { id: idx + 1, image: b.image, product: linkedProduct };
      })
    : products.slice(0, 3).map((p, idx) => ({ id: idx + 1, image: p.image, product: p }));


  useEffect(() => {
    if (selectedProduct) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedProduct, featuredSlides.length]);

  // Scroll to top and set default size when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Set default selectedSize to the first size that has stock > 0
      if (selectedProduct.sizes && selectedProduct.stockPerSize) {
        const firstAvailable = selectedProduct.sizes.find(s => selectedProduct.stockPerSize[s] > 0);
        setSelectedSize(firstAvailable || "");
      }
    }
  }, [selectedProduct]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = activeCategory === "ALL GEAR" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const searchedProducts = filteredProducts.filter(p => 
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.tagline || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (sortBy === "LOWEST_PRICE") return a.priceNumber - b.priceNumber;
    if (sortBy === "HIGHEST_PRICE") return b.priceNumber - a.priceNumber;
    return 0; // Default order for POPULAR
  });

  // PRODUCT DETAIL VIEW (SUB MERCH & SHOP)
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-[#fff] pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          
          <button 
            onClick={() => { handleProductClick(null); setQuantity(1); setSelectedSize(""); setCurrentImageIndex(0); }}
            className="flex items-center gap-2 border-2 border-black rounded-full px-6 py-2 font-poppins font-bold text-sm uppercase mb-8 hover:bg-[#111] hover:text-white transition-colors"
          >
            ← BACK TO CATALOG
          </button>

          {/* Product Detail Container */}
          <div className="bg-white border-2 border-black rounded-3xl flex flex-col lg:flex-row overflow-hidden shadow-brutal mb-20">
            
            {/* Left Col: Info */}
            <div className="p-6 md:p-10 lg:w-1/3 flex flex-col justify-center border-b-2 lg:border-b-0 lg:border-r-2 border-black">
              <div className="inline-flex items-center justify-center px-4 h-10 bg-[#c1ff00] border-2 border-black rounded-full mb-8 self-start">
                <span className="font-anton text-xl tracking-wider">YMCC</span>
              </div>
              <h1 className="font-anton text-3xl md:text-5xl lg:text-6xl text-[#111] uppercase tracking-wide leading-none mb-4">
                {selectedProduct.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-poppins font-bold text-[#111] text-lg">
                  {selectedProduct.tagline}
                </h3>
                <ShareButton title={`Beli ${selectedProduct.name} di YMCC VII`} />
              </div>
              <p className="font-poppins text-gray-600 text-sm leading-relaxed">
                {selectedProduct.description}
              </p>
            </div>

            {/* Middle Col: Image */}
            <div className="relative h-[500px] lg:h-auto lg:w-1/3 border-b-2 lg:border-b-0 lg:border-r-2 border-black bg-gray-100 flex flex-col">
              <div className="relative flex-grow">
                 <FadeInImage 
                   src={
                     currentImageIndex === 0 
                       ? selectedProduct.image 
                       : (selectedProduct.additionalImages || []).join(',').split(',').map(s=>s.trim()).filter(s=>s)[currentImageIndex - 1]
                   } 
                   alt={selectedProduct.name} 
                   fill 
                   className={`object-cover ${selectedProduct.category === 'ACCESSORIES' ? 'object-contain p-8' : ''}`}
                 />
                 {(!selectedProduct.stockPerSize || Object.values(selectedProduct.stockPerSize).every(s => s <= 0)) && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                     <span className="font-anton text-4xl text-white rotate-[-15deg] border-4 border-red-500 text-red-500 px-6 py-2 rounded-xl">OUT OF STOCK</span>
                   </div>
                 )}
              </div>
              {/* Thumbnail Gallery */}
              {selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0 && (
                <div className="flex gap-2 p-4 bg-white border-t-2 border-black overflow-x-auto">
                  <div 
                    onClick={() => setCurrentImageIndex(0)}
                    className={`w-16 h-16 flex-shrink-0 relative border-2 cursor-pointer ${currentImageIndex === 0 ? 'border-[#c1ff00]' : 'border-black hover:border-gray-500'}`}
                  >
                    <FadeInImage src={selectedProduct.image} alt="Thumbnail Main" fill className="object-cover" />
                  </div>
                  {selectedProduct.additionalImages.join(',').split(',').map(s=>s.trim()).filter(s=>s).map((imgUrl, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx + 1)}
                      className={`w-16 h-16 flex-shrink-0 relative border-2 cursor-pointer ${currentImageIndex === idx + 1 ? 'border-[#c1ff00]' : 'border-black hover:border-gray-500'}`}
                    >
                      <FadeInImage src={imgUrl} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Price & Action */}
            <div className="p-6 md:p-10 lg:w-1/3 flex flex-col justify-center bg-white">
              <h2 className="font-anton text-3xl md:text-5xl text-[#111] tracking-wide mb-1">
                {selectedProduct.price}
              </h2>
              <p className="font-poppins text-xs text-gray-500 underline mb-10">
                Excl. Shipping & Platform Fees
              </p>

              <h4 className="font-poppins font-bold text-[#111] mb-4">Select size</h4>
              <div className="flex gap-3 mb-8">
                {(selectedProduct.sizes || []).map(size => {
                  const isAvailable = selectedProduct.stockPerSize && selectedProduct.stockPerSize[size] > 0;
                  return (
                    <button 
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`w-12 h-12 rounded-full border-2 font-poppins font-bold flex items-center justify-center transition-colors ${
                        !isAvailable 
                          ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : selectedSize === size 
                            ? "border-black bg-[#c1ff00] text-black" 
                            : "border-black bg-white hover:bg-gray-100 text-black"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-2 border-black rounded-full px-6 py-3 mb-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="font-bold text-xl px-2 hover:text-gray-500">-</button>
                <span className="font-poppins font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="font-bold text-xl px-2 hover:text-gray-500">+</button>
              </div>

              <button 
                disabled={!selectedProduct.stockPerSize || Object.values(selectedProduct.stockPerSize).every(s => s <= 0) || !selectedSize}
                onClick={() => {
                  if (!selectedSize) {
                    toast.error("Please select a size first");
                    return;
                  }
                  addToCart({
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.priceNumber,
                    size: selectedSize,
                    quantity: quantity,
                    image: selectedProduct.image,
                    weight: selectedProduct.weight || 500
                  });
                }}
                className={`w-full font-anton text-2xl tracking-widest py-4 rounded-full border-2 border-black transition-colors shadow-brutal-sm ${
                  !selectedProduct.stockPerSize || Object.values(selectedProduct.stockPerSize).every(s => s <= 0)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : !selectedSize
                      ? "bg-gray-200 text-black cursor-not-allowed"
                      : "bg-[#c1ff00] text-black hover:bg-black hover:text-white"
                }`}
              >
                {(!selectedProduct.stockPerSize || Object.values(selectedProduct.stockPerSize).every(s => s <= 0)) ? "OUT OF STOCK" : "ADD TO CART"}
              </button>
            </div>
          </div>

          {/* Others Collection */}
          <div>
            <h2 className="font-poppins font-bold text-2xl text-[#111] mb-8">Others Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.filter(p => p.id !== selectedProduct.id).map(prod => (
                <div key={prod.id} className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal cursor-pointer group" onClick={() => handleProductClick(prod)}>
                  <div className="relative h-80 w-full bg-gray-100 border-b-2 border-black">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#c1ff00] px-4 py-1.5 border-2 border-black rounded-full font-poppins font-bold text-[10px] uppercase tracking-widest">
                      {prod.category}
                    </div>
                    <FadeInImage src={prod.image} alt={prod.name} fill className={`object-cover group-hover:scale-105 transition-transform duration-500 ${prod.category === 'ACCESSORIES' ? 'object-contain p-8' : ''}`} />
                  </div>
                  <div className="p-6">
                    <h3 className="font-poppins font-medium text-lg mb-2">{prod.name}</h3>
                    <h2 className="font-anton text-2xl md:text-3xl tracking-wide text-[#111] mb-2">{prod.price}</h2>
                    <p className="font-poppins text-xs text-gray-500 underline">More details</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-24 flex justify-center items-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#c1ff00] border-t-black rounded-full"></div>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-24 flex flex-col justify-center items-center">
        <h1 className="font-anton text-2xl md:text-4xl uppercase mb-4">Store is Empty</h1>
        <p className="font-poppins text-gray-500">New merchandise will be added soon.</p>
      </div>
    );
  }

  // MAIN MERCH SHOP VIEW
  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        {/* Header Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-anton uppercase text-[#111] tracking-wide mb-6">
            OFFICIAL FIELD GEAR
          </h1>
          <p className="font-poppins text-gray-600 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
            Equip yourself with the official, premium-grade apparel of YMCC VII. Built for the modern
            earth science professional, our exclusive jackets and vests are designed to withstand
            rugged outdoor exploration while elevating your presence in the field. Join the global
            coalition of delegates and wear the standard of excellence.
          </p>
        </div>

        {/* Hero Grid */}
        {featuredSlides.length > 0 && (
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
          {/* Left Large Image */}
          <div 
            className={`lg:col-span-2 relative rounded-[2rem] overflow-hidden border-2 border-black shadow-brutal h-[400px] lg:h-full group ${featuredSlides[currentSlide]?.product ? 'cursor-pointer' : ''}`}
            onClick={() => featuredSlides[currentSlide]?.product && handleProductClick(featuredSlides[currentSlide].product)}
          >
            {featuredSlides[currentSlide] && (
              <>
                <FadeInImage src={featuredSlides[currentSlide].image} alt="Featured Gear Main" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                {featuredSlides[currentSlide].product && (!featuredSlides[currentSlide].product.stockPerSize || Object.values(featuredSlides[currentSlide].product.stockPerSize).every(s => s <= 0)) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
                    <span className="font-anton text-3xl text-red-500 border-4 border-red-500 px-6 py-2 rotate-[-15deg] rounded-xl bg-black/50">OUT OF STOCK</span>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 flex gap-2 z-20">
                  {featuredSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                      className={`w-3 h-3 rounded-full border-2 border-black transition-colors ${currentSlide === idx ? 'bg-black' : 'bg-white hover:bg-gray-200'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Right Small Images */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            {featuredSlides[(currentSlide + 1) % featuredSlides.length] && (
              <div 
                className={`relative flex-1 rounded-[2rem] overflow-hidden border-2 border-black shadow-brutal min-h-[250px] group ${featuredSlides[(currentSlide + 1) % featuredSlides.length].product ? 'cursor-pointer' : ''}`}
                onClick={() => featuredSlides[(currentSlide + 1) % featuredSlides.length].product && handleProductClick(featuredSlides[(currentSlide + 1) % featuredSlides.length].product)}
              >
                <FadeInImage src={featuredSlides[(currentSlide + 1) % featuredSlides.length].image} alt="Featured Gear 2" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                {featuredSlides[(currentSlide + 1) % featuredSlides.length].product && (!featuredSlides[(currentSlide + 1) % featuredSlides.length].product.stockPerSize || Object.values(featuredSlides[(currentSlide + 1) % featuredSlides.length].product.stockPerSize).every(s => s <= 0)) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
                    <span className="font-anton text-xl text-red-500 border-4 border-red-500 px-4 py-1 rotate-[-15deg] rounded-lg bg-black/50">OUT OF STOCK</span>
                  </div>
                )}
              </div>
            )}
            {featuredSlides[(currentSlide + 2) % featuredSlides.length] && (
              <div 
                className={`relative flex-1 rounded-[2rem] overflow-hidden border-2 border-black shadow-brutal min-h-[250px] group ${featuredSlides[(currentSlide + 2) % featuredSlides.length].product ? 'cursor-pointer' : ''}`}
                onClick={() => featuredSlides[(currentSlide + 2) % featuredSlides.length].product && handleProductClick(featuredSlides[(currentSlide + 2) % featuredSlides.length].product)}
              >
                <FadeInImage src={featuredSlides[(currentSlide + 2) % featuredSlides.length].image} alt="Featured Gear 3" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                {featuredSlides[(currentSlide + 2) % featuredSlides.length].product && (!featuredSlides[(currentSlide + 2) % featuredSlides.length].product.stockPerSize || Object.values(featuredSlides[(currentSlide + 2) % featuredSlides.length].product.stockPerSize).every(s => s <= 0)) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
                    <span className="font-anton text-xl text-red-500 border-4 border-red-500 px-4 py-1 rotate-[-15deg] rounded-lg bg-black/50">OUT OF STOCK</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="relative flex-grow w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-black rounded-full py-3 pl-12 pr-6 font-poppins text-[#111] focus:outline-none focus:ring-2 focus:ring-[var(--color-grass)]"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-none">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full border-2 border-black rounded-full px-6 py-3 pr-12 font-poppins font-bold text-sm bg-white hover:bg-gray-50 transition-colors cursor-pointer outline-none uppercase"
              >
                <option value="POPULAR">SHORT : POPULAR</option>
                <option value="LOWEST_PRICE">SHORT : LOWEST PRICE</option>
                <option value="HIGHEST_PRICE">SHORT : HIGHEST PRICE</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
            </div>
            <button onClick={toggleCart} className="relative border-2 border-black rounded-full p-3 flex items-center justify-center bg-white hover:bg-[#c1ff00] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/merch/track">
              <button className="border-2 border-black rounded-full px-6 py-3 font-poppins font-bold text-sm bg-black text-[#c1ff00] hover:bg-[#c1ff00] hover:text-black transition-colors whitespace-nowrap">
                TRACK ORDER
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-4 mb-12 border-b-2 border-gray-300 pb-8">
          {["ALL GEAR", "SAFETY WEAR", "ACCESSORIES"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-8 py-2 rounded-full border-2 border-black font-poppins font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
                activeCategory === tab 
                  ? "bg-[#111] text-white" 
                  : "bg-white text-[#111] hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal flex flex-col cursor-pointer group hover:translate-y-[-4px] transition-transform"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative h-[400px] w-full bg-gray-100 border-b-2 border-black flex items-center justify-center">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#c1ff00] px-6 py-1.5 border-2 border-black rounded-full font-poppins font-bold text-[10px] uppercase tracking-widest shadow-brutal-sm">
                  {product.category}
                </div>
                
                {/* Arrow Overlays Mockup */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent border-2 border-black rounded flex items-center justify-center z-10 hover:bg-white"><span className="font-bold text-[#111]">◀</span></div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent border-2 border-black rounded flex items-center justify-center z-10 hover:bg-white"><span className="font-bold text-[#111]">▶</span></div>
                
                <FadeInImage 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className={`object-cover transition-transform duration-700 group-hover:scale-105 ${product.category === 'ACCESSORIES' ? 'object-contain p-8' : ''}`} 
                />
                {(!product.stockPerSize || Object.values(product.stockPerSize).every(s => s <= 0)) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none">
                    <span className="font-anton text-2xl text-red-500 border-4 border-red-500 px-4 py-1 rotate-[-15deg] rounded-lg bg-black/50">OUT OF STOCK</span>
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col flex-grow relative">
                <h3 className="font-poppins font-medium text-[#111] text-xl mb-1">{product.name}</h3>
                <h2 className="font-anton text-2xl md:text-4xl tracking-wide text-[#111] mb-2">{product.price}</h2>
                <p className="font-poppins text-xs text-[#111] underline font-medium mt-auto">More details</p>
              </div>
            </div>
          ))}
        </div>

        {/* Affiliate Recruitment Banner (Matching Subscribe to Dispatch) */}
        <div className="max-w-6xl mx-auto mt-24 mb-12">
          <div className="bg-[#c1ff00] border-2 border-black rounded-[3rem] p-6 md:p-16 shadow-[12px_12px_0_0_#000] flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/2">
              <span className="bg-white border-2 border-black px-6 py-2 rounded-full text-sm font-bold inline-block mb-6">
                AFFILIATE PROGRAM
              </span>
              <h2 className="font-anton text-3xl md:text-5xl lg:text-7xl uppercase leading-none mb-6">
                JOIN OUR AFFILIATE PROGRAM!
              </h2>
              <p className="text-xl font-medium">
                Help promote YMCC VII Merchandise and earn attractive commissions for every product sold using your referral code.
              </p>
            </div>
            <div className="md:w-1/2 w-full flex flex-col items-end justify-center">
              <div className="w-full flex flex-col sm:flex-row gap-4 mb-4 justify-end">
                <Link href="/affiliate/register" className="bg-black text-white px-10 py-4 rounded-full font-bold uppercase text-lg hover:bg-white hover:text-black hover:border-2 hover:border-black transition-all text-center">
                  REGISTER NOW
                </Link>
              </div>
              <p className="text-sm font-semibold text-gray-800 text-right w-full mt-2">
                Registration is open to the <span className="underline">public</span>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

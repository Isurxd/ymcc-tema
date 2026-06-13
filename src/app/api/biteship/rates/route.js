import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { destinationPostalCode, items } = await req.json();

    if (!destinationPostalCode) {
      return NextResponse.json({ success: false, error: "Destination postal code is required" }, { status: 400 });
    }

    const payload = {
      origin_postal_code: "55283", // UPN Veteran Yogyakarta, Condongcatur
      destination_postal_code: destinationPostalCode,
      couriers: "jne,jnt,sicepat,gojek,grab",
      items: items.map(item => ({
        name: item.name,
        description: "YMCC VII Merchandise",
        value: item.price,
        length: 20,
        width: 20,
        height: 5,
        weight: (item.weight || 500) * item.quantity,
        quantity: item.quantity
      }))
    };

    const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.BITESHIP_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Biteship API error");
    }

    // Filter logic: If distance is far or postal code implies out of region, we shouldn't show Grab/Gojek.
    // However, Biteship automatically handles distance limits for instant couriers (usually ~40km max).
    // But to be strictly safe per user request, we can force remove gojek/grab if price is too high or we detect non-DIY.
    // DIY postal codes generally start with 55.
    let validRates = data.pricing || [];
    
    if (!destinationPostalCode.startsWith("55")) {
      validRates = validRates.filter(rate => rate.courier_company !== "gojek" && rate.courier_company !== "grab");
    }

    return NextResponse.json({
      success: true,
      rates: validRates.map(rate => ({
        courier: rate.courier_name,
        service: rate.courier_service_name,
        price: rate.price,
        duration: rate.duration
      }))
    });

  } catch (err) {
    console.error("Biteship Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

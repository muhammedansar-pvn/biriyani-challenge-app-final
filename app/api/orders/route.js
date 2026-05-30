import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const queryObj = {};
    if (phone) {
      queryObj.phone = phone;
    }

    const orders = await Order.find(queryObj).sort({ createdAt: -1 });
    return Response.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET orders API error:", error);
    return Response.json({ error: error.message || "Failed to retrieve orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { _id, name, phone, place } = body;
    let { packs, packType, singlePacks, familyPacks, paymentStatus, advanceAmount } = body;

    // Backward compatibility for legacy requests
    if (singlePacks === undefined && familyPacks === undefined) {
      packs = parseInt(packs) || 1;
      if (packType === 'family') {
        familyPacks = packs;
        singlePacks = 0;
      } else {
        singlePacks = packs;
        familyPacks = 0;
      }
    } else {
      singlePacks = Math.max(0, parseInt(singlePacks) || 0);
      familyPacks = Math.max(0, parseInt(familyPacks) || 0);
      packs = singlePacks + familyPacks;
      packType = familyPacks > 0 && singlePacks > 0 ? 'mixed' : (familyPacks > 0 ? 'family' : 'single');
    }

    // Validate request body
    if (!_id || !name || !phone || !place) {
      return Response.json({ error: "Missing required order fields" }, { status: 400 });
    }

    if (packs < 1) {
      return Response.json({ error: "Minimum 1 pack required" }, { status: 400 });
    }

    // Auto-calculate totals
    const computedSingleTotal = singlePacks * 100;
    const computedFamilyTotal = familyPacks * 500;
    const computedTotal = computedSingleTotal + computedFamilyTotal;

    // Manage payment calculations
    paymentStatus = paymentStatus || 'Not Paid';
    let computedAdvanceAmount = 0;
    let computedRemainingAmount = computedTotal;

    if (paymentStatus === 'Advance Paid') {
      computedAdvanceAmount = Math.max(0, parseFloat(advanceAmount) || 0);
      computedRemainingAmount = Math.max(0, computedTotal - computedAdvanceAmount);
    } else if (paymentStatus === 'Fully Paid') {
      computedAdvanceAmount = 0;
      computedRemainingAmount = 0;
    } else {
      computedAdvanceAmount = 0;
      computedRemainingAmount = computedTotal;
    }

    const newOrderData = {
      ...body,
      packs,
      packType,
      singlePacks,
      familyPacks,
      singleTotal: computedSingleTotal,
      familyTotal: computedFamilyTotal,
      total: computedTotal,
      paymentStatus,
      advanceAmount: computedAdvanceAmount,
      remainingAmount: computedRemainingAmount,
      status: body.status || 'Pending',
      createdAt: body.createdAt || new Date().toISOString()
    };

    const newOrder = await Order.create(newOrderData);
    return Response.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("POST order API error:", error);
    return Response.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await Order.deleteMany({});
    return Response.json({ message: "All orders wiped clean successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE all orders API error:", error);
    return Response.json({ error: error.message || "Failed to reset database" }, { status: 500 });
  }
}

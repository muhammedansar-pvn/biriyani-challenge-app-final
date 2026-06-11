import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import SystemSettings from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    console.log(`[API GET /api/orders] Query received. Phone filter: "${phone || 'None'}"`);

    await dbConnect();
    console.log(`[API GET /api/orders] Database connection verified successfully.`);

    const queryObj = {};
    if (phone) {
      queryObj.phone = phone;
    }

    const orders = await Order.find(queryObj).sort({ createdAt: -1 });
    console.log(`[API GET /api/orders] Success. Fetched ${orders.length} orders from MongoDB.`);
    return Response.json(orders, { status: 200 });
  } catch (error) {
    console.error("[API GET /api/orders] CRITICAL ERROR:", error);
    return Response.json({ error: error.message || "Failed to retrieve orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log(`[API POST /api/orders] Order creation initiated for ID: "${body._id || 'NEW'}"`);

    await dbConnect();
    console.log(`[API POST /api/orders] Database connection verified successfully.`);

    // Check system lock state before processing order
    const settings = await SystemSettings.findOne();
    if (settings) {
      const now = new Date();
      const isAutoLocked = settings.closingTime && now >= new Date(settings.closingTime);
      if (settings.isLocked || isAutoLocked) {
        console.warn(`[API POST /api/orders] Validation failed: Order rejected because placement is locked.`);
        return Response.json({ error: settings.customMessage || "Ordering is currently closed." }, { status: 403 });
      }
    }

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
      console.warn(`[API POST /api/orders] Validation failed: Missing required fields.`);
      return Response.json({ error: "Missing required order fields" }, { status: 400 });
    }

    if (packs < 1) {
      console.warn(`[API POST /api/orders] Validation failed: Packs count is less than 1.`);
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
    console.log(`[API POST /api/orders] Success. Stored new order ${newOrder._id} in MongoDB.`);
    return Response.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("[API POST /api/orders] CRITICAL ERROR:", error);
    return Response.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log("[API DELETE /api/orders] Wipe-out initiated. Cleaning database...");
    await dbConnect();
    await Order.deleteMany({});
    console.log("[API DELETE /api/orders] Success. Wiped all orders from MongoDB.");
    return Response.json({ message: "All orders wiped clean successfully" }, { status: 200 });
  } catch (error) {
    console.error("[API DELETE /api/orders] CRITICAL ERROR:", error);
    return Response.json({ error: error.message || "Failed to reset database" }, { status: 500 });
  }
}

import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

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
    return Response.json({ error: "Failed to retrieve orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { _id, name, phone, place, packs, packType } = body;

    // Validate request body
    if (!_id || !name || !phone || !place || !packs) {
      return Response.json({ error: "Missing required order fields" }, { status: 400 });
    }

    if (packs < 1) {
      return Response.json({ error: "Minimum 1 pack required" }, { status: 400 });
    }

    const pricePerPack = packType === 'family' ? 500 : 100;
    const computedTotal = packs * pricePerPack;

    const newOrderData = {
      ...body,
      total: computedTotal,
      status: body.status || 'Pending',
      paymentStatus: body.paymentStatus || 'Pending',
      createdAt: body.createdAt || new Date().toISOString()
    };

    const newOrder = await Order.create(newOrderData);
    return Response.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("POST order API error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await Order.deleteMany({});
    return Response.json({ message: "All orders wiped clean successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE all orders API error:", error);
    return Response.json({ error: "Failed to reset database" }, { status: 500 });
  }
}

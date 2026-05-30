import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Fetch existing order to merge and calculate
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Merge changes
    const merged = {
      singlePacks: body.singlePacks !== undefined ? Math.max(0, parseInt(body.singlePacks) || 0) : (existingOrder.singlePacks || 0),
      familyPacks: body.familyPacks !== undefined ? Math.max(0, parseInt(body.familyPacks) || 0) : (existingOrder.familyPacks || 0),
      paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : existingOrder.paymentStatus,
      advanceAmount: body.advanceAmount !== undefined ? Math.max(0, parseFloat(body.advanceAmount) || 0) : (existingOrder.advanceAmount || 0),
    };

    // Calculate totals based on merged values
    const singleTotal = merged.singlePacks * 100;
    const familyTotal = merged.familyPacks * 500;
    const total = singleTotal + familyTotal;

    // Backward compatibility fields
    const packs = merged.singlePacks + merged.familyPacks;
    const packType = merged.familyPacks > 0 && merged.singlePacks > 0 ? 'mixed' : (merged.familyPacks > 0 ? 'family' : 'single');

    // Calculate payments based on merged values
    let advanceAmount = 0;
    let remainingAmount = total;

    if (merged.paymentStatus === 'Advance Paid') {
      advanceAmount = merged.advanceAmount;
      remainingAmount = Math.max(0, total - advanceAmount);
    } else if (merged.paymentStatus === 'Fully Paid') {
      advanceAmount = 0;
      remainingAmount = 0;
    } else {
      advanceAmount = 0;
      remainingAmount = total;
    }

    // Build update object
    const updateObj = {
      ...body,
      singlePacks: merged.singlePacks,
      familyPacks: merged.familyPacks,
      packs,
      packType,
      singleTotal,
      familyTotal,
      total,
      paymentStatus: merged.paymentStatus,
      advanceAmount,
      remainingAmount
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    return Response.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("PUT order API error:", error);
    return Response.json({ error: error.message || "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({ message: "Order deleted successfully", id }, { status: 200 });
  } catch (error) {
    console.error("DELETE order API error:", error);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("PUT order API error:", error);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
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

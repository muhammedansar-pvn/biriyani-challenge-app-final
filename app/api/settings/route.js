import dbConnect from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        isLocked: false,
        closingTime: null,
        customMessage: 'Ordering is currently closed for the Biriyani Challenge.',
      });
    }

    const now = new Date();
    const isAutoLocked = settings.closingTime && now >= new Date(settings.closingTime);

    return Response.json({
      ...settings.toObject(),
      isLocked: settings.isLocked || isAutoLocked,
    }, { status: 200 });
  } catch (error) {
    console.error("GET settings API error:", error);
    return Response.json({ error: error.message || "Failed to retrieve settings" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { isLocked, closingTime, customMessage } = body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        isLocked: isLocked !== undefined ? isLocked : false,
        closingTime: closingTime ? new Date(closingTime) : null,
        customMessage: customMessage || 'Ordering is currently closed for the Biriyani Challenge.',
      });
    } else {
      if (isLocked !== undefined) settings.isLocked = isLocked;
      if (closingTime !== undefined) settings.closingTime = closingTime ? new Date(closingTime) : null;
      if (customMessage !== undefined) settings.customMessage = customMessage;
      await settings.save();
    }

    const now = new Date();
    const isAutoLocked = settings.closingTime && now >= new Date(settings.closingTime);

    return Response.json({
      ...settings.toObject(),
      isLocked: settings.isLocked || isAutoLocked,
    }, { status: 200 });
  } catch (error) {
    console.error("POST settings API error:", error);
    return Response.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}

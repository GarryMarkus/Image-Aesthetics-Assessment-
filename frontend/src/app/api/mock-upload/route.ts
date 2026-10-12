import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key") || `upload_${Date.now()}.jpg`;
    // Consume stream
    const arrayBuffer = await req.arrayBuffer();
    
    return NextResponse.json({
      success: true,
      key,
      sizeBytes: arrayBuffer.byteLength,
      message: "Binary upload received cleanly.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to accept binary stream" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_ORDER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VERIFICATION_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function getFolder(purpose: string, userId: string) {
  const base = process.env.CLOUDINARY_UPLOAD_FOLDER || "thehood";
  return `${base}/${purpose}/${userId}`;
}

function validateUpload(file: File, purpose: string) {
  if (purpose === "order-image") {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed for order uploads";
    }
    if (file.size > MAX_ORDER_IMAGE_SIZE_BYTES) {
      return "Each order image must be 5MB or smaller";
    }
    return null;
  }

  if (purpose === "verification-file") {
    const allowed =
      file.type === "application/pdf" ||
      file.type.startsWith("image/");
    if (!allowed) {
      return "Verification files must be PDF or image";
    }
    if (file.size > MAX_VERIFICATION_FILE_SIZE_BYTES) {
      return "Each verification file must be 8MB or smaller";
    }
    return null;
  }

  return "Invalid upload purpose";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({ error: "Account is banned" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (purpose === "verification-file" && session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Only providers can upload verification files" },
        { status: 403 }
      );
    }

    const validationError = validateUpload(file, purpose);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = getFolder(purpose, session.user.id);

    const uploaded = await uploadBufferToCloudinary(buffer, {
      folder,
      resourceType: "auto",
    });

    return NextResponse.json({
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {

  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const upload = await new Promise<any>((resolve, reject) => {

    cloudinary.uploader.upload_stream(
      {
        folder: "capiltrack",
      },
      (error, result) => {

        if (error) reject(error)
        else resolve(result)

      }
    ).end(buffer)

  })

  return NextResponse.json({
    url: upload.secure_url
  })
}

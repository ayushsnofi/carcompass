import { NextRequest, NextResponse } from "next/server";
import { getUserSearchById } from "@/src/infrastructure/repos/searchRepo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const search = await getUserSearchById(id);

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  return NextResponse.json(search);
}

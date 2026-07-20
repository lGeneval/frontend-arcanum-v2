import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { hasValidOrigin } from "@/lib/request-security";
export async function POST(request:NextRequest){if(!hasValidOrigin(request))return NextResponse.json({error:"forbidden"},{status:403});await destroySession();return NextResponse.redirect(new URL("/",request.url),303)}

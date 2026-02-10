import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

const KEY = 'financeAppData';

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const data = await redis.get(KEY);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(request: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    await redis.set(KEY, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

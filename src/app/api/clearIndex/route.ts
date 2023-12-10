import { NextResponse } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone'

export async function POST() {
  // Instantiate a new Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    // use TypeScript's non-null assertion operator (!) to assert that the value is not undefined
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  // Select the desired index
  const index = pinecone.index(process.env.PINECONE_INDEX!)

  // Use the custom namespace, if provided, otherwise use the default (I think this is only available for paid version)
  // const namespaceName = process.env.PINECONE_NAMESPACE ?? ""
  // const namespace = index.namespace(namespaceName)
  // Delete everything within the namespace
  // await namespace.deleteAll(); for paid
  await index.deleteAll();

  return NextResponse.json({
    success: true
  })
}
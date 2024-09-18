import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = await client.index("chatpdf");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    const queryResult = await namespace.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}

export async function getContext(query: string, fileKey: string) {
  if (!query || !fileKey) {
    console.error("Invalid input: query or fileKey is empty");
    return "";
  }

  try {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    const qualifyingDocs = matches.filter(
      (match) => match.score && match.score > 0.7
    );

    type Metadata = {
      text: string;
      pageNumber: number;
    };

    let docs = qualifyingDocs
      .map((match) => (match.metadata as Metadata)?.text)
      .filter(Boolean); // Remove any undefined or null values

    // Join the docs and substring safely
    return docs.join("\n").substring(0, 3000);
  } catch (error) {
    console.error("Error in getContext:", error);
    return ""; // Return an empty string in case of error
  }
}
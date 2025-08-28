import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Product, ProductRecord } from "../../types/product";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
// pass dynamo client into dynamodb document
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// Environment variables
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const PRODUCT_IMAGES_BUCKET_NAME = process.env.PRODUCT_IMAGES_BUCKET_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Request body is required",
        }),
      };
    }
    const product: Product = JSON.parse(event.body);

    if (
      !product.name ||
      !product.description ||
      typeof product.price !== "number" ||
      !product.imageData
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "All fields are required: name, description, price, and image",
        }),
      };
    }

    // Generate unique ID for the product
    const productId = uuidv4();
    const timestamp = new Date().toISOString();

    // Upload image to S3
    let imageUrl: string;

    try {
      console.log("Starting S3 upload process...");
      console.log("Bucket name:", PRODUCT_IMAGES_BUCKET_NAME);

      // turn image string into buffer

      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = product.imageData.replace(
        /^data:image\/[a-z]+;base64,/,
        ""
      );

      // image data in the buffer. we need to use it to upload the image into our bucket
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Determine file extension from base64 data
      const fileExtension = product.imageData.includes("data:image/jpeg")
        ? "jpg"
        : product.imageData.includes("data:image/png")
        ? "png"
        : product.imageData.includes("data:image/gif")
        ? "gif"
        : "jpg";

      // unique identifier of this object
      const s3Key = `products/${productId}.${fileExtension}`;

      console.log("S3 upload parameters:", {
        bucket: PRODUCT_IMAGES_BUCKET_NAME,
        key: s3Key,
        contentType: `image/${fileExtension}`,
        bufferSize: imageBuffer.length,
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: PRODUCT_IMAGES_BUCKET_NAME,
          Key: s3Key,
          Body: imageBuffer,
          ContentType: `images/${fileExtension}`,
        })
      );

      imageUrl = `https://${PRODUCT_IMAGES_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

      console.log("Image uploaded to S3 successfully:", imageUrl);
    } catch (error) {}
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "create product" }),
    };
  } catch (error) {}
};

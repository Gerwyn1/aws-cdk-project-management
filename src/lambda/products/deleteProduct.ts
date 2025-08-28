import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ProductRecord } from "../../types/product";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
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
    // Get product ID from path parameters
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Product ID is required",
        }),
      };
    }

    // First, get the product to retrieve the image URL
    let product: ProductRecord;
    try {
      const getResult = await docClient.send(
        new GetCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Key: { id: productId },
        })
      );

      if (!getResult.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: "Product not found",
          }),
        };
      }

      product = getResult.Item as ProductRecord;
   
    } catch (dynamoError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to retrieve product",
        }),
      };
    }

    // Delete image from S3 if it exists
    if (product.imageUrl) {
      try {
        // Extract S3 key from the URL
        const urlParts = product.imageUrl.split("/");
        const s3Key = urlParts.slice(3).join("/"); // Remove https://bucket-name.s3.amazonaws.com/

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: PRODUCT_IMAGES_BUCKET_NAME,
            Key: s3Key,
          })
        );
        console.log("Image deleted from S3:", s3Key);
      } catch (s3Error) {
        console.error("Error deleting image from S3:", s3Error);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete product from DynamoDB
    try {
      
    } catch (error) {
      
    }

    // END
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "delete product" }),
    };
  } catch (error) {}
};

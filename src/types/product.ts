// Product-related interfaces used across Lambda functions


// what we are getting from the api or what we're expecting from the extension or frontend
export type Product = {
  name: string;
  description: string;
  price: number;
  imageData: string; // Base64 encoded image data
};


// working with dynamodb: set up a type which represents that instance
export type ProductRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // point to the object in s3 bucket
  createdAt: string;
  updatedAt: string;
};

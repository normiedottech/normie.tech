import * as pulumi from "@pulumi/pulumi";

export const paymentImagesBucket = new sst.aws.Bucket("PaymentImagesBucket", {
  access: "public", 
  cors: {
    allowHeaders: ["*"],
    allowMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
    allowOrigins: ["*"], 
    exposeHeaders: ["ETag"],
    maxAge: "3000 seconds",
  } 
});

// Optional: Create CloudFront CDN for better global performance
export const paymentImagesCDN = new sst.aws.Cdn("PaymentImagesCDN", {
  origins: [
    {
      domainName: paymentImagesBucket.domain,
      originId: "s3-origin",
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"], // Add required SSL protocols
      },
    },
  ],
  defaultCacheBehavior: {
    targetOriginId: "s3-origin",
    viewerProtocolPolicy: "redirect-to-https",
    compress: true,
    cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // AWS Managed CachingOptimized
    originRequestPolicyId: "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf", // AWS Managed CORS-S3Origin
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
  },
  comment: "CDN for payment link product images",
});

// Create IAM policy for S3 access using pulumi.interpolate for Output handling
export const s3Policy = new aws.iam.Policy("PaymentImagesS3Policy", {
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "${paymentImagesBucket.arn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${paymentImagesBucket.arn}"
      }
    ]
  }`,
});

export const outputs = {
  paymentImagesBucket: paymentImagesBucket.name,
  paymentImagesBucketArn: paymentImagesBucket.arn,
  paymentImagesBucketDomain: paymentImagesBucket.domain,
  paymentImagesCDN: paymentImagesCDN.url,
  s3PolicyArn: s3Policy.arn,
};

